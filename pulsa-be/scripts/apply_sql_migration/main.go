package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	log.SetFlags(0)

	if len(os.Args) != 2 {
		log.Fatal("usage: go run ./scripts/apply_sql_migration <migration.sql>")
	}

	_ = godotenv.Load(".env")

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL is empty")
	}

	path := filepath.Clean(os.Args[1])
	migrationName := filepath.Base(path)
	query, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("read migration %s: %v", path, err)
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("ping database: %v", err)
	}

	if _, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`); err != nil {
		log.Fatalf("ensure schema_migrations: %v", err)
	}

	var alreadyApplied bool
	if err := db.QueryRowContext(ctx, `SELECT EXISTS (SELECT 1 FROM public.schema_migrations WHERE filename = $1)`, migrationName).Scan(&alreadyApplied); err != nil {
		log.Fatalf("check migration %s: %v", migrationName, err)
	}
	if alreadyApplied {
		fmt.Printf("Skipped already applied migration: %s\n", migrationName)
		return
	}

	if _, err := db.ExecContext(ctx, string(query)); err != nil {
		log.Fatalf("apply migration %s: %v", path, err)
	}
	if _, err := db.ExecContext(ctx, `
INSERT INTO public.schema_migrations (filename, applied_at)
VALUES ($1, now())
ON CONFLICT (filename) DO NOTHING`, migrationName); err != nil {
		log.Fatalf("record migration %s: %v", migrationName, err)
	}

	fmt.Printf("Applied migration: %s\n", path)
}
