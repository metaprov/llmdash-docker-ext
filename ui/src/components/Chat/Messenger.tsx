import {Box, Button, Card, Stack, TextField, Typography, useTheme} from "@mui/material";
import {Chat, Message as MessageData} from "../../hooks/useChat";
import SendIcon from '@mui/icons-material/Send';
import Message from "./Message";
import React, {useEffect, useRef, useState} from "react";

interface MessengerProps {
    chat: Chat
    conversation?: string
    sendMessage: (message: string) => Promise<void>
}

export default function Messenger(props: MessengerProps) {
    const theme = useTheme()
    const inputRef: React.MutableRefObject<HTMLTextAreaElement | undefined> = useRef()
    const contentRef: React.MutableRefObject<HTMLDivElement | undefined> = useRef()
    const [sendingMessage, setSendingMessage] = useState(false)
    let shifting = false

    const prepareMessages = () => {
        if (!props.conversation)
            return []
        const conversation = props.chat.conversations.get(props.conversation)
        if (!conversation)
            return []
        const messageArr: MessageData[] = [];
        for (const message of conversation.messages.values()) {
            messageArr.push(message)
        }

        messageArr.sort((x, y) => x.time - y.time)

        return messageArr
    }

    const handleEnter = () => {
        setSendingMessage(true)
        props.sendMessage(inputRef.current?.value!)
            .then(() => {
                if (inputRef.current)
                    inputRef.current.value = ''
            })
            .finally(() => {
                setSendingMessage(false)
            })
    }

    // Scroll to the bottom as we stream the response
    const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            entry.target.parentElement!.parentElement!.scrollTop = entry.target.parentElement!.parentElement!.scrollHeight
        }
    })

    return (
        <Card sx={{
            flexGrow: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            '&:hover': {
                boxShadow: 'none',
            },
            borderColor: theme.palette.docker.grey[300]
        }}>
            <Typography variant="h1" sx={{
                position: 'absolute',
                inset: '0 0 0 0',
                margin: 'auto',
                justifyContent: 'center',
                alignItems: 'center',
                display: props.conversation ? 'none' : 'flex',
                color: theme.palette.docker.grey[300],
            }}>
                LLMDash
            </Typography>
            {/* Message Area */}
            <Box sx={{display: 'flex', justifyContent: 'center', flexGrow: 1, m: 1, overflowY: 'scroll'}}>
                <Stack
                    ref={contentRef}
                    spacing={1}
                    sx={{
                        minWidth: 'min(100%, 600px)',
                        maxWidth: 'min(100%, 600px)'
                }}>
                    {Boolean(props.conversation) && prepareMessages().map((msg) => (
                        <Message message={msg} key={msg.id} observer={resizeObserver}/>
                    ))}
                </Stack>
            </Box>
            {/* Prompt Area */}
            <Box sx={{display: 'flex', justifyContent: 'center', minHeight: 40, m: 1, flexShrink: 0}}>
                <Box sx={{
                    border: 1,
                    borderColor: theme.palette.docker.grey[400],
                    borderRadius: 2,
                    position: 'relative',
                    minWidth: 'min(100%, 600px)',
                    '& fieldset': {
                        border: '0 !important'
                    }
                }}>
                    <TextField
                        maxRows={3}
                        multiline
                        sx={{background: 'none', minWidth: 'calc(100% - 32px)'}}
                        placeholder="Send a message"
                        inputRef={inputRef}
                        inputProps={{
                            onKeyUp: (e) => {
                                if (e.key == 'Shift') {
                                    shifting = false
                                }
                            },
                            onKeyDown: (e) => {
                                if (e.key == 'Shift') {
                                    shifting = true
                                }
                                if (e.key === 'Enter' && !shifting) {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    handleEnter()
                                }
                            },
                        }}
                    />
                    <Button sx={{
                        position: 'absolute',
                        right: '4px',
                        bottom: '4px',
                        maxHeight: 30,
                        maxWidth: 30,
                        pl: 0,
                        pr: 0,
                        minWidth: 30
                    }}>
                        <SendIcon sx={{fontSize: '16px !important'}}/>
                    </Button>
                </Box>
            </Box>
        </Card>
    )
}