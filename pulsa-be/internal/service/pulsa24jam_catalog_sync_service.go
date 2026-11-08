package service

import (
	"context"
	"fmt"
	"strings"

	"pulsa2/internal/catalog"
	"pulsa2/internal/provider"
	"pulsa2/internal/repository"
)

type Pulsa24JamCatalogSyncService struct {
	repo   *repository.Pulsa24JamCatalogRepository
	client *provider.Pulsa24JamAdapter
}

func NewPulsa24JamCatalogSyncService(dbRepo *repository.Pulsa24JamCatalogRepository, client *provider.Pulsa24JamAdapter) *Pulsa24JamCatalogSyncService {
	return &Pulsa24JamCatalogSyncService{repo: dbRepo, client: client}
}

func (s *Pulsa24JamCatalogSyncService) Sync(ctx context.Context) (*repository.Pulsa24JamCatalogSyncResult, error) {
	if s == nil || s.repo == nil || s.client == nil || !s.client.Configured() {
		return nil, fmt.Errorf("sinkronisasi katalog Pulsa24Jam belum dikonfigurasi")
	}
	products, err := s.client.Products(ctx, "")
	if err != nil {
		return nil, err
	}
	items := make([]repository.Pulsa24JamCatalogItem, 0, len(products))
	for _, product := range products {
		if _, allowed := catalog.Lookup(product.SKU); !allowed {
			continue
		}
		if _, err := pulsa24JamCatalogPrice(product); err != nil {
			return nil, err
		}
		items = append(items, pulsa24JamCatalogItemFromProduct(product))
	}
	return s.repo.Sync(ctx, items)
}

func pulsa24JamCatalogItemFromProduct(product provider.Pulsa24JamProduct) repository.Pulsa24JamCatalogItem {
	price, _ := pulsa24JamCatalogPrice(product)
	return repository.Pulsa24JamCatalogItem{
		SKU:            product.SKU,
		Name:           product.Name,
		GroupName:      product.GroupName,
		CategoryName:   product.CategoryName,
		BrandName:      product.BrandName,
		PriceType:      product.PriceType,
		Price:          price,
		MaximumNominal: product.MaximumNominal,
	}
}

func pulsa24JamCatalogPrice(product provider.Pulsa24JamProduct) (int64, error) {
	values := []*int64{product.AppBasePrice, product.Price}
	if strings.EqualFold(strings.TrimSpace(product.PriceType), "OPEN_AMOUNT") {
		values = append(values, product.AdditionalFee)
	}
	for _, value := range values {
		if value == nil {
			continue
		}
		if *value < 0 {
			break
		}
		return *value, nil
	}
	return 0, fmt.Errorf("harga SKU %s tidak lengkap; katalog tidak diubah", product.SKU)
}
