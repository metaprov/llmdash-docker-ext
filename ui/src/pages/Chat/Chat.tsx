import Conversations from "../../components/Chat/Conversations";
import {Box} from "@mui/material";
import Messenger from "../../components/Chat/Messenger";
import {useChat} from "../../hooks/useChat";
import React, {useEffect, useRef} from "react";

export default function Chat() {
    const { chat, conversation, setConversation, sendMessage, deleteConversation } = useChat();
    const chatRef: React.MutableRefObject<HTMLDivElement | undefined> = useRef()

    const updateChatHeight = () => {
        // Viewport height - top position - bottom margin
        const div = chatRef.current!
        const height = window.innerHeight - div.getBoundingClientRect().y - 16
        div.style.height = `${height}px`
    }

    useEffect(() => {
        updateChatHeight()
        window.addEventListener('resize', updateChatHeight)
        return () => window.removeEventListener('resize', updateChatHeight)
    })

    return (
        <Box sx={{ display: 'flex', gap: '8px', height: 1 }} ref={chatRef}>
            <Conversations
                chat={chat}
                conversation={conversation}
                setConversation={setConversation}
                deleteConversation={deleteConversation}
            />
            <Messenger
                chat={chat}
                conversation={Boolean(conversation) ? conversation : undefined}
                sendMessage={sendMessage}
            />
        </Box>
    )
}