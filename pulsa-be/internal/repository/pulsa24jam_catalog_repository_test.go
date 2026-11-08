package repository

import "testing"

func TestNormalizePulsa24JamCatalogItemPreservesUpstreamOpenAmount(t *testing.T) {
	item := normalizePulsa24JamCatalogItem(Pulsa24JamCatalogItem{
		SKU:       "gpcad1000",
		Name:      "GOPAY CUSTOMER 1000.000 (ADM:1000)",
		PriceType: "OPEN_AMOUNT",
	})
	if item.PriceType != "OPEN_AMOUNT" {
		t.Fatalf("PriceType = %q, want OPEN_AMOUNT", item.PriceType)
	}
	if item.Nominal != nil {
		t.Fatalf("Nominal = %v, must not infer amount from name", item.Nominal)
	}
}

func TestNormalizePulsa24JamCatalogItemDoesNotInventDanaNominal(t *testing.T) {
	item := normalizePulsa24JamCatalogItem(Pulsa24JamCatalogItem{
		SKU:       "dana1p",
		Name:      "E-WALLET DANA 1.000 PROMO",
		PriceType: "OPEN_AMOUNT",
	})
	if item.PriceType != "OPEN_AMOUNT" {
		t.Fatalf("PriceType = %q, want OPEN_AMOUNT", item.PriceType)
	}
	if item.Nominal != nil {
		t.Fatalf("Nominal = %v, must not infer amount from name", item.Nominal)
	}
}

func TestNormalizePulsa24JamKeepsOriginalName(t *testing.T) {
	item := normalizePulsa24JamCatalogItem(Pulsa24JamCatalogItem{SKU: "GPC100", Name: "SALDO GOPAY CUSTOMER H2H 100.000", PriceType: "OPEN_AMOUNT"})
	if item.Name != "SALDO GOPAY CUSTOMER H2H 100.000" {
		t.Fatal(item.Name)
	}
}

func TestNormalizePulsa24JamCatalogItemKeepsOpenAmount(t *testing.T) {
	item := normalizePulsa24JamCatalogItem(Pulsa24JamCatalogItem{
		SKU:       "gopay",
		Name:      "E-WALLET 2.500 GOPAY OPEN AMOUNT",
		PriceType: "OPEN_AMOUNT",
	})
	if item.PriceType != "OPEN_AMOUNT" {
		t.Fatalf("PriceType = %q, want OPEN_AMOUNT", item.PriceType)
	}
	if item.Nominal != nil {
		t.Fatalf("Nominal = %v, want nil", item.Nominal)
	}
}
