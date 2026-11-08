package catalog

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"
)

//go:embed pulsa24jam_h2hr.json
var snapshot []byte

type Product struct {
	Category       string
	Brand          string
	SKU            string
	Name           string
	GroupName      string
	PriceType      string
	Price          int64
	MaximumNominal string
}

var products = loadSnapshot()

func loadSnapshot() map[string]Product {
	var data struct {
		SourceSHA256 string
		Products     []Product
	}
	if err := json.Unmarshal(snapshot, &data); err != nil {
		panic(err)
	}
	if len(data.Products) == 0 || len(data.SourceSHA256) != 64 {
		panic("invalid H2HR snapshot provenance")
	}
	out := make(map[string]Product, len(data.Products))
	for _, item := range data.Products {
		if _, duplicate := out[item.SKU]; duplicate || item.SKU == "" || item.Price < 0 || (item.PriceType != "FIXED" && item.PriceType != "OPEN_AMOUNT") {
			panic(fmt.Sprintf("invalid H2HR snapshot SKU: %s", item.SKU))
		}
		out[item.SKU] = item
	}
	return out
}

// Lookup is restricted to internal SKUs in the supplied H2HR member export.
// Prices in the snapshot are not a substitute for a live checkout price check.
func Lookup(sku string) (Product, bool) {
	item, ok := products[strings.ToUpper(strings.TrimSpace(sku))]
	return item, ok
}
