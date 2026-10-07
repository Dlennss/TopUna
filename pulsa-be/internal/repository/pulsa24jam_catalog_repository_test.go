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
