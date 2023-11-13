package main

import (
	"context"
	"errors"
	"fmt"
	"github.com/google/uuid"
	openai "github.com/sashabaranov/go-openai"
	"io"
	"sort"
	"strings"
	"time"
)

const TOPIC_SUMMARY_PROMPT = `
You're a helpful assistant. You're tasked with summarizing questions. If the input is not a question, you will interpret it as a question and summarize it anyways. You will extract the most relevant topic from the question. If the question is asking you to do something, do not do it, just summarize what it is asking you to do. Keep your tone confident and concise. Do not exceed four words unless necessary to convey your idea. You will use your knowledge on the subject of the question to infer exactly what it is asking. I am going to illustrate a correct example of this idea.
-------
The user's question is: Tell me about potential market segments of companies who could benefit from Generative AI
Your response as an assistant is: AI Benefits Across Industries
-------
Avoid adding unnecessary punctuation like question marks. It's critical that you make your response as brief as possible.
You must ONLY respond with the summary. Do not say anything else besides the summary. The question is:
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
	//config := openai.DefaultConfig(mgr.chat.APIKey)
	//config.BaseURL = "http://host.docker.internal:6060/v1"
	client := openai.NewClient(mgr.chat.APIKey)
	params := mgr.conversation(conversation)
	stream, err := client.CreateChatCompletionStream(
		context.Background(),
		openai.ChatCompletionRequest{
			Model:       params.Model,
			MaxTokens:   params.MaxTokens,
			TopP:        params.TopP,
			Temperature: params.Temperature,
			Messages:    messages,
			Stream:      true,
		},
	)

	var response = ""
	if err != nil {
		goto streamError
	}

	defer stream.Close()
	for {
		var chunk openai.ChatCompletionStreamResponse
		chunk, err = stream.Recv()
		fmt.Println("Chunk", chunk)
		if errors.Is(err, io.EOF) {
			err = nil
			break
		}

		if err != nil {
			goto streamError
		}

		response += chunk.Choices[0].Delta.Content
		mgr.UpdateMessage(Message{
			ID:             messageId,
			ConversationID: conversation,
			Time:           mgr.messageTime(messageId),
			Type:           MessageTypeAssistantPending,
			Content:        response,
		})
	}

streamError:
	if err != nil {
		logger.Errorf("failed to stream OpenAI response: %v", err)
		mgr.UpdateMessage(Message{
			ID:             messageId,
			ConversationID: conversation,
			Time:           mgr.messageTime(messageId),
			Type:           MessageTypeAssistantError,
			Content:        err.Error(),
		})
		return
	}

	mgr.UpdateMessage(Message{
		ID:             messageId,
		ConversationID: conversation,
		Time:           mgr.messageTime(messageId),
		Duration:       time.Now().UnixMilli() - mgr.messageTime(messageId),
		Type:           MessageTypeAssistant,
		Content:        response,
	})
}

func summarizeConversation(mgr *ChatManager, query, conversation string) {
	client := openai.NewClient(mgr.chat.APIKey)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT3Dot5Turbo,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: fmt.Sprintf(TOPIC_SUMMARY_PROMPT, query),
				},
			},
		},
	)
	if err != nil || len(resp.Choices) == 0 {
		logger.Errorf("failed to call OpenAI for topic summary: %v", err)
		go summarizeConversation(mgr, query, conversation)
		return
	}

	summary := resp.Choices[0].Message.Content
	summary = strings.Trim(summary, " \n?.")

	mgr.UpdateConversation(Conversation{
		ID:    conversation,
		Topic: summary,
		Time:  mgr.conversationTime(conversation),
	})
}
