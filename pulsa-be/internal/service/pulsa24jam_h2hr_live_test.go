package service

import (
	"context"
	"os"
	"testing"
	"time"

	"pulsa2/internal/provider"
)

// Opt-in diagnostic: only requests the catalog, never creates or pays an order.
func TestH2HRLiveCatalogReadOnly(t *testing.T) {
	if os.Getenv("TOPUNA_P24_READ_ONLY_TEST") != "1" {
		t.Skip("live read-only catalog check is disabled")
	}
	client := provider.NewPulsa24JamAdapter(provider.Pulsa24JamConfig{
		BaseURL: os.Getenv("PULSA24JAM_BASE_URL"), MemberID: os.Getenv("PULSA24JAM_MEMBERID"),
		APIKey: os.Getenv("PULSA24JAM_API_KEY"), PIN: os.Getenv("PULSA24JAM_PIN"), Timeout: 20 * time.Second,
	})
	service := &AppOrderService{pulsa24JamClient: client}
	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()
	product, err := service.validatePulsa24JamProduct(ctx, "GOPAY")
	if err != nil {
		t.Fatal("live catalog validation failed; check provider configuration and availability")
	}
	price, err := pulsa24JamCatalogPrice(*product)
	if err != nil || price < 0 || product.PriceType != "OPEN_AMOUNT" {
		t.Fatal("invalid live open-amount catalog price")
	}
	t.Logf("Validated %s: %s, provider fee Rp %d; no order/payment sent", product.SKU, product.PriceType, price)
}
