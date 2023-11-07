package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/labstack/echo"
	"io"
	"net/http"
)

type ConfigData struct {
	Config Config `json:"config"`
}

type Config struct {
	OpenAI *OpenAIConfig `json:"openai"`
}

type OpenAIConfig struct {
	Endpoint string `json:"openai_endpoint"`
	ApiKey   string `json:"openai_key"`
}

type UpdateConfigRequest struct {
	ApiKey string `json:"openai_api_key"`
}

func getConfig(ctx echo.Context) error {
	request, err := http.NewRequest("GET", "http://host.docker.internal:6060/config", bytes.NewBuffer([]byte{}))
	if err != nil {
		logger.Errorf("failed to make new request: %v", err)
		return ctx.JSON(http.StatusInternalServerError, "")
	}
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		logger.Errorf("failed to fetch config: %v", err)
		return ctx.JSON(http.StatusInternalServerError, "")
	}
	defer response.Body.Close()
	data, _ := io.ReadAll(response.Body)
	var config ConfigData
	if err := json.Unmarshal(data, &config); err != nil {
		logger.Errorf("failed to read config: %v", err)
		return ctx.JSON(http.StatusInternalServerError, "")
	}

	return ctx.JSON(http.StatusOK, config)
}

func setConfig(ctx echo.Context) error {
	var conf UpdateConfigRequest
	if err := json.NewDecoder(ctx.Request().Body).Decode(&conf); err != nil {
		return ctx.JSON(http.StatusBadRequest, "")
	}
	data, err := json.Marshal(conf)
	if err != nil {
		logger.Errorf("failed to make new request: %v", err)
		return nil
	}

	fmt.Println(string(data))
	request, err := http.NewRequest("PUT", "http://host.docker.internal:6060/config", bytes.NewBuffer(data))
	if err != nil {
		logger.Errorf("failed to make new request: %v", err)
		return ctx.JSON(http.StatusInternalServerError, "")
	}
	request.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		logger.Errorf("failed to fetch config: %v", err)
		return ctx.JSON(http.StatusInternalServerError, "")
	}
	defer response.Body.Close()
	return ctx.JSON(http.StatusOK, "")
}
