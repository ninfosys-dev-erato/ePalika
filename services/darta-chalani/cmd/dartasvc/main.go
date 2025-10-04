package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/api"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/app"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/config"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/db"
	"git.ninjainfosys.com/ePalika/services/darta-chalani/internal/dbutil"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	migrateCtx, cancel := context.WithTimeout(ctx, cfg.DB.MigrateTimeout)
	defer cancel()
	if err := dbutil.RunMigrations(migrateCtx, cfg.DB.DSN); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	pool, err := dbutil.NewPool(ctx, cfg.DB.DSN, cfg.DB.MaxConns, cfg.DB.MinConns, cfg.ServiceName)
	if err != nil {
		log.Fatalf("init pool: %v", err)
	}
	defer pool.Close()

	queries := db.New(pool)
	service := app.NewService(queries, cfg)

	handler := api.NewHandler(api.Config{
		Service:       service,
		Pool:          pool,
		ServiceName:   cfg.ServiceName,
		HealthTimeout: cfg.DB.HealthTimeout,
	})

	srv := &http.Server{
		Addr:         ":" + cfg.HTTP.Port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 20 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("http server shutdown: %v", err)
		}
	}()

	log.Printf("%s listening on :%s", cfg.ServiceName, cfg.HTTP.Port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen: %v", err)
	}
}
