package main

type GetStatsRequest struct{}

type GetStatsResponse struct {
	Requests int32 `json:"requests"`
	Cached   int32 `json:"cached"`
	Errors   int32 `json:"errors"`
	Tokens   int32 `json:"tokens"`

	Error string `json:"error"`
}
