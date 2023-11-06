import {Button, Card, Divider, Typography, useTheme} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {Chat} from "../../hooks/useChat";


interface ConversationProps {
    chat: Chat
    setConversation: (conversation: string) => void
}

const ConversationElement = (props: { children: any, new?: boolean, onClick: () => void }) => {
    const theme = useTheme()

    return (
        <Button
            fullWidth
            onClick={props.onClick}
            sx={{
                height: 45,
                m: 1,
                marginBottom: '4px',
                marginTop: props.new ? '8px' : '4px',
                borderRadius: 1,
                border: props.new ? 1 : 0,
                borderColor: theme.palette.docker.grey[300],
                backgroundColor: theme.palette.docker.grey[200],
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
            {props.children}
        </Button>
    )
}

export default function Conversations(props: ConversationProps) {
    const theme = useTheme()

    return (
        <Card sx={{
            width: 200,
            height: '100%',
            '&:hover': {
                boxShadow: 'none',
            },
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            borderColor: theme.palette.docker.grey[300]
        }}>
            <ConversationElement onClick={() => props.setConversation('')} new={true}>
                <AddIcon sx={{color: theme.palette.docker.grey[500], width: 24, height: 30, fontSize: 30}}/>
                <Typography sx={{color: theme.palette.common.black, ml: 2}}>
                    New Chat
                </Typography>
            </ConversationElement>
            <Divider sx={{backgroundColor: theme.palette.docker.grey[200], ml: 2, mr: 2}}/>
        </Card>
    )
}