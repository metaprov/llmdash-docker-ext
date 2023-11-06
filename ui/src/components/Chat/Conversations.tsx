import {Button, Card, Divider, Typography, useTheme} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {Chat, Conversation, Message as MessageData} from "../../hooks/useChat";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

interface ConversationProps {
    chat: Chat
    conversation: string,
    setConversation: (conversation: string) => void
    deleteConversation: (conversation: string) => void
}

const ConversationElement = (props: { conversation?: Conversation, onClick: () => void, selected?: boolean }) => {
    const theme = useTheme()

    return (
        <Button
            fullWidth
            onClick={props.onClick}
            sx={{
                height: 45,
                m: 1,
                marginBottom: '4px',
                marginTop: !Boolean(props.conversation) ? '8px' : '4px',
                borderRadius: 1,
                border: !Boolean(props.conversation) ? 1 : 0,
                borderColor: theme.palette.docker.grey[300],
                backgroundColor: props.selected ? theme.palette.docker.grey[100] : theme.palette.docker.grey[200],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                width: 'calc(100% - 16px)',
                '&:hover': {
                    backgroundColor: theme.palette.docker.grey[300],
                },
                '&:focus': {
                    backgroundColor: theme.palette.docker.grey[300],
                }
            }}>
            {!Boolean(props.conversation) ?
                <AddIcon sx={{color: theme.palette.docker.grey[500], width: 24, height: 30, fontSize: 30}}/> :
                <ChatBubbleOutlineIcon sx={{color: theme.palette.docker.grey[500], width: 24, height: 30, fontSize: 30}}/>
            }
            <Typography sx={{
                color: theme.palette.docker.grey[800],
                ml: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                { Boolean(props.conversation) ? props.conversation?.topic : 'New Chat' }
            </Typography>
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
            <ConversationElement onClick={() => props.setConversation('')}/>
            <Divider sx={{backgroundColor: theme.palette.docker.grey[200], ml: 2, mr: 2}}/>
            { prepareConversations().map((conv) => (
                <ConversationElement
                    key={conv.id}
                    conversation={conv}
                    onClick={() => props.setConversation(conv.id)}
                    selected={props.conversation == conv.id}
                />
            ))}
        </Card>
    )
}