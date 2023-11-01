package main

import (
	"fmt"
	grafana "github.com/grafana/grafana-api-golang-client"
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
}

func NewMetricClient() *Metrics {
	client, err := grafana.New("http://host.docker.internal:2999", grafana.Config{})
	if err != nil {
		panic(fmt.Sprintf("failed to initialize grafana grafana: %s", err))
	}

	grf := &Metrics{grafana: client}
	if err := grf.Initialize(); err != nil {
		panic(fmt.Sprintf("failed to initialize grafana: %s", err))
	}
	return grf
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
