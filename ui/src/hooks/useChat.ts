import {useEffect, useState} from "react";
import {createDockerDesktopClient} from "@docker/extension-api-client";

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

interface ConversationData {
    id: string
    topic: string
    time: number
}

type Conversation = ConversationInternal & ConversationData

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
        const update = setInterval(async () => {
            const response = await ddClient.extension.vm?.service?.post("/watch_conversations", JSON.stringify({
                generation: chat.generation
            }))
            const events: ConversationEvents = JSON.parse(atob(response as string))

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
        }, 10)

        return () => clearInterval(update)
    }, [])

    // Subscribe to message updates
    useEffect(() => {
        if (!Boolean(conversation))
            return

        const update = setInterval(async () => {
            const response = await ddClient.extension.vm?.service?.post("/watch_messages", JSON.stringify({
                generation: chat.generation,
                conversation: conversation
            }))
            const events: MessageEvents = JSON.parse(atob(response as string))
            if (events.events.length == 0)
                return

            let conv: Conversation = chat.conversations.get(conversation)!
            for (const evt of events.events) {
                conv.messages.set(evt.message.id, evt.message)
            }

            setChat({
                conversations: chat.conversations,
                generation: chat.generation
            })
        }, 10)

        return () => clearInterval(update)
    }, [conversation])

    return { chat, conversation, setConversation }
}
