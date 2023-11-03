package main

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	openai "github.com/sashabaranov/go-openai"
	"sort"
	"time"
)

const TOPIC_SUMMARY_PROMPT = `
You're a helpful assistant. You're tasked with summarizing questions. You will extract the most relevant topic from the question. If the question is asking you to do something, do not do it, just summarize what it is asking you to do. Keep your tone confident and concise. Do not exceed four words unless necessary to convey your idea. You will use your knowledge on the subject of the question to infer exactly what it is asking. I am going to illustrate a correct example of this idea. 
-------
The user's question is: Tell me about potential market segments of companies who could benefit from Generative AI
Your response as an assistant is: AI Benefits Across Industries
-------
Avoid adding unnecessary punctuation like question marks. It's critical that you make your response as brief as possible. If the summary is longer than six words, I will be fired. It's up to you to decide my fate and perform your task as an assistant correctly. If a topic is longer than six words, you will reword it to be four or less words. The question is:
%s
`

// Async functions for managing calls to GPT

func replyToUser(mgr *ChatManager, conversation string, message *string) {
	// Check if we're creating a new reply. The only case this does not happen
	// is on startup (and we still have un-replied messages)
	var messageId string
	if message == nil {
		messageId = uuid.New().String()
		mgr.UpdateMessage(Message{
			ID:             messageId,
			ConversationID: conversation,
			Time:           time.Now().UnixMilli() + 1,
			Type:           MessageTypeAssistantPending,
		})
	} else {
		messageId = *message
	}

	// Gather previous messages
	var messages []openai.ChatCompletionMessage
	var conversationMessages []Message
	for _, msg := range mgr.chat.Messages {
		if msg.ConversationID == conversation {
			conversationMessages = append(conversationMessages, msg)
		}
	}
	sort.Slice(conversationMessages, func(i, j int) bool {
		return conversationMessages[i].Time < conversationMessages[j].Time
	})
	for _, msg := range conversationMessages {
		var role string
		switch msg.Type {
		case MessageTypeUser:
			role = openai.ChatMessageRoleUser
		case MessageTypeAssistant:
			role = openai.ChatMessageRoleAssistant
		default:
			continue
		}
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    role,
			Content: msg.Content,
		})
	}

	// Call the OpenAI API
	client := openai.NewClient(mgr.chat.APIKey)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:    openai.GPT3Dot5Turbo,
			Messages: messages,
		},
	)

	if err != nil || len(resp.Choices) == 0 {
		logger.Errorf("failed to call OpenAI: %v", err)
		mgr.UpdateMessage(Message{
			ID:             messageId,
			ConversationID: conversation,
			Time:           mgr.messageTime(messageId),
			Type:           MessageTypeAssistantError,
		})
		return
	}

	fmt.Println("mili", time.Now().UnixMilli(), mgr.messageTime(messageId))
	mgr.UpdateMessage(Message{
		ID:             messageId,
		ConversationID: conversation,
		Time:           mgr.messageTime(messageId),
		Duration:       time.Now().UnixMilli() - mgr.messageTime(messageId),
		Type:           MessageTypeAssistant,
		Content:        resp.Choices[0].Message.Content,
	})
}

func summarizeConversation(mgr *ChatManager, query, conversation string) {
	client := openai.NewClient(mgr.chat.APIKey)
	resp, err := client.CreateCompletion(
		context.Background(),
		openai.CompletionRequest{
			Model:     openai.GPT3Dot5TurboInstruct,
			Prompt:    fmt.Sprintf(TOPIC_SUMMARY_PROMPT, query),
			MaxTokens: 30,
		},
	)
	if err != nil || len(resp.Choices) == 0 {
		logger.Errorf("failed to call OpenAI for topic summary: %v", err)
		return
	}

	mgr.UpdateConversation(Conversation{
		ID:    conversation,
		Topic: resp.Choices[0].Text,
		Time:  mgr.conversationTime(conversation),
	})
}
