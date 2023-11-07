import {useEffect, useState} from "react";
import {createDockerDesktopClient} from "@docker/extension-api-client";
import {v4 as uuidv4} from 'uuid';

export type MessageType = "user" | "assistant" | "assistant_pending" | "assistant_error"

export interface Message {
    id: string
    content: string
    time: number
    duration: number
    type: MessageType
}

interface ConversationInternal {
    messages: Map<string, Message>
    generation: number
}

export interface ConversationData {
    id: string
    topic: string
    time: number
    topP: number
    model: string
    temperature: number
    maxTokens: number
}

export type Conversation = ConversationInternal & ConversationData

export interface Chat {
    conversations: Map<string, Conversation>
    generation: number
}

type EventType = "update" | "delete"

interface ConversationEvent {
    type: EventType
    conversation: ConversationData
}

interface ConversationEvents {
    generation: number
    events: ConversationEvent[]
}

interface MessageEvent {
    message: Message
}

interface MessageEvents {
    generation: number
    events: MessageEvent[]
}

export const useChat = () => {
    const [chat, setChat] = useState({
        conversations: new Map<string, Conversation>(),
        generation: 0
    } as Chat)
    const [conversation, setConversation] = useState("")

    const ddClient = createDockerDesktopClient()

    // Subscribe to conversation updates
    useEffect(() => {
        let ticking = false

        const updateTick = async () => {
            const events: ConversationEvents = await ddClient.extension.vm?.service?.post("/watch_conversations", JSON.stringify({
                generation: chat.generation
            })) as ConversationEvents
            console.log(events)

            for (const evt of events.events) {
                switch (evt.type) {
                    case "update":
                        let conv: Conversation | undefined = chat.conversations.get(evt.conversation.id)
                        if (!conv) {
                            conv = {
                                messages: new Map<string, Message>(),
                                generation: 0,
                                ...evt.conversation
                            }
                        } else {
                            Object.assign(conv, evt.conversation)
                        }
                        chat.conversations.set(evt.conversation.id, conv)
                        break
                    case "delete":
                        chat.conversations.delete(evt.conversation.id)
                        break
                    default:
                        throw Error(`invalid event type ${evt.type}`)
                }
            }

            setChat({
                conversations: chat.conversations,
                generation: events.generation
            })
        }

        const update = setInterval(async () => {
            if (ticking)
                return
            ticking = true
            await updateTick()
            ticking = false
        }, 0)

        return () => clearInterval(update)
    })

    // Subscribe to message updates
    useEffect(() => {
        let ticking = false
        if (!Boolean(conversation))
            return

        const updateTick = async () => {
            const events: MessageEvents = await ddClient.extension.vm?.service?.post("/watch_messages", JSON.stringify({
                generation: chat.conversations.get(conversation)!.generation,
                conversation: conversation
            })) as MessageEvents

            if (events.events == null || events.events.length == 0)
                return

            let conv: Conversation = chat.conversations.get(conversation)!
            for (const evt of events.events) {
                conv.messages.set(evt.message.id, evt.message)
            }
            conv.generation = events.generation
            chat.conversations.set(conversation, conv)

            setChat({
                conversations: chat.conversations,
                generation: chat.generation
            })
        }

        const update = setInterval(async () => {
            if (ticking)
                return
            ticking = true
            await updateTick()
            ticking = false
        }, 0)

        return () => clearInterval(update)
    }, [conversation])

    const sendMessage = async (query: string) => {
        let msgConversation = conversation
        const msgId = uuidv4()
        if (!msgConversation) {
            msgConversation = uuidv4()
            // @ts-ignore
            chat.conversations.set(msgConversation, {
                messages: new Map<string, Message>(Object.entries({
                    [msgId]: {
                        id: msgId,
                        content: query,
                        time: Date.now(),
                        type: "user"
                    } as Message
                })),
                generation: 0,
            })
        }

        await ddClient.extension.vm?.service?.post("/message", JSON.stringify({
            conversation: msgConversation,
            query: query,
            id: msgId
        }))
        setConversation(msgConversation)
    }

    const deleteConversation = async (id: string) => {
        await ddClient.extension.vm?.service?.post("/delete_conversation", JSON.stringify({conversation: id}))
    }

    const updateConversation = async (conversation: ConversationData) => {
        console.log("Saving conv")
        if (!chat.conversations.get(conversation.id)) {
            conversation.id = uuidv4()
            chat.conversations.set(conversation.id, {
                ...conversation,
                messages: new Map<string, Message>(),
                generation: 0,
            })
            setConversation(conversation.id)
            setChat({
                conversations: chat.conversations,
                generation: chat.generation
            })
            console.log("Created new")
        }
        await ddClient.extension.vm?.service?.post("/conversation", JSON.stringify(conversation))
    }

    return {chat, conversation, setConversation, sendMessage, deleteConversation, updateConversation }
}
