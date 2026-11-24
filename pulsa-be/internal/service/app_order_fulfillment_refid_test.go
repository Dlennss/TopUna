package service

import (
	"context"
	"testing"

	"pulsa2/internal/provider"
	"pulsa2/internal/repository"
)

type refIDCaptureClient struct {
	request provider.PayRequest
}

func (c *refIDCaptureClient) Name() string { return "pulsa24jam" }

func (c *refIDCaptureClient) Pay(_ context.Context, request provider.PayRequest) (*provider.PayResponse, error) {
	c.request = request
	return &provider.PayResponse{HTTPStatus: 200, Body: `{"status":1,"message":"pending"}`}, nil
}

func TestCallAppOrderProviderUsesStoredRefID(t *testing.T) {
	order := &repository.AppOrderRow{ID: 14, InvoiceID: "INV-20261124124438-8C298062", ProdukSKUSnapshot: "GOPAY", Dest: "081234567890", Qty: 50000, Nominal: 50000}
	newRef, err := pulsa24JamAppOrderRefID(order, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, ref := range []string{"PKAE", newRef} {
		client := &refIDCaptureClient{}
		service := &AppOrderFulfillmentService{providerClients: map[string]provider.Client{"pulsa24jam": client}}
		_, _, _, _, err := service.callAppOrderProvider(context.Background(), "pulsa24jam", "GOPAY", ref, order.Qty, order)
		if err != nil {
			t.Fatal(err)
		}
		if client.request.RefID != ref {
			t.Fatalf("persisted refid %q was rewritten to %q", ref, client.request.RefID)
		}
		if client.request.Product != "GOPAY" || client.request.Qty != 50000 || client.request.Dest != order.Dest || client.request.Command != "PAY" {
			t.Fatal("SKU, destination, nominal or command changed")
		}
	}
}
