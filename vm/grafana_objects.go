package main

import (
	"fmt"
	grafana "github.com/grafana/grafana-api-golang-client"
	"strconv"
)

func intPtr(v int32) *int32 {
	val := v
	return &val
}

func buildGrafanaPanel(metadata *GrafanaDashboardMetadata, datasource *grafana.DataSource, id int, interval string) GrafanaPanel {
	panelOverrides := []PanelOverrideProperties{
		{
			Matcher: PanelOverridePropertiesMatcher{
				Id:      "byName",
				Options: "Time",
			},
			Properties: []map[string]interface{}{
				{
					"id":    "custom.fillBelowTo",
					"value": "Value",
				},
			},
		},
	}

	fieldConfig := GrafanaPanelFieldConfigKey{
		Defaults: GrafanaPanelFieldConfigKeyDefaults{
			Color: GrafanaPanelFieldConfigKeyDefaultsColor{
				Mode: "palette-classic",
			},
			Custom: GrafanaPanelFieldConfigKeyDefaultsCustom{
				AxisCenteredZero:  false,
				AxisColorMode:     "text",
				AxisLabel:         "",
				AxisPlacement:     "auto",
				BarAlignment:      0,
				DrawStyle:         "line",
				FillOpacity:       10,
				GradientMode:      "none",
				HideFrom:          GrafanaPanelFieldConfigKeyDefaultsCustomHideFrom{},
				LineInterpolation: "smooth",
				LineWidth:         1,
				PointSize:         5,
				ScaleDistribution: GrafanaPanelFieldConfigKeyDefaultsCustomScaleDistribution{
					Type: "linear",
				},
				ShowPoints: "never",
				SpanNulls:  false,
				Stacking: GrafanaPanelFieldConfigKeyDefaultsCustomStacking{
					Group: "A",
					Mode:  "none",
				},
				ThresholdsStyle: GrafanaPanelFieldConfigKeyDefaultsCustomThresholdsStyle{
					Mode: "off",
				},
			},
			Min: intPtr(0),
		},
	}

	options := GrafanaPanelOptionsKey{
		Legend: GrafanaPanelOptionsKeyLegend{
			DisplayMode: "list",
			Placement:   "bottom",
			ShowLegend:  true,
		},
		Tooltip: GrafanaPanelOptionsKeyTooltip{
			Mode: "single",
			Sort: "none",
		},
	}

	panel := GrafanaPanel{
		Datasource: GrafanaDatasource{
			Type: datasource.Type,
			Uid:  datasource.UID,
		},
		FieldConfig: fieldConfig,
		GridPos: GrafanaPanelGridPos{
			H: 8,
			W: 12,
		},
		Id:       int32(id),
		Interval: "2s",
		Options:  options,
		Targets:  nil,
		Title:    metadata.Title,
		Type:     "timeseries",
	}

	for i := 1; i < len(metadata.Queries); i++ {
		query := metadata.Queries[i]
		target := GrafanaPanelTargetsObject{
			Datasource: GrafanaDatasource{
				Type: datasource.Type,
				Uid:  datasource.UID,
			},
			EditorMode: "builder",
			Expr:       fmt.Sprintf(query.QueryTemplate, interval),
			Instant:    false,
			Range:      true,
			RefId:      strconv.Itoa(i),
		}

		override := PanelOverrideProperties{
			Matcher: PanelOverridePropertiesMatcher{
				Id:      "byName",
				Options: query.Name,
			},
			Properties: []map[string]interface{}{
				{
					"id":    "displayName",
					"value": query.DisplayName,
				},
				{
					"id": "color",
					"value": map[string]interface{}{
						"mode":       "fixed",
						"fixedColor": query.Color,
					},
				},
			},
		}

		panel.Targets = append(panel.Targets, target)
		panelOverrides = append(panelOverrides, override)
	}

	fieldConfig.Overrides = panelOverrides
	return panel
}

func buildGrafanaDashboard(metadata *GrafanaDashboardMetadata, datasource *grafana.DataSource) grafana.Dashboard {
	dashboard := map[string]interface{}{
		"refresh":       "10s",
		"schemaVersion": 16,
		"tags":          []string{"templated"},
		"timezone":      "browser",
		"title":         metadata.Title,
		"uid":           metadata.UID,
		"version":       0,
	}

	var panels []GrafanaPanel
	for i, interval := range []string{"1s", "1m", "1h"} {
		panels = append(panels, buildGrafanaPanel(metadata, datasource, i, interval))
	}

	dashboard["panels"] = panels
	return grafana.Dashboard{
		Model:     dashboard,
		Overwrite: true,
	}
}
