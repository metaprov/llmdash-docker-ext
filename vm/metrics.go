package main

import (
	"context"
	"fmt"
	grafana "github.com/grafana/grafana-api-golang-client"
	prometheus "github.com/prometheus/client_golang/api"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/prometheus/common/model"
	"time"
)

type GrafanaQueryMetadata struct {
	QueryTemplate string
	Name          string
	DisplayName   string
	Color         string
}

type GrafanaDashboardMetadata struct {
	Title   string
	UID     string
	Queries []GrafanaQueryMetadata
}

var Dashboards = []*GrafanaDashboardMetadata{
	{
		Title: "Requests",
		UID:   "requests",
		Queries: []GrafanaQueryMetadata{
			{
				QueryTemplate: "rate(http_requests_total[%s])",
				Name:          "http_requests_total",
				DisplayName:   "requests",
				Color:         "green",
			},
		},
	},
}

type Metrics struct {
	grafana    *grafana.Client
	datasource *grafana.DataSource
	prometheus *prometheus.Client
}

func NewMetricClient() *Metrics {
	grafanaClient, err := grafana.New("http://host.docker.internal:2999", grafana.Config{})
	if err != nil {
		panic(fmt.Sprintf("failed to initialize grafana: %s", err))
	}

	promClient, err := prometheus.NewClient(prometheus.Config{
		Address: "http://host.docker.internal:9080",
	})
	if err != nil {
		panic(fmt.Sprintf("failed to initialize prometheus: %s", err))
	}

	metrics := &Metrics{grafana: grafanaClient, prometheus: &promClient}
	if err := metrics.Initialize(); err != nil {
		panic(fmt.Sprintf("failed to initialize grafana: %s", err))
	}
	return metrics
}

func (g *Metrics) Initialize() error {
	data, err := g.grafana.DataSources()
	if err != nil {
		return err
	}

	if len(data) == 0 {
		return fmt.Errorf("no datasources found")
	}

	g.datasource = data[0]

	// Create the dashboards
	for _, metadata := range Dashboards {
		dashboard := buildGrafanaDashboard(metadata, g.datasource)
		resp, err := g.grafana.NewDashboard(dashboard)
		if err != nil {
			return fmt.Errorf("failed to create dashboard %s: %v", metadata.UID, err)
		}
		logger.Infof("created grafana dashboard %s with response %s", metadata.UID, resp.Status)
	}

	return nil
}

func (g *Metrics) Stats() *GetStatsResponse {
	var stats = map[string]func(int32, *GetStatsResponse){
		"sum(http_requests_total)":        func(v int32, r *GetStatsResponse) { r.Requests = v },
		"sum(http_requests_cached_total)": func(v int32, r *GetStatsResponse) { r.Cached = v },
		"sum(http_requests_error_total)":  func(v int32, r *GetStatsResponse) { r.Errors = v },
		"sum(output_tokens_total)":        func(v int32, r *GetStatsResponse) { r.Tokens = v },
	}

	var response GetStatsResponse
	api := v1.NewAPI(*g.prometheus)
	for query, fn := range stats {
		result, _, err := api.Query(context.TODO(), query, time.Now(), v1.WithTimeout(5*time.Second))
		if err != nil {
			logger.Error(err)
			return &GetStatsResponse{Error: err.Error()}
		}
		if v, ok := result.(*model.Scalar); ok {
			fn(int32(v.Value), &response)
		}
	}

	return &response
}
