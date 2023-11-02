import {Box, Button, CircularProgress} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import {useEffect, useState} from "react";


export default function InstallButton() {
    let [installed, setInstalled] = useState(true);
    let [loading, setLoading] = useState(false);

    useEffect(() => {

    })

    return (
        <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
            <Button
                variant="contained"
                size="small"
                sx={{ height: '80%' }}
                startIcon={installed ?
                    <CheckIcon sx={{ fontSize: '20px !important' }} /> : loading ?
                    <CircularProgress size={18} color="info"/> : undefined
                }
            >
                { installed ? 'INSTALLED' : loading ? 'INSTALLING' : 'INSTALL' }
            </Button>
        </Box>

    )
}