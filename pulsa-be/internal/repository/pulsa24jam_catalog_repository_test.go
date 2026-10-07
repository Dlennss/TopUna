package repository

import "testing"

func TestNormalizePulsa24JamCatalogItemLocksNominalBeforeADM(t *testing.T) {
	item := normalizePulsa24JamCatalogItem(Pulsa24JamCatalogItem{
		SKU:       "gpcad1000",
		Name:      "GOPAY CUSTOMER 1000.000 (ADM:1000)",
		PriceType: "OPEN_AMOUNT",
	})
	if item.PriceType != "FIXED" {
		t.Fatalf("PriceType = %q, want FIXED", item.PriceType)
	}
	if item.Nominal == nil || *item.Nominal != 1000000 {
		t.Fatalf("Nominal = %v, want 1000000", item.Nominal)
	}
}

func TestNormalizePulsa24JamCatalogItemLocksDanaPromoNominal(t *testing.T) {
	item := normalizePulsa24JamCatalogItem(Pulsa24JamCatalogItem{
		SKU:       "dana1p",
		Name:      "E-WALLET DANA 1.000 PROMO",
		PriceType: "OPEN_AMOUNT",
	})
	if item.PriceType != "FIXED" {
		t.Fatalf("PriceType = %q, want FIXED", item.PriceType)
	}
	if item.Nominal == nil || *item.Nominal != 1000 {
		t.Fatalf("Nominal = %v, want 1000", item.Nominal)
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
