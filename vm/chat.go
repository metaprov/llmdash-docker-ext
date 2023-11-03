// Liam Sagi (c) 2023
package main

import (
	"encoding/json"
	"io"
	"os"
)

const LLMDASH_DB = "./db.json"

type (
	MessageType string
	EventType   string
)

const (
	MessageTypeUser             MessageType = "user"
	MessageTypeAssistantPending MessageType = "assistant_pending"
	MessageTypeAssistantError   MessageType = "assistant_error"
	MessageTypeAssistant        MessageType = "assistant"

	EventTypeUpdate EventType = "update"
	EventTypeDelete EventType = "delete"
)

type Chat struct {
	APIKey string `json:"apiKey"`
	Model  string `json:"model"`

	Conversations []Conversation `json:"conversations"`
	Messages      []Message      `json:"messages"`

	messagesById      map[string]Message
	conversationsById map[string]Conversation
}

type Conversation struct {
	ID    string `json:"id"`
	Topic string `json:"topic"`
	Time  int64  `json:"time"`
}

type Message struct {
	ID             string      `json:"id"`
	ConversationID string      `json:"conversationId"`
	Time           int64       `json:"time"`
	Duration       int64       `json:"duration,omitempty"`
	Type           MessageType `json:"type"`
	Content        string      `json:"content"`
}

func (c *Chat) Persist() error {
	c.Messages, c.Conversations = nil, nil
	// Flatten our maps; this is where we're really storing our data
	for _, o := range c.conversationsById {
		c.Conversations = append(c.Conversations, o)
	}
	for _, o := range c.messagesById {
		c.Messages = append(c.Messages, o)
	}

	data, err := json.Marshal(c)
	if err != nil {
		return err
	}

	file, err := os.Create(LLMDASH_DB)
	if err != nil {
		return err
	}
	defer file.Close()

	_ = file.Truncate(0)
	_, err = file.Write(data)
	if err != nil {
		return err
	}

	return nil
}

func (c *Chat) Load() {
	c.conversationsById = make(map[string]Conversation)
	c.messagesById = make(map[string]Message)

	file, err := os.Open(LLMDASH_DB)
	if err != nil {
		logger.Errorf("failed to load database file: %v", err)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		logger.Errorf("failed to read database: %v", err)
		return
	}

	err = json.Unmarshal(data, c)
	if err != nil {
		logger.Errorf("failed to deserialize database: %v", err)
		return
	}

	// Map our objects to their UIDs
	for _, o := range c.Conversations {
		c.conversationsById[o.ID] = o
	}
	for _, o := range c.Messages {
		c.messagesById[o.ID] = o
	}
}
