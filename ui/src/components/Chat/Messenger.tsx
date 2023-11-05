import {Box, Button, Card, TextField, useTheme} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import {Chat} from "../../hooks/useChat";
import Message from "./Message";

interface MessengerProps {
    chat: Chat
    conversation?: string
    sendMessage: (message: string) => void
}

export default function Messenger(props: MessengerProps) {
    const theme = useTheme()

    return (
        <Card sx={{
            flexGrow: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
                boxShadow: 'none',
            },
            borderColor: theme.palette.docker.grey[300]
        }}>
            {/* Message Area */}
            <Box sx={{display: 'flex', justifyContent: 'center', flexGrow: 1, m: 1}}>
                <Box sx={{
                    minWidth: 'min(100%, 500px)',
                }}>
                    <Message message={{type: 'assistant'}}/>
                </Box>
            </Box>
            {/* Prompt Area */}
            <Box sx={{display: 'flex', justifyContent: 'center', minHeight: 40, m: 1}}>
                <Box sx={{
                    border: 1,
                    borderColor: theme.palette.docker.grey[400],
                    borderRadius: 2,
                    position: 'relative',
                    minWidth: 'min(100%, 500px)',
                    '& fieldset': {
                        border: '0 !important'
                    }
                }}>
                    <TextField
                        maxRows={3}
                        multiline
                        sx={{background: 'none', minWidth: 'calc(100% - 32px)'}}
                        placeholder="Send a message"
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