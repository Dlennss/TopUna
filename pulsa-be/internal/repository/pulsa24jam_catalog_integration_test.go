package repository

import (
	"context"
	"database/sql"
	_ "github.com/lib/pq"
	"os"
	"testing"
)

func TestH2HRCatalogSyncIntegration(t *testing.T) {
	dsn := os.Getenv("H2HR_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("disposable catalog fixture database not configured")
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	var user string
	if err := db.QueryRow("SELECT current_user").Scan(&user); err != nil || user != "catalog_test" {
		t.Fatal("only disposable catalog_test database is allowed")
	}
	repo := NewPulsa24JamCatalogRepository(db)
	ctx := context.Background()
	if _, err := repo.Sync(ctx, []Pulsa24JamCatalogItem{{SKU: "GOPAY", Name: "Bad", PriceType: "FIXED", Price: 1200}}); err == nil {
		t.Fatal("type mismatch accepted")
	}
	var active bool
	if err := db.QueryRow("SELECT a.aktif FROM produk_app_pricing a JOIN produk p ON p.id=a.produk_id WHERE p.sku='DANA'").Scan(&active); err != nil || !active {
		t.Fatal("failed sync did not roll back", err)
	}
	result, err := repo.Sync(ctx, []Pulsa24JamCatalogItem{
		{SKU: "GOPAY", Name: "Untrusted label", CategoryName: "Wrong", PriceType: "OPEN_AMOUNT", Price: 1200},
		{SKU: "DANA", Name: "DANA", PriceType: "OPEN_AMOUNT", Price: 1000},
		{SKU: "GPC100", Name: "GPC", PriceType: "OPEN_AMOUNT", Price: 1200},
		{SKU: "NOT-IN-H2HR", Name: "Foreign", PriceType: "FIXED", Price: 10000},
	})
	if err != nil || result.Synced != 3 {
		t.Fatalf("result=%+v error=%v", result, err)
	}
	var name, category, priceType string
	var nominal sql.NullInt64
	if err := db.QueryRow("SELECT p.nama,k.nama,p.tipe_harga,p.nominal FROM produk p JOIN kategori k ON k.id=p.kategori_id WHERE p.sku='GOPAY'").Scan(&name, &category, &priceType, &nominal); err != nil {
		t.Fatal(err)
	}
	if name != "E-WALLET 2.500 GOPAY OPEN AMOUNT" || category != "E-Wallet" || priceType != "OPEN_AMOUNT" || nominal.Valid {
		t.Fatal("snapshot terms changed")
	}
	var count int
	if err := db.QueryRow("SELECT count(*) FROM produk WHERE sku='NOT-IN-H2HR'").Scan(&count); err != nil || count != 0 {
		t.Fatal("foreign SKU imported", err)
	}
	if err := db.QueryRow("SELECT a.aktif FROM produk_app_pricing a JOIN produk p ON p.id=a.produk_id WHERE p.sku='GPC100'").Scan(&active); err != nil || active {
		t.Fatal("quarantine lost", err)
	}
}
