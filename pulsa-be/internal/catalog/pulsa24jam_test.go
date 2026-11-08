package catalog

import (
	"strings"
	"testing"
)

func TestH2HRSnapshotCompleteness(t *testing.T) {
	if len(products) != 15296 {
		t.Fatalf("products=%d", len(products))
	}
	fixed := 0
	brands, categories := map[string]bool{}, map[string]bool{}
	for _, p := range products {
		if p.PriceType == "FIXED" {
			fixed++
		}
		brands[strings.ToLower(p.Brand)], categories[p.Category] = true, true
	}
	if fixed != 6563 || len(brands) != 199 || len(categories) != 23 {
		t.Fatalf("fixed=%d brands=%d categories=%d", fixed, len(brands), len(categories))
	}
}

func TestH2HRPreservesSourceTerms(t *testing.T) {
	p, ok := Lookup("gpc100")
	if !ok || p.Name != "SALDO GOPAY CUSTOMER H2H 100.000" || p.PriceType != "OPEN_AMOUNT" || p.Price != 1200 || p.GroupName != "PULSA" {
		t.Fatalf("unexpected product: %+v", p)
	}
	if _, ok := Lookup("INVENTED-SKU"); ok {
		t.Fatal("unknown SKU accepted")
	}
}
