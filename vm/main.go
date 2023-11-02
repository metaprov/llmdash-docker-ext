package main

import (
	"encoding/json"
	"flag"
	"log"
	"net"
	"net/http"
	"os"

	"github.com/labstack/echo"
	"github.com/sirupsen/logrus"
)

var logger = logrus.New()
var metrics *Metrics

func main() {
	var socketPath string
	flag.StringVar(&socketPath, "socket", "/run/guest/volumes-service.sock", "Unix domain socket to listen on")
	flag.Parse()

	os.RemoveAll(socketPath)

	logger.Infof("Initializing metrics")
	metrics = NewMetricClient()

	logger.Infof("Starting listening on %s\n", socketPath)

	router := echo.New()
	router.HideBanner = true

	startURL := ""

	ln, err := listen(socketPath)
	if err != nil {
		log.Fatal(err)
	}
	router.Listener = ln

	router.GET("/stats", stats)

	log.Fatal(router.Start(startURL))
}

func listen(path string) (net.Listener, error) {
	return net.Listen("unix", path)
}

func stats(ctx echo.Context) error {
	stats := metrics.Stats()
	data, err := json.Marshal(stats)
	if err != nil {
		logger.Error(err)
		return ctx.JSON(http.StatusInternalServerError, "")
	}

	return ctx.JSON(http.StatusOK, data)
}
