package main

import (
	"strings"
	"testing"
)

func fixture() []string {
	return strings.Split("Total Produk Aktif\n2\nProduk Dengan Harga Tetap\n1\nE-Wallet\nGOPAY\nSKU\nKeterangan\nHarga\nGPC100\nSALDO GOPAY CUSTOMER H2H 100.000\nPULSA\nOPEN_AMOUNT\n+ Rp 1.200\nPulsa\nTelkomsel\nSKU\nKeterangan\nHarga\nT10\nPULSA 10.000\nPULSA\nFIXED\nRp 10.650", "\n")
}

func TestParsePreservesFields(t *testing.T) {
	lines := fixture()
	rows := parseDashboardProducts(lines)
	if err := validateDashboard(lines, rows); err != nil {
		t.Fatal(err)
	}
	if rows[0].Category != "E-Wallet" || rows[0].Brand != "GOPAY" || rows[0].GroupName != "PULSA" || rows[0].Price != 1200 || rows[0].PriceType != "OPEN_AMOUNT" {
		t.Fatalf("%+v", rows[0])
	}
	if rows[1].Category != "Pulsa" || rows[1].Brand != "Telkomsel" {
		t.Fatalf("%+v", rows[1])
	}
}

func TestRejectTruncatedOrDuplicateExport(t *testing.T) {
	for _, lines := range [][]string{fixture()[:20], append(fixture(), fixture()[10:15]...)} {
		if err := validateDashboard(lines, parseDashboardProducts(lines)); err == nil {
			t.Fatal("invalid export accepted")
		}
	}
}

func TestRejectMissingPriceInsteadOfConsumingNextRow(t *testing.T) {
	lines := fixture()
	lines[13] = "PRICE MISSING"
	if err := validateDashboard(lines, parseDashboardProducts(lines)); err == nil {
		t.Fatal("invalid price accepted")
	}
}
