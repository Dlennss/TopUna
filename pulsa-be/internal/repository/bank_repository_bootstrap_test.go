package repository

import (
	"context"
	"testing"
)

func TestLegacyDepositBankCanBeDisabledForFreshInstallation(t *testing.T) {
	t.Setenv("LEGACY_DEPOSIT_BANK_ENABLED", "false")
	if err := NewBankRepository(nil).EnsurePulsaKilatDepositBank(context.Background()); err != nil {
		t.Fatalf("disabled legacy bank must not access the database: %v", err)
	}
}

func TestLegacyDepositBankDefaultStillRequiresDatabase(t *testing.T) {
	t.Setenv("LEGACY_DEPOSIT_BANK_ENABLED", "")
	if err := NewBankRepository(nil).EnsurePulsaKilatDepositBank(context.Background()); err == nil {
		t.Fatal("existing installations must retain the database check")
	}
}
