package provider

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPulsa24JamPayPreservesH2HRRequestAndStatus(t *testing.T) {
	for _, status := range []struct{ wire, want string }{
		{"1", "1"}, {"2", "2"}, {"3", "3"}, {`"3"`, "3"},
		{`"pending"`, "pending"}, {`"success"`, "success"}, {`"failed"`, "failed"},
		{"null", ""},
	} {
		for _, amount := range []int64{20000, 60000} {
			t.Run(fmt.Sprintf("%s/%d", status.wire, amount), func(t *testing.T) {
				body := fmt.Sprintf(`{"ok":true,"status":%s,"refid":"TESTONLY9","message":"provider result","price":%d,"balance":62265}`, status.wire, amount+1200)
				server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					if r.Method != http.MethodPost || r.URL.Path != "/v2/trx" || r.Header.Get("X-Api-Key") != "test-key" {
						t.Error("incorrect transport or authentication header")
					}
					var request pulsa24JamPayRequest
					if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
						t.Error(err)
					}
					if request.Commands != "PAY" || request.Product != "GOPAY" || request.Dest != "081234567890" || request.Qty != amount || request.RefID != "TESTONLY9" || request.MemberID != "test-member" || request.PIN != "test-pin" {
						t.Error("checkout fields were changed before provider dispatch")
					}
					w.Header().Set("Content-Type", "application/json")
					_, _ = w.Write([]byte(body))
				}))
				defer server.Close()
				adapter := NewPulsa24JamAdapter(Pulsa24JamConfig{BaseURL: server.URL + "/v2/trx", MemberID: "test-member", APIKey: "test-key", PIN: "test-pin"})
				response, err := adapter.Pay(context.Background(), PayRequest{Command: "PAY", Product: "GOPAY", Dest: "081234567890", Qty: amount, RefID: "TESTONLY9"})
				if err != nil {
					t.Fatal(err)
				}
				if response.Raw["status"] != status.want {
					t.Fatalf("status = %v, want %s", response.Raw["status"], status.want)
				}
				if response.Body != body || response.Price != amount+1200 || response.Balance != 62265 {
					t.Fatal("provider response was not preserved")
				}
				payload := response.RequestRaw["payload"].(map[string]any)
				if payload["pin"] != "***" {
					t.Fatal("PIN must not be exposed in diagnostic payload")
				}
			})
		}
	}
}

func TestPulsa24JamStatusRejectsInvalidShape(t *testing.T) {
	for _, raw := range []string{`true`, `{}`, `[]`, `1.5`} {
		var response pulsa24JamPayResponse
		if err := json.Unmarshal([]byte(`{"status":`+raw+`}`), &response); err == nil {
			t.Fatalf("invalid status accepted: %s", raw)
		}
	}
}
