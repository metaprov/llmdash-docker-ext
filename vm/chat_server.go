// Liam Sagi (c) 2023
package main

import (
	"github.com/labstack/echo"
	"net/http"
	"time"
)

var chatServer *ChatServer

type ChatServer struct {
	mgr *ChatManager
}

func NewChatServer() *ChatServer {
	return &ChatServer{mgr: NewChatManager()}
}

func (s *ChatServer) WatchMessages(ctx echo.Context) error {
	var params WatchMessageRequest
	if err := ctx.Bind(&params); err != nil {
		return ctx.JSON(http.StatusBadRequest, "")
	}

	var outChan = make(chan *MessageEvents, 1)
	s.mgr.subscribeMessages(params.Conversation, params.Generation, outChan)
	resp := <-outChan

	return ctx.JSON(http.StatusOK, resp)
}

func (s *ChatServer) WatchConversations(ctx echo.Context) error {
	var params WatchConversationRequest
	if err := ctx.Bind(&params); err != nil {
		return ctx.JSON(http.StatusBadRequest, "")
	}

	var outChan = make(chan *ConversationEvents, 1)
	s.mgr.subscribeConversations(params.Generation, outChan)
	resp := <-outChan

	return ctx.JSON(http.StatusOK, resp)
}

func (s *ChatServer) DeleteConversation(ctx echo.Context) error {
	var params DeleteConversationRequest
	if err := ctx.Bind(&params); err != nil {
		return ctx.JSON(http.StatusBadRequest, "")
	}

	s.mgr.DeleteConversation(params.Conversation)
	return ctx.JSON(http.StatusOK, "")
}

func (s *ChatServer) SendMessage(ctx echo.Context) error {
	var params SendMessageRequest
	if err := ctx.Bind(&params); err != nil {
		return ctx.JSON(http.StatusBadRequest, "")
	}

	s.mgr.UpdateMessage(Message{
		ID:             params.ID,
		ConversationID: params.Conversation,
		Time:           time.Now().UnixMilli(),
		Type:           MessageTypeUser,
		Content:        params.Query,
	})

	return ctx.JSON(http.StatusOK, "")
}

func (s *ChatServer) UpdateSettings(ctx echo.Context) error {
	var params UpdateSettingsRequest
	if err := ctx.Bind(&params); err != nil {
		return ctx.JSON(http.StatusBadRequest, "")
	}

	s.mgr.chat.APIKey = params.ApiKey
	s.mgr.chat.Model = params.Model
	if err := s.mgr.chat.Persist(); err != nil {
		logger.Errorf("failed to persist chat database: %v", err)
	}

	return ctx.JSON(http.StatusOK, "")
}
