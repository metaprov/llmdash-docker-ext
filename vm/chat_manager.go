// Liam Sagi (c) 2023
package main

import (
	"fmt"
	"sync"
	"time"
)

// ConversationEvent represents a single event for a chat object.
// The client uses long-polling to stay up to date with all events
type ConversationEvent struct {
	Generation   int64         `json:"generation"`
	Type         EventType     `json:"type"`
	Conversation *Conversation `json:"conversation,omitempty"`
}

type MessageEvent struct {
	Generation int64    `json:"generation"`
	Message    *Message `json:"message,omitempty"`
}

type ConversationEvents struct {
	Generation int64               `json:"generation"`
	Events     []ConversationEvent `json:"events"`
}

type MessageEvents struct {
	Generation int64          `json:"generation"`
	Events     []MessageEvent `json:"events"`
}

type subscriber[T interface{}] struct {
	generation int64
	uid        string
	ch         chan<- T
}

type ChatManager struct {
	sync.Mutex
	chat *Chat

	conversationMap        map[string]*ConversationEvent
	messageMap             map[string]map[string]*MessageEvent
	conversationSubscriber *subscriber[*ConversationEvents]
	messageSubscriber      *subscriber[*MessageEvents]

	// Store a single generation for all conversations. We need to
	// stay up-to-date with all changes to conversations (i.e. asynchronous topic updates)
	conversationGeneration int64

	// Store a generation for each conversation (by uid). We only need message
	// updates for the conversation we're looking at- this is to avoid loading
	// the entire message database on each UI refresh
	messageGeneration map[string]int64
}

func NewChatManager() *ChatManager {
	mgr := &ChatManager{
		conversationGeneration: 1,
		conversationMap:        make(map[string]*ConversationEvent),
		messageMap:             make(map[string]map[string]*MessageEvent),
		messageGeneration:      make(map[string]int64),
		chat:                   &Chat{},
	}
	mgr.chat.Load()

	// Initialize the event maps with our initial objects
	for _, conversation := range mgr.chat.Conversations {
		mgr.conversationMap[conversation.ID] = &ConversationEvent{
			Generation:   1,
			Type:         EventTypeUpdate,
			Conversation: &conversation,
		}
		mgr.messageMap[conversation.ID] = make(map[string]*MessageEvent)
		mgr.messageGeneration[conversation.ID] = 1
	}

	for _, message := range mgr.chat.Messages {
		mgr.messageMap[message.ConversationID][message.ID] = &MessageEvent{
			Generation: 1,
			Message:    &message,
		}
	}

	return mgr
}

func (s *ChatManager) updateConversationInternal(object Conversation) {
	s.conversationGeneration++
	s.chat.conversationsById[object.ID] = object
	s.conversationMap[object.ID] = &ConversationEvent{
		Generation:   s.conversationGeneration,
		Type:         EventTypeUpdate,
		Conversation: &object,
	}
	if err := s.chat.Persist(); err != nil {
		logger.Errorf("failed to persist chat database: %v", err)
	}
	s.fireConversationSubscriber()
}

func (s *ChatManager) UpdateConversation(object Conversation) {
	s.Lock()
	s.updateConversationInternal(object)
	s.Unlock()
}

func (s *ChatManager) DeleteConversation(uid string) {
	s.Lock()
	s.conversationGeneration++
	s.conversationMap[uid] = &ConversationEvent{
		Generation: s.conversationGeneration,
		Type:       EventTypeDelete,
	}
	delete(s.messageGeneration, uid)
	delete(s.chat.conversationsById, uid)
	for mId, message := range s.chat.messagesById {
		if message.ConversationID == uid {
			delete(s.chat.messagesById, mId)
		}
	}
	if err := s.chat.Persist(); err != nil {
		logger.Errorf("failed to persist chat database: %v", err)
	}
	s.fireConversationSubscriber()
	s.Unlock()
}

func (s *ChatManager) updateMessageInternal(object Message, persist bool) {
	if _, ok := s.chat.conversationsById[object.ConversationID]; !ok {
		// This message is coming from a conversation that doesn't exist; we need to create it
		s.messageGeneration[object.ConversationID] = 1
		s.messageMap[object.ConversationID] = make(map[string]*MessageEvent)
		s.updateConversationInternal(Conversation{
			ID:    object.ConversationID,
			Topic: "New Conversation",
			Time:  time.Now().UnixMilli(),
		})
		go summarizeConversation(s, object.Content, object.ConversationID)
	} else {
		s.messageGeneration[object.ConversationID]++
	}
	_, exists := s.messageMap[object.ConversationID][object.ID]
	if !exists && object.Time == 0 {
		object.Time = time.Now().UnixMilli()
	}
	s.messageMap[object.ConversationID][object.ID] = &MessageEvent{
		Generation: s.messageGeneration[object.ConversationID],
		Message:    &object,
	}
	s.chat.messagesById[object.ID] = object
	if !exists && object.Type == MessageTypeUser {
		go replyToUser(s, object.ConversationID, nil)
	}
	if persist {
		if err := s.chat.Persist(); err != nil {
			logger.Errorf("failed to persist chat database: %v", err)
		}
	}
	s.fireMessageSubscriber()
}

func (s *ChatManager) UpdateMessage(object Message) {
	s.Lock()
	s.updateMessageInternal(object, true)
	s.Unlock()
}

func (s *ChatManager) UpdateMessageLive(object Message) {
	// Update a message without persistence (i.e. streaming updates)
	s.Lock()
	s.updateMessageInternal(object, false)
	s.Unlock()
}

func (s *ChatManager) subscribeConversations(generation int64, out chan<- *ConversationEvents) {
	s.Lock()
	s.conversationSubscriber = &subscriber[*ConversationEvents]{
		generation: generation,
		ch:         out,
	}

	if s.conversationGeneration != generation {
		s.fireConversationSubscriber()
	}
	s.Unlock()
}

func (s *ChatManager) subscribeMessages(conversation string, generation int64, out chan<- *MessageEvents) {
	s.Lock()
	s.messageSubscriber = &subscriber[*MessageEvents]{
		generation: generation,
		uid:        conversation,
		ch:         out,
	}

	if s.messageGeneration[conversation] != generation {
		fmt.Println("firing", s.messageGeneration, conversation)
		s.fireMessageSubscriber()
	}
	s.Unlock()
}

func (s *ChatManager) fireConversationSubscriber() {
	if s.conversationSubscriber == nil {
		return
	}

	var events = ConversationEvents{Generation: s.conversationGeneration}
	for _, event := range s.conversationMap {
		if event.Generation > s.conversationSubscriber.generation {
			events.Events = append(events.Events, *event)
		}
	}

	if len(events.Events) == 0 {
		return
	}

	s.conversationSubscriber.ch <- &events
	s.conversationSubscriber = nil
}

func (s *ChatManager) fireMessageSubscriber() {
	if s.messageSubscriber == nil {
		return
	}
	if _, ok := s.messageMap[s.messageSubscriber.uid]; !ok {
		return
	}
	var events = MessageEvents{Generation: s.messageGeneration[s.messageSubscriber.uid]}
	for _, event := range s.messageMap[s.messageSubscriber.uid] {
		if event.Generation > s.messageSubscriber.generation {
			events.Events = append(events.Events, *event)
		}
	}

	if len(events.Events) == 0 {
		return
	}

	s.messageSubscriber.ch <- &events
	s.messageSubscriber = nil
}

func (s *ChatManager) messageTime(id string) int64 {
	s.Lock()
	defer s.Unlock()
	if msg, ok := s.chat.messagesById[id]; ok {
		return msg.Time
	}
	return time.Now().UnixMilli()
}

func (s *ChatManager) conversationTime(id string) int64 {
	s.Lock()
	defer s.Unlock()
	if msg, ok := s.chat.conversationsById[id]; ok {
		return msg.Time
	}
	s.Unlock()
	return time.Now().UnixMilli()
}
