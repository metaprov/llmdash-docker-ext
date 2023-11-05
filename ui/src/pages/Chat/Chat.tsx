import Conversations from "../../components/Chat/Conversations";
import {Box} from "@mui/material";
import Messenger from "../../components/Chat/Messenger";

export default function Chat() {
    return (
        <Box sx={{ display: 'flex', gap: '8px', height: 1 }}>
            <Conversations/>
            <Messenger/>
        </Box>
    )
}