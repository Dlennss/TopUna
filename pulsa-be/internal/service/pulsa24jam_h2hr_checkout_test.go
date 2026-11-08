package service

import (
	"context"
	"pulsa2/internal/provider"
	"pulsa2/internal/repository"
	"testing"
)

func TestH2HRCheckoutRequiresConfiguredProvider(t *testing.T) {
	s := &AppOrderService{}
	for _, sku := range []string{"GOPAY", "INVENTED-SKU"} {
		if _, err := s.validatePulsa24JamProduct(context.Background(), sku); err == nil {
			t.Fatal("unverified checkout accepted")
		}
	}
}

func TestH2HRDoesNotTreatFeeAsFixedPrice(t *testing.T) {
	fee := int64(1000)
	if _, err := pulsa24JamCatalogPrice(provider.Pulsa24JamProduct{SKU: "T10", PriceType: "FIXED", AdditionalFee: &fee}); err == nil {
		t.Fatal("fee accepted as fixed price")
	}
	if got, err := pulsa24JamCatalogPrice(provider.Pulsa24JamProduct{SKU: "DANA", PriceType: "OPEN_AMOUNT", AdditionalFee: &fee}); err != nil || got != fee {
		t.Fatalf("price=%d err=%v", got, err)
	}
}

func TestH2HROpenAmountUsesInputNotName(t *testing.T) {
	p := &repository.ProdukRow{SKU: "GPC100", Nama: "SALDO GOPAY CUSTOMER H2H 100.000", TipeHarga: "OPEN_AMOUNT"}
	nominal, qty, err := resolveOrderNominal(p, 25000, 1200, false)
	if err != nil || nominal != 25000 || qty != 25000 {
		t.Fatalf("nominal=%d qty=%d err=%v", nominal, qty, err)
	}
}

func TestH2HRDispatchRejectsLegacyAmountOrSKURewrite(t *testing.T) {
	order := &repository.AppOrderRow{ProdukSKUSnapshot: "GPC100", Qty: 1, Nominal: 100000}
	if validateH2HRDispatch("GPC100", order) == nil {
		t.Fatal("legacy inconsistent qty accepted")
	}
	order.Qty = 100000
	if err := validateH2HRDispatch("GPC100", order); err != nil {
		t.Fatal(err)
	}
	if validateH2HRDispatch("GOPAY", order) == nil {
		t.Fatal("SKU rewrite accepted")
	}
}
