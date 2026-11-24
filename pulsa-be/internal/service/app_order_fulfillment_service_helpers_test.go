package service

import (
	"regexp"
	"testing"

	"pulsa2/internal/repository"
)

func TestAppOrderProviderImmediateRejectPulsa24Jam(t *testing.T) {
	tests := []struct {
		name string
		body string
		want bool
	}{
		{
			name: "insufficient provider balance",
			body: `{"message":"saldo tidak cukup","ok":true,"refid":"INV-1","status":3}`,
			want: true,
		},
		{
			name: "numeric rejected status",
			body: `{"message":"produk tidak ditemukan","ok":true,"refid":"INV-2","status":3}`,
			want: true,
		},
		{
			name: "pending accepted",
			body: `{"message":"Transaksi sedang diproses","ok":true,"refid":"INV-3","status":"pending"}`,
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := appOrderProviderImmediateReject("pulsa24jam", tt.body); got != tt.want {
				t.Fatalf("appOrderProviderImmediateReject() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestAppOrderProviderTimeoutPulsa24JamStaysPending(t *testing.T) {
	body := `{"ok":true,"refid":"PKA2B","status":1,"message":"Provider timeout"}`
	if appOrderProviderLooksLikeSystemIssue("pulsa24jam", body) {
		t.Fatal("pulsa24jam timeout must not be treated as system failure for app orders")
	}
	if !appOrderProviderLooksLikePending("pulsa24jam", body) {
		t.Fatal("pulsa24jam timeout should stay pending for status-pay/callback reconciliation")
	}
	if !appOrderProviderLooksLikeAccepted("pulsa24jam", body) {
		t.Fatal("pulsa24jam timeout should be accepted as pending")
	}
}

func TestAppOrderProviderProductUnavailable(t *testing.T) {
	if !appOrderProviderProductUnavailable("pulsa24jam", `{"message":"Produk kehabisan stok","status":3}`) {
		t.Fatal("out-of-stock response should quarantine the product")
	}
	if appOrderProviderProductUnavailable("pulsa24jam", `{"message":"Nomor tujuan salah","status":3}`) {
		t.Fatal("business rejection unrelated to stock must not quarantine the product")
	}
	if appOrderProviderProductUnavailable("yuscom", `{"message":"Produk kehabisan stok","status":3}`) {
		t.Fatal("only Pulsa24Jam products should be quarantined")
	}
}

func TestAppOrderProviderShouldQuarantineAppProduct(t *testing.T) {
	if !appOrderProviderShouldQuarantineAppProduct("pulsa24jam", `{"message":"Transaksi gagal","status":3}`) {
		t.Fatal("generic Pulsa24Jam app failure should quarantine the product")
	}
	if appOrderProviderShouldQuarantineAppProduct("pulsa24jam", `{"message":"Nomor tujuan salah","status":3}`) {
		t.Fatal("destination-specific failure should not quarantine the product")
	}
	if appOrderProviderShouldQuarantineAppProduct("yuscom", `{"message":"Transaksi gagal","status":3}`) {
		t.Fatal("only Pulsa24Jam app products should be quarantined")
	}
}

func TestResolvePulsa24JamAppRequest(t *testing.T) {
	tests := []struct {
		name        string
		order       repository.AppOrderRow
		wantProduct string
		wantQty     int64
	}{
		{
			name:        "fixed dana uses open amount route",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "UDDND10", ProdukNamaSnapshot: "Dana 10.000", Qty: 1, HargaDasar: 11055},
			wantProduct: "DANA", wantQty: 10000,
		},
		{
			name:        "fixed gopay uses open amount route",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "UDGP10", ProdukNamaSnapshot: "Gopay 10.000", Qty: 1, HargaDasar: 11650},
			wantProduct: "GOPAY", wantQty: 10000,
		},
		{
			name:        "gopay driver keeps dedicated route",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "UDGD15", ProdukNamaSnapshot: "Gopay Driver 15.000", Qty: 1, HargaDasar: 16450},
			wantProduct: "UDGD15", wantQty: 1,
		},
		{
			name:        "verified open amount SKU preserves the checkout amount",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "GPC100", ProdukNamaSnapshot: "SALDO GOPAY CUSTOMER H2H 100.000", Qty: 100000, Nominal: 100000, HargaDasar: 101200},
			wantProduct: "GPC100", wantQty: 100000,
		},
		{
			name:        "open amount remains unchanged",
			order:       repository.AppOrderRow{ProdukSKUSnapshot: "DANA", ProdukNamaSnapshot: "Dana Bebas Nominal", Qty: 25000, HargaDasar: 26000},
			wantProduct: "DANA", wantQty: 25000,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			product, qty := resolvePulsa24JamAppRequest(tt.order.ProdukSKUSnapshot, &tt.order)
			if product != tt.wantProduct || qty != tt.wantQty {
				t.Fatalf("got product=%s qty=%d, want product=%s qty=%d", product, qty, tt.wantProduct, tt.wantQty)
			}
		})
	}
}

func TestPulsa24JamAppOrderRefIDFitsH2HRLimit(t *testing.T) {
	got, err := pulsa24JamAppOrderRefID(&repository.AppOrderRow{
		ID:        81,
		InvoiceID: "INV-20260921170504-F95D2B50",
	}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if !regexp.MustCompile(`^TPA[A-Z2-7]{17}$`).MatchString(got) {
		t.Fatalf("expected 20-character namespaced alphanumeric refid, got %q", got)
	}
}

func TestPulsa24JamAppOrderRefIDDoesNotRepeatAfterDatabaseReset(t *testing.T) {
	old := &repository.AppOrderRow{ID: 14, InvoiceID: "INV-20261007051342-11111111"}
	current := &repository.AppOrderRow{ID: 14, InvoiceID: "INV-20261124124438-8C298062"}
	oldRef, oldErr := pulsa24JamAppOrderRefID(old, nil)
	currentRef, currentErr := pulsa24JamAppOrderRefID(current, nil)
	if oldErr != nil || currentErr != nil {
		t.Fatalf("old=%v current=%v", oldErr, currentErr)
	}
	if oldRef == currentRef || currentRef == "PKAE" {
		t.Fatal("different invoices reused a provider refid after database reset")
	}
}

func TestPulsa24JamAppOrderRefIDStableForSameInvoice(t *testing.T) {
	invoice := "INV-20261124124438-8C298062"
	first, err := pulsa24JamAppOrderRefID(&repository.AppOrderRow{ID: 14, InvoiceID: invoice}, nil)
	if err != nil {
		t.Fatal(err)
	}
	retry, err := pulsa24JamAppOrderRefID(&repository.AppOrderRow{ID: 999, InvoiceID: invoice}, nil)
	if err != nil || first != retry {
		t.Fatalf("refid changed for the same invoice: %q / %q, err=%v", first, retry, err)
	}
	differentYear, err := pulsa24JamAppOrderRefID(&repository.AppOrderRow{ID: 14, InvoiceID: "INV-20271124124438-8C298062"}, nil)
	if err != nil || first == differentYear {
		t.Fatal("refid must include the full invoice, not a truncated suffix")
	}
}

func TestPulsa24JamAppOrderRefIDPreservesExistingAttempt(t *testing.T) {
	order := &repository.AppOrderRow{ID: 14, InvoiceID: "INV-20261124124438-8C298062"}
	for _, ref := range []string{"PKAE", "PKA1081446377D6CC96B", "TPAABCDEFGHIJKLMNOPQ"} {
		previous := &repository.AppOrderProviderTrxRow{AppOrderID: 14, Provider: "pulsa24jam", RefID: ref}
		got, err := pulsa24JamAppOrderRefID(order, previous)
		if err != nil || got != ref {
			t.Fatalf("existing attempt must retain refid %q: got=%q err=%v", ref, got, err)
		}
	}
}

func TestPulsa24JamAppOrderRefIDRejectsMissingIdentity(t *testing.T) {
	for _, order := range []*repository.AppOrderRow{nil, {ID: 14}, {InvoiceID: " "}} {
		if _, err := pulsa24JamAppOrderRefID(order, nil); err == nil {
			t.Fatal("missing invoice must not generate a shared refid")
		}
	}
	order := &repository.AppOrderRow{ID: 14, InvoiceID: "INV-20261124124438-8C298062"}
	for _, previous := range []*repository.AppOrderProviderTrxRow{
		{AppOrderID: 15, Provider: "pulsa24jam", RefID: "PKAE"},
		{AppOrderID: 14, Provider: "other", RefID: "PKAE"},
		{AppOrderID: 14, Provider: "pulsa24jam", RefID: " "},
	} {
		if _, err := pulsa24JamAppOrderRefID(order, previous); err == nil {
			t.Fatal("invalid stored identity must not generate a new payment refid")
		}
	}
}

func TestPulsa24JamLockedGopayNominal(t *testing.T) {
	tests := []struct {
		name string
		row  repository.ProdukRow
		want int64
	}{
		{
			name: "h2hr label does not parse the 2",
			row:  repository.ProdukRow{SKU: "GPC100", Nama: "SALDO GOPAY CUSTOMER H2HR 100.000"},
			want: 100000,
		},
		{
			name: "adm variant parses product nominal before adm fee",
			row:  repository.ProdukRow{SKU: "GPCAD1000", Nama: "GOPAY CUSTOMER 1000.000 (ADM:1000)"},
			want: 1000000,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, ok := pulsa24JamLockedGopayNominal(&tt.row)
			if !ok || got != tt.want {
				t.Fatalf("got nominal=%d ok=%v, want nominal=%d ok=true", got, ok, tt.want)
			}
		})
	}
}
