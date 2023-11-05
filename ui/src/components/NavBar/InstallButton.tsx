import {Box, Button, CircularProgress, IconButton} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import {createDockerDesktopClient} from "@docker/extension-api-client";
import Dialog from "../Dialog/Dialog";
import {InstallResponse} from "../../requests";


export default function InstallButton() {
    let [installed, setInstalled] = useState(false);
    let [installing, setInstalling] = useState(false);
    let [uninstalling, setUninstalling] = useState(false);
    let [confirmOpen, setConfirmOpen] = useState(false);
    let [error, setError] = useState('');
    let [errorOpen, setErrorOpen] = useState(false);

    const ddClient = createDockerDesktopClient();

    const install = useCallback(async () => {
        setError('')
        const url = '/install?install=' + (installing ? 'true' : 'false')
        if (installing)
            setInstalling(true)
        if (uninstalling)
            setUninstalling(true)
        const result = await ddClient.extension.vm?.service?.get(url)
        const response: InstallResponse = JSON.parse(atob(result as string))
        if (response.error)
            setError(response.error)
        setInstalled(response.installed)
        setInstalling(false)
        setUninstalling(false)
    }, [installing, uninstalling])

    const check = useCallback(async () => {
        if (localStorage.getItem('llmdash_installed') === 'true')
            setInstalled(true)

        const result = await ddClient.extension.vm?.service?.get('/install?install=check')
        const response: InstallResponse = JSON.parse(atob(result as string))
        if (response.error)
            setError(response.error)
        setInstalled(response.installed)
        localStorage.setItem('llmdash_installed', String(response.installed))
    }, [])

    useEffect(() => {
        check()
            .catch(console.error)
    })

    useEffect(() => {
        if (!installing && !uninstalling)
            return

        install()
            .catch(console.error)
    }, [installing, uninstalling])

    return (
        <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
            <Dialog
                title="Confirmation"
                text="Are you sure you want to uninstall LLMDash?"
                confirmation={true}
                open={confirmOpen}
                setOpen={setConfirmOpen}
                onConfirm={() => setUninstalling(true)}
            />
            <Dialog
                title="Installation Error"
                text={error}
                confirmation={false}
                open={errorOpen}
                setOpen={setErrorOpen}
            />
            <Button
                disabled={installing || uninstalling}
                onClick={installed ? () => setConfirmOpen(true) : () => setInstalling(true)}
                variant="contained"
                size="small"
                sx={{ height: '80%' }}
                startIcon={
                    (installing || uninstalling) ? <CircularProgress size={18} color="info"/> :
                        installed ? <CheckIcon sx={{ fontSize: '20px !important' }} /> : undefined
                }
            >
                { installed ? 'INSTALLED' :
                    installing ? 'INSTALLING' :
                        uninstalling ? 'UNINSTALLING' :
                            'INSTALL' }
            </Button>
            {Boolean(error) ?
                <IconButton sx={{ padding: 0, ml: 1 }} onClick={() => setErrorOpen(true)}>
                    <ErrorIcon color="error" sx={{ fontSize: '30px !important' }} />
                </IconButton> : undefined
            }
        </Box>

    )
}