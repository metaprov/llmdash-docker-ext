package main

import (
	"gotest.tools/assert"
	"os"
	"testing"
)

func TestChatManager_Conversations(t *testing.T) {
	chat := NewChatManager()

	var out = make(chan *ConversationEvents, 1)
	chat.UpdateConversation(Conversation{ID: "test", Topic: "test"})
	chat.subscribeConversations(0, out)
	resp := <-out
	assert.Equal(t, len(resp.Events), 1)

	chat.DeleteConversation("test")
	chat.subscribeConversations(resp.Generation, out)
	resp = <-out
	assert.Equal(t, len(resp.Events), 1)
	assert.Equal(t, resp.Events[0].Type, EventTypeDelete)
}

func TestChatManager_Messages(t *testing.T) {
	chat := NewChatManager()

	var out = make(chan *MessageEvents, 1)
	chat.UpdateMessage(Message{ID: "test", ConversationID: "test"})
	chat.UpdateMessage(Message{ID: "golang", ConversationID: "test"})
	assert.Equal(t, len(chat.conversationMap), 1)
	chat.subscribeMessages("test", 0, out)
	resp := <-out
	assert.Equal(t, len(resp.Events), 2)
	chat.DeleteConversation("test")
	assert.Equal(t, len(chat.chat.Messages), 0)
}

func TestChatManager_AI(t *testing.T) {
	_ = os.Remove("./db.json")
	chat := NewChatManager()
	chat.chat.APIKey = "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"

	var out = make(chan *MessageEvents, 1)
	chat.UpdateMessage(Message{
		ID:             "test",
		Content:        "how would i serialize a date in go",
		Type:           MessageTypeUser,
		ConversationID: "test",
	})

	var generation int64 = 0
	for {
		out = make(chan *MessageEvents, 1)
		chat.subscribeMessages("test", generation, out)
		resp := <-out
		var received = false
		for _, evt := range resp.Events {
			if evt.Message.Type == MessageTypeAssistant {
				received = true
			}
		}
		if received {
			break
		}
		generation = resp.Generation
	}
}
