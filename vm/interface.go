package main

type GetStatsResponse struct {
	Requests int32 `json:"requests"`
	Cached   int32 `json:"cached"`
	Errors   int32 `json:"errors"`
	Tokens   int32 `json:"tokens"`

	Error string `json:"error"`
}

type InstallResponse struct {
	Installed bool   `json:"installed"`
	Error     string `json:"error"`
}
