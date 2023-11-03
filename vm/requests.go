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

type WatchConversationRequest struct {
	Generation int64 `json:"generation"`
}

type WatchMessageRequest struct {
	Generation   int64  `json:"generation"`
	Conversation string `json:"conversation"`
}

type DeleteConversationRequest struct {
	Conversation string `json:"conversation"`
}

type SendMessageRequest struct {
	Conversation string `json:"conversation"`
	Query        string `json:"query"`
	ID           string `json:"id"`
}

type UpdateSettingsRequest struct {
	ApiKey string `json:"apiKey"`
	Model  string `json:"model"`
}
