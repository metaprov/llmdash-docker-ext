package main

import (
	"fmt"
	gapi "github.com/grafana/grafana-api-golang-client"
	"github.com/labstack/echo"
	"net/http/httptest"
	"testing"
)

func TestInstall(t *testing.T) {
	req := httptest.NewRequest(echo.GET, "http://localhost:1323/install?install=true", nil)
	rec := httptest.NewRecorder()
	e := echo.New()
	ctx := e.NewContext(req, rec)

	fmt.Println(install(ctx))
}

func TestUninstall(t *testing.T) {
	req := httptest.NewRequest(echo.GET, "http://localhost:1323/install?install=false", nil)
	rec := httptest.NewRecorder()
	e := echo.New()
	ctx := e.NewContext(req, rec)

	fmt.Println(install(ctx))
}

func TestCheck(t *testing.T) {
	req := httptest.NewRequest(echo.GET, "http://localhost:1323/install?install=check", nil)
	rec := httptest.NewRecorder()
	e := echo.New()
	ctx := e.NewContext(req, rec)

	fmt.Println(install(ctx))
}

func TestGrafanaPanel(t *testing.T) {
	for _, metadata := range Dashboards {
		buildGrafanaDashboard(metadata, &gapi.DataSource{Type: "A", UID: "A"})
	}
}
