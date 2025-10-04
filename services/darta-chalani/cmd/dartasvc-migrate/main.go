package main

import (
	"context"
	"log"
	"time"

	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/config"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/dbutil"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), cfg.DB.MigrateTimeout)
	defer cancel()

	if err := dbutil.RunMigrations(ctx, cfg.DB.DSN); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	log.Printf("migrations completed at %s", time.Now().Format(time.RFC3339))
}
