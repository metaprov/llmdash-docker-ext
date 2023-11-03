package main

import (
	"encoding/json"
	"flag"
	"github.com/labstack/echo"
	"github.com/sirupsen/logrus"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"strings"
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
	router.GET("/install", install)

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

func install(ctx echo.Context) error {
	var command = []string{
		"compose",
		"-f",
		"docker-compose.llmdash.yaml",
	}

	var installResult bool
	installParam := ctx.QueryParam("install")
	switch installParam {
	case "true":
		command = append(command, "up")
		command = append(command, "-d")
		installResult = true
	case "false":
		command = append(command, "down")
	case "check":
		command = append(command, "images")
	case "default":
		return ctx.JSON(http.StatusBadRequest, "")
	}

	var response InstallResponse
	output, err := exec.Command("docker", command...).CombinedOutput()
	if err != nil {
		var re = regexp.MustCompile(`(?mi)daemon: (.*)`)
		matches := re.FindStringSubmatch(string(output))
		if len(matches) == 2 {
			response.Error = matches[1]
		} else {
			lines := strings.Split(string(output), "\n")
			response.Error = lines[len(lines)-1]
		}
		data, _ := json.Marshal(response)
		return ctx.JSON(http.StatusInternalServerError, data)
	}

	if installParam == "check" {
		// If the compose file was created, there should be one image in use
		response.Installed = len(strings.Split(string(output), "\n")) > 2
	} else {
		response.Installed = installResult
	}

	data, _ := json.Marshal(response)
	return ctx.JSON(http.StatusOK, data)
}
