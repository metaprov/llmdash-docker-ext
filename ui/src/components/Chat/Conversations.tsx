import {Card, useTheme} from "@mui/material";

interface ConversationProps {

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
            borderColor: theme.palette.docker.grey[300]
        }}>

        </Card>
    )
}