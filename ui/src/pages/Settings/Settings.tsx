import {Button, CircularProgress, Stack, TextField} from "@mui/material";
import React, {useCallback, useEffect, useRef, useState} from "react";
import CheckIcon from "@mui/icons-material/Check";
import {createDockerDesktopClient} from "@docker/extension-api-client";

export default function Settings() {
    const [saving, setSaving] = useState(false)
    const inputRef: React.MutableRefObject<HTMLTextAreaElement | undefined> = useRef()

    const ddClient = createDockerDesktopClient();

    const save = useCallback(async () => {
        await ddClient.extension.vm?.service?.post('/settings', JSON.stringify({
            apiKey: inputRef.current!.value!
        }))
        setSaving(false)
    }, [saving])

    useEffect(() => {
        if (!saving)
            return

        save()
            .catch(console.error)
    }, [saving])


    return (
        <Stack spacing={2}>
            <TextField
                sx={{ maxWidth: 300 }}
                inputRef={inputRef}
                label="API Key"
            >
            </TextField>
            <Button
                onClick={() => setSaving(true)}
                sx={{maxWidth: 100}}
            >
                Save
            </Button>
        </Stack>


    )
}