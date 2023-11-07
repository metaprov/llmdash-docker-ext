import {Box, Button, Card, Divider, Typography, useTheme} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {Chat, Conversation} from "../../hooks/useChat";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import {useState} from "react";
import Dialog from "../Dialog/Dialog";

interface ConversationProps {
    chat: Chat
    conversation: string,
    setConversation: (conversation: string) => void
    deleteConversation: (conversation: string) => void
}

function hexToRGBA(hex: string, alpha: string) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }
}

interface ConversationElementProps {
    conversation?: Conversation
    onClick: () => void
    selected?: boolean
    onDelete: () => void
}

const ConversationElement = (props: ConversationElementProps) => {
    const [editing, setEditing] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false);
    const theme = useTheme()

    const selectedColor = theme.palette.mode == "light" ? theme.palette.docker.grey[300] : theme.palette.docker.grey[200]

    return (
        <Button
            fullWidth
            onClick={props.onClick}
            sx={{
                height: 45,
                m: 1,
                marginBottom: Boolean(props.conversation) ? '4px' : 0,
                marginTop: !Boolean(props.conversation) ? '8px' : 0,
                borderRadius: 1,
                border: !Boolean(props.conversation) ? 1 : 0,
                borderColor: theme.palette.docker.grey[300],
                backgroundColor: props.selected ? selectedColor : theme.palette.docker.grey[200],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                position: 'relative',
                width: 'calc(100% - 16px)',
                '&:hover': {
                    backgroundColor: props.selected ? selectedColor : theme.palette.docker.grey[300],
                },
                '&:focus': {
                    backgroundColor: props.selected ? selectedColor : theme.palette.docker.grey[300],
                }
            }}>
            <Dialog
                title="Delete Conversation"
                text={`Are you sure you want to delete ${props.conversation?.topic}?`}
                confirmation={true}
                open={confirmOpen}
                setOpen={setConfirmOpen}
                onConfirm={props.onDelete}
            />
            {!Boolean(props.conversation) ?
                <AddIcon sx={{color: theme.palette.docker.grey[500], width: 24, height: 30, fontSize: 30}}/> :
                <ChatBubbleOutlineIcon
                    sx={{color: theme.palette.docker.grey[500], width: 24, height: 30, fontSize: 30}}/>
            }
            <Typography sx={{
                color: theme.palette.docker.grey[800],
                ml: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {Boolean(props.conversation) ? props.conversation?.topic : 'New Chat'}
            </Typography>
            {props.selected &&
                <Box sx={{
                    position: 'absolute',
                    width: '25%',
                    height: '100%',
                    display: 'flex',
                    top: 0,
                    right: '20%',
                    background:
                        `linear-gradient(to left, ${hexToRGBA(selectedColor, '1')}, ${hexToRGBA(selectedColor, '0')})`,
                }}/>
            }
            {props.selected &&
                <Box sx={{
                    position: 'absolute',
                    width: '20%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'end',
                    top: 0,
                    right: 0,
                    borderRadius: 1,
                    background: selectedColor,
                }}>
                    {props.conversation &&
                        <DeleteIcon onClick={() => setConfirmOpen(true)} sx={{
                            color: theme.palette.docker.grey[800],
                            fontSize: 20,
                            mr: 1,
                            '&:hover': {
                                color: theme.palette.docker.grey[700],
                            },
                        }}/>
                    }
                </Box>
            }
        </Button>
    )
}

export default function Conversations(props: ConversationProps) {
    const theme = useTheme()

    const prepareConversations = () => {
        if (!props.chat)
            return []
        const conversationArr: Conversation[] = [];
        for (const message of props.chat.conversations.values()) {
            conversationArr.push(message)
        }

        conversationArr.sort((x, y) => y.time - x.time)

        return conversationArr
    }

    return (
        <Card sx={{
            width: 250,
            height: '100%',
            '&:hover': {
                boxShadow: 'none',
            },
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            borderColor: theme.palette.docker.grey[300],
            overflowY: 'scroll'
        }}>
            <ConversationElement onDelete={() => {
            }} onClick={() => props.setConversation('')}/>
            <Divider sx={{backgroundColor: theme.palette.docker.grey[200], ml: 2, mr: 2}}/>
            {prepareConversations().map((conv) => (
                <ConversationElement
                    key={conv.id}
                    conversation={conv}
                    onClick={() => props.setConversation(conv.id)}
                    onDelete={() => props.deleteConversation(conv.id)}
                    selected={props.conversation == conv.id}
                />
            ))}
        </Card>
    )
}