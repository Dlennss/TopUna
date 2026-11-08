package main

import (
	"bufio"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

type productRow struct {
	Category       string
	Brand          string
	SKU            string
	Name           string
	GroupName      string
	PriceType      string
	Price          int64
	MaximumNominal string
}

var priceLinePattern = regexp.MustCompile(`^(?:\+\s*)?Rp\s*([0-9.]+)$`)

func main() {
	log.SetFlags(0)
	if len(os.Args) != 4 {
		log.Fatal("usage: go run ./scripts/pulsa24jam_catalog_from_dashboard <pasted-text.txt> <output.sql> <snapshot.json>")
	}

	inputPath := filepath.Clean(os.Args[1])
	outputPath := filepath.Clean(os.Args[2])

	lines, err := readLines(inputPath)
	if err != nil {
		log.Fatalf("read %s: %v", inputPath, err)
	}

	products := parseDashboardProducts(lines)
	if err := validateDashboard(lines, products); err != nil {
		log.Fatal(err)
	}
	raw, err := os.ReadFile(inputPath)
	if err != nil {
		log.Fatal(err)
	}
	snapshot := struct {
		SourceSHA256 string
		Products     []productRow
	}{fmt.Sprintf("%x", sha256.Sum256(raw)), products}
	data, err := json.Marshal(snapshot)
	if err != nil {
		log.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Dir(os.Args[3]), 0o755); err != nil {
		log.Fatal(err)
	}
	if err := os.WriteFile(os.Args[3], append(data, '\n'), 0o644); err != nil {
		log.Fatal(err)
	}

	if err := writeMigration(outputPath, products); err != nil {
		log.Fatalf("write %s: %v", outputPath, err)
	}
	fmt.Printf("Generated %s with %d Pulsa24Jam products\n", outputPath, len(products))
}

func validateDashboard(lines []string, products []productRow) error {
	counts := map[string]int{}
	priceLines := 0
	for i, line := range lines {
		if line == "Total Produk Aktif" || line == "Produk Dengan Harga Tetap" {
			if i+1 >= len(lines) {
				return fmt.Errorf("missing dashboard count")
			}
			n, err := strconv.Atoi(strings.ReplaceAll(lines[i+1], ".", ""))
			if err != nil {
				return fmt.Errorf("invalid dashboard count: %s", line)
			}
			counts[line] = n
		}
		if _, ok := parsePriceLine(line); ok {
			priceLines++
		}
	}
	if len(products) == 0 || len(products) != counts["Total Produk Aktif"] || priceLines != len(products) {
		return fmt.Errorf("incomplete/duplicate catalog: parsed=%d prices=%d expected=%d", len(products), priceLines, counts["Total Produk Aktif"])
	}
	fixed := 0
	for _, row := range products {
		if row.PriceType == "FIXED" {
			fixed++
		}
		if row.Category == "" || row.Brand == "" || row.SKU == "" || row.Name == "" || row.Price < 0 {
			return fmt.Errorf("invalid product: %s", row.SKU)
		}
	}
	if fixed != counts["Produk Dengan Harga Tetap"] {
		return fmt.Errorf("fixed count mismatch: %d", fixed)
	}
	return nil
}

func readLines(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 1024), 1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			lines = append(lines, line)
		}
	}
	return lines, scanner.Err()
}

func parseDashboardProducts(lines []string) []productRow {
	var (
		products     []productRow
		headings     []string
		lastCategory string
	)

	for i := 0; i < len(lines); i++ {
		if !isTableHeader(lines, i) {
			headings = appendUsefulHeading(headings, lines[i])
			continue
		}

		category, brand, ok := currentCategoryBrand(headings, lastCategory)
		if !ok {
			headings = nil
			continue
		}
		lastCategory = category
		headings = nil
		i += 3

		for i < len(lines) {
			if isUpcomingTableHeader(lines, i) {
				break
			}
			if isTableHeader(lines, i) {
				i--
				break
			}

			row, next, ok := parseProductRow(lines, i, category, brand)
			if !ok {
				headings = appendUsefulHeading(headings, lines[i])
				break
			}
			products = append(products, row)
			i = next
		}
		i--
	}

	return dedupeProducts(products)
}

func appendUsefulHeading(headings []string, value string) []string {
	value = strings.TrimSpace(value)
	if value == "" || isNoiseHeading(value) {
		return headings
	}
	headings = append(headings, value)
	if len(headings) > 4 {
		return headings[len(headings)-4:]
	}
	return headings
}

func isNoiseHeading(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "pulsa24jam", "dashboard", "produk h2hr", "request deposit", "pengaturan", "dokumentasi",
		"history", "mutasi", "transaksi", "deposit", "logout", "profil aktif", "pulsa kilat",
		"member h2hr", "role aktif di sesi ini", "total produk aktif", "produk dengan harga tetap",
		"daftar produk", "gunakan sku internal ini untuk transaksi h2hr.", "cari sku / nama produk",
		"semua kategori", "semua brand":
		return true
	default:
		return false
	}
}

func isTableHeader(lines []string, i int) bool {
	return i+2 < len(lines) && lines[i] == "SKU" && lines[i+1] == "Keterangan" && lines[i+2] == "Harga"
}

func isUpcomingTableHeader(lines []string, i int) bool {
	return i+3 < len(lines) && lines[i+1] == "SKU" && lines[i+2] == "Keterangan" && lines[i+3] == "Harga"
}

func currentCategoryBrand(headings []string, lastCategory string) (string, string, bool) {
	if len(headings) == 0 {
		return "", "", false
	}
	brand := headings[len(headings)-1]
	category := brand
	if len(headings) >= 2 {
		category = headings[len(headings)-2]
	} else if lastCategory != "" && !isStandaloneCategory(brand) {
		category = lastCategory
	}
	return normalizeMasterName(category), normalizeMasterName(brand), true
}

func isStandaloneCategory(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "asuransi", "bank transfer", "bpjs", "e-money", "e-wallet", "game",
		"internet pascabayar", "listrik", "masa aktif", "paket data",
		"paket sms", "paket telepon", "pdam", "pln", "streaming",
		"tv", "voucher", "voucher digital":
		return true
	default:
		return false
	}
}

func parseProductRow(lines []string, start int, category, brand string) (productRow, int, bool) {
	if start+4 >= len(lines) {
		return productRow{}, start, false
	}
	sku := normalizeSKU(lines[start])
	name := strings.TrimSpace(lines[start+1])
	if sku == "" || name == "" || isNoiseHeading(sku) || isNoiseHeading(name) {
		return productRow{}, start, false
	}

	groupName := strings.TrimSpace(lines[start+2])
	if groupName == "-" {
		groupName = ""
	}
	priceType := strings.TrimSpace(lines[start+3])
	if priceType != "FIXED" && !strings.HasPrefix(priceType, "OPEN_AMOUNT") {
		return productRow{}, start, false
	}
	var maxNominal string
	var price int64
	i := start + 3
	for ; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		if strings.HasPrefix(strings.ToUpper(line), "OPEN_AMOUNT") {
			priceType = "OPEN_AMOUNT"
			maxNominal = parseMaximumNominal(line)
		}
		if amount, ok := parsePriceLine(line); ok {
			price = amount
			i++
			break
		}
		if isUpcomingTableHeader(lines, i) || isTableHeader(lines, i) {
			return productRow{}, start, false
		}
	}
	if _, ok := parsePriceLine(lines[start+4]); !ok {
		return productRow{}, start, false
	}

	return productRow{
		Category:       category,
		Brand:          brand,
		SKU:            sku,
		Name:           name,
		GroupName:      groupName,
		PriceType:      priceType,
		Price:          price,
		MaximumNominal: maxNominal,
	}, i, true
}

func normalizeSKU(value string) string {
	value = strings.ToUpper(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, " ", "")
	return value
}

func normalizeMasterName(value string) string {
	value = strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
	return value
}

func parseMaximumNominal(value string) string {
	upper := strings.ToUpper(value)
	idx := strings.Index(upper, "MAKS")
	if idx < 0 {
		return ""
	}
	raw := regexp.MustCompile(`\d[\d.]*`).FindString(value[idx:])
	if raw == "" {
		return ""
	}
	return strings.ReplaceAll(raw, ".", "")
}

func parsePriceLine(value string) (int64, bool) {
	match := priceLinePattern.FindStringSubmatch(strings.TrimSpace(value))
	if len(match) != 2 {
		return 0, false
	}
	amount, err := strconv.ParseInt(strings.ReplaceAll(match[1], ".", ""), 10, 64)
	return amount, err == nil
}

func dedupeProducts(products []productRow) []productRow {
	seen := make(map[string]int, len(products))
	out := make([]productRow, 0, len(products))
	for _, item := range products {
		if item.SKU == "" {
			continue
		}
		if idx, ok := seen[item.SKU]; ok {
			out[idx] = item
			continue
		}
		seen[item.SKU] = len(out)
		out = append(out, item)
	}
	return out
}

func writeMigration(path string, products []productRow) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	w := bufio.NewWriterSize(file, 1024*1024)

	fmt.Fprintln(w, "-- Generated from Pulsa24Jam H2HR dashboard export.")
	fmt.Fprintln(w, "-- Re-run safe: refreshes the app catalog so active retail products are Pulsa24Jam H2HR only.")
	fmt.Fprintln(w, "BEGIN;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS special_code TEXT;")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'normal';")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS minimal_nominal BIGINT NULL;")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS maksimal_nominal BIGINT NULL;")
	fmt.Fprintln(w, "ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "  ADD COLUMN IF NOT EXISTS fee_rp BIGINT NOT NULL DEFAULT 0;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "DO $$")
	fmt.Fprintln(w, "BEGIN")
	fmt.Fprintln(w, "  IF NOT EXISTS (")
	fmt.Fprintln(w, "    SELECT 1 FROM pg_constraint")
	fmt.Fprintln(w, "    WHERE conname = 'uq_produk_provider_map_produk_provider_kode'")
	fmt.Fprintln(w, "      AND conrelid = 'public.produk_provider_map'::regclass")
	fmt.Fprintln(w, "  ) THEN")
	fmt.Fprintln(w, "    ALTER TABLE public.produk_provider_map")
	fmt.Fprintln(w, "      ADD CONSTRAINT uq_produk_provider_map_produk_provider_kode")
	fmt.Fprintln(w, "      UNIQUE (produk_id, provider, kode_provider);")
	fmt.Fprintln(w, "  END IF;")
	fmt.Fprintln(w, "END $$;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "CREATE TEMP TABLE p24_h2hr_seed (")
	fmt.Fprintln(w, "  category_name TEXT NOT NULL,")
	fmt.Fprintln(w, "  brand_name TEXT NOT NULL,")
	fmt.Fprintln(w, "  sku TEXT NOT NULL,")
	fmt.Fprintln(w, "  product_name TEXT NOT NULL,")
	fmt.Fprintln(w, "  group_name TEXT NOT NULL,")
	fmt.Fprintln(w, "  price_type TEXT NOT NULL,")
	fmt.Fprintln(w, "  price BIGINT NOT NULL,")
	fmt.Fprintln(w, "  maximum_nominal BIGINT NULL")
	fmt.Fprintln(w, ") ON COMMIT DROP;")

	for start := 0; start < len(products); start += 500 {
		end := start + 500
		if end > len(products) {
			end = len(products)
		}
		fmt.Fprintln(w, "")
		fmt.Fprintln(w, "INSERT INTO p24_h2hr_seed")
		fmt.Fprintln(w, "  (category_name, brand_name, sku, product_name, group_name, price_type, price, maximum_nominal)")
		fmt.Fprintln(w, "VALUES")
		for i := start; i < end; i++ {
			item := products[i]
			suffix := ","
			if i == end-1 {
				suffix = ";"
			}
			maxNominal := "NULL"
			if item.MaximumNominal != "" {
				maxNominal = item.MaximumNominal
			}
			fmt.Fprintf(
				w,
				"  (%s,%s,%s,%s,%s,%s,%d,%s)%s\n",
				sqlQuote(item.Category),
				sqlQuote(item.Brand),
				sqlQuote(item.SKU),
				sqlQuote(item.Name),
				sqlQuote(item.GroupName),
				sqlQuote(item.PriceType),
				item.Price,
				maxNominal,
				suffix,
			)
		}
	}

	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "CREATE TEMP TABLE p24_h2hr_seed_unique ON COMMIT DROP AS")
	fmt.Fprintln(w, "SELECT DISTINCT ON (sku)")
	fmt.Fprintln(w, "  category_name, brand_name, sku, product_name, group_name, price_type, price, maximum_nominal")
	fmt.Fprintln(w, "FROM p24_h2hr_seed")
	fmt.Fprintln(w, "ORDER BY sku;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.provider (nama, aktif, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "VALUES ('pulsa24jam', true, now(), now())")
	fmt.Fprintln(w, "ON CONFLICT (nama) DO UPDATE SET aktif = true, diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "UPDATE public.produk_app_pricing")
	fmt.Fprintln(w, "SET aktif = false, updated_at = now(), diubah_pada = now()")
	fmt.Fprintln(w, "WHERE aktif = true;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "UPDATE public.produk_provider_map")
	fmt.Fprintln(w, "SET aktif = false, diubah_pada = now()")
	fmt.Fprintln(w, "WHERE aktif = true;")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "UPDATE public.produk")
	fmt.Fprintln(w, "SET aktif = false, diubah_pada = now()")
	fmt.Fprintln(w, "WHERE aktif = true")
	fmt.Fprintln(w, "  AND sku NOT IN (SELECT sku FROM p24_h2hr_seed_unique);")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.kategori (nama, aktif, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT DISTINCT ON (LOWER(TRIM(category_name))) category_name, true, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique")
	fmt.Fprintln(w, "ORDER BY LOWER(TRIM(category_name)), category_name")
	fmt.Fprintln(w, "ON CONFLICT (nama) DO UPDATE SET aktif = true, diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.brand (nama, aktif, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT DISTINCT ON (LOWER(TRIM(brand_name))) brand_name, true, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique")
	fmt.Fprintln(w, "ORDER BY LOWER(TRIM(brand_name)), brand_name")
	fmt.Fprintln(w, "ON CONFLICT (nama) DO UPDATE SET aktif = true, diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.kategori_fee_app")
	fmt.Fprintln(w, "  (kategori_id, fee_master, fee_agent, fee_user, fee_non_user, aktif, created_at, updated_at)")
	fmt.Fprintln(w, "SELECT DISTINCT k.id, 0, 0, 0, 0, true, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique seed")
	fmt.Fprintln(w, "JOIN LATERAL (")
	fmt.Fprintln(w, "  SELECT id FROM public.kategori")
	fmt.Fprintln(w, "  WHERE LOWER(TRIM(nama)) = LOWER(TRIM(seed.category_name))")
	fmt.Fprintln(w, "  ORDER BY id LIMIT 1")
	fmt.Fprintln(w, ") k ON true")
	fmt.Fprintln(w, "ON CONFLICT (kategori_id) DO UPDATE SET aktif = true, updated_at = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.produk")
	fmt.Fprintln(w, "  (sku, nama, group_name, kategori_id, brand_id, tipe_harga, nominal, maksimal_nominal, jam_buka, jam_tutup, aktif, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT seed.sku, seed.product_name, seed.group_name, k.id, b.id, seed.price_type,")
	fmt.Fprintln(w, "       NULL,")
	fmt.Fprintln(w, "       seed.maximum_nominal, '00:00', '23:59', true, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique seed")
	fmt.Fprintln(w, "JOIN LATERAL (")
	fmt.Fprintln(w, "  SELECT id FROM public.kategori")
	fmt.Fprintln(w, "  WHERE LOWER(TRIM(nama)) = LOWER(TRIM(seed.category_name))")
	fmt.Fprintln(w, "  ORDER BY id LIMIT 1")
	fmt.Fprintln(w, ") k ON true")
	fmt.Fprintln(w, "JOIN LATERAL (")
	fmt.Fprintln(w, "  SELECT id FROM public.brand")
	fmt.Fprintln(w, "  WHERE LOWER(TRIM(nama)) = LOWER(TRIM(seed.brand_name))")
	fmt.Fprintln(w, "  ORDER BY id LIMIT 1")
	fmt.Fprintln(w, ") b ON true")
	fmt.Fprintln(w, "ON CONFLICT (sku) DO UPDATE SET")
	fmt.Fprintln(w, "  nama = EXCLUDED.nama,")
	fmt.Fprintln(w, "  group_name = EXCLUDED.group_name,")
	fmt.Fprintln(w, "  kategori_id = EXCLUDED.kategori_id,")
	fmt.Fprintln(w, "  brand_id = EXCLUDED.brand_id,")
	fmt.Fprintln(w, "  tipe_harga = EXCLUDED.tipe_harga,")
	fmt.Fprintln(w, "  nominal = EXCLUDED.nominal,")
	fmt.Fprintln(w, "  maksimal_nominal = EXCLUDED.maksimal_nominal,")
	fmt.Fprintln(w, "  jam_buka = EXCLUDED.jam_buka,")
	fmt.Fprintln(w, "  jam_tutup = EXCLUDED.jam_tutup,")
	fmt.Fprintln(w, "  aktif = true,")
	fmt.Fprintln(w, "  diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.produk_app_pricing")
	fmt.Fprintln(w, "  (produk_id, provider, harga, harga_dasar, yuscom_group, yuscom_category, yuscom_sku, yuscom_name, yuscom_status, yuscom_display_brand, aktif, fetched_at, created_at, updated_at, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT p.id, 'pulsa24jam', seed.price, seed.price, seed.group_name, seed.category_name, seed.sku, seed.product_name, 'ACTIVE', seed.brand_name, true, now(), now(), now(), now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique seed")
	fmt.Fprintln(w, "JOIN public.produk p ON p.sku = seed.sku")
	fmt.Fprintln(w, "ON CONFLICT (produk_id) DO UPDATE SET")
	fmt.Fprintln(w, "  provider = 'pulsa24jam',")
	fmt.Fprintln(w, "  harga = EXCLUDED.harga,")
	fmt.Fprintln(w, "  harga_dasar = EXCLUDED.harga_dasar,")
	fmt.Fprintln(w, "  yuscom_group = EXCLUDED.yuscom_group,")
	fmt.Fprintln(w, "  yuscom_category = EXCLUDED.yuscom_category,")
	fmt.Fprintln(w, "  yuscom_sku = EXCLUDED.yuscom_sku,")
	fmt.Fprintln(w, "  yuscom_name = EXCLUDED.yuscom_name,")
	fmt.Fprintln(w, "  yuscom_status = CASE WHEN produk_app_pricing.yuscom_status LIKE 'PULSA24JAM_%' AND produk_app_pricing.yuscom_status <> 'PULSA24JAM_LOW_PRICE_HIDDEN' THEN produk_app_pricing.yuscom_status ELSE 'ACTIVE' END,")
	fmt.Fprintln(w, "  yuscom_display_brand = EXCLUDED.yuscom_display_brand,")
	fmt.Fprintln(w, "  aktif = CASE WHEN produk_app_pricing.yuscom_status LIKE 'PULSA24JAM_%' AND produk_app_pricing.yuscom_status <> 'PULSA24JAM_LOW_PRICE_HIDDEN' THEN false ELSE true END,")
	fmt.Fprintln(w, "  fetched_at = now(),")
	fmt.Fprintln(w, "  updated_at = now(),")
	fmt.Fprintln(w, "  diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "INSERT INTO public.produk_provider_map")
	fmt.Fprintln(w, "  (produk_id, provider, kode_provider, mode, aktif, prioritas, minimal_nominal, maksimal_nominal, fee_rp, dibuat_pada, diubah_pada)")
	fmt.Fprintln(w, "SELECT p.id, 'pulsa24jam', seed.sku, 'normal', true, 1,")
	fmt.Fprintln(w, "       CASE WHEN seed.price_type = 'OPEN_AMOUNT' THEN 1 ELSE NULL END,")
	fmt.Fprintln(w, "       seed.maximum_nominal, 0, now(), now()")
	fmt.Fprintln(w, "FROM p24_h2hr_seed_unique seed")
	fmt.Fprintln(w, "JOIN public.produk p ON p.sku = seed.sku")
	fmt.Fprintln(w, "ON CONFLICT (produk_id, provider, kode_provider) DO UPDATE SET")
	fmt.Fprintln(w, "  mode = 'normal',")
	fmt.Fprintln(w, "  aktif = true,")
	fmt.Fprintln(w, "  prioritas = 1,")
	fmt.Fprintln(w, "  minimal_nominal = EXCLUDED.minimal_nominal,")
	fmt.Fprintln(w, "  maksimal_nominal = EXCLUDED.maksimal_nominal,")
	fmt.Fprintln(w, "  fee_rp = 0,")
	fmt.Fprintln(w, "  diubah_pada = now();")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "UPDATE public.produk_app_pricing app SET aktif = false, yuscom_status = CASE WHEN app.yuscom_status LIKE 'PULSA24JAM_%' THEN app.yuscom_status ELSE 'PULSA24JAM_LOW_PRICE_HIDDEN' END")
	fmt.Fprintln(w, "FROM public.produk p WHERE p.id = app.produk_id AND app.provider = 'pulsa24jam'")
	fmt.Fprintln(w, "AND p.tipe_harga::text = 'FIXED' AND app.harga <= 1000;")
	fmt.Fprintln(w, "UPDATE public.produk_provider_map m SET aktif = a.aktif FROM public.produk_app_pricing a")
	fmt.Fprintln(w, "WHERE m.produk_id = a.produk_id AND m.provider = 'pulsa24jam' AND a.provider = 'pulsa24jam'")
	fmt.Fprintln(w, "AND m.kode_provider = a.yuscom_sku;")
	fmt.Fprintln(w, "COMMIT;")
	return w.Flush()
}

func sqlQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}
