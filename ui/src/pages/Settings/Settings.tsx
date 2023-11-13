import {Button, CircularProgress, Stack, TextField} from "@mui/material";
import React, {useCallback, useEffect, useRef, useState} from "react";
import CheckIcon from "@mui/icons-material/Check";
import {createDockerDesktopClient} from "@docker/extension-api-client";

interface OpenAIConfig {
    openai_endpoint: string
    openai_key: string
}

interface Config {
    openai: OpenAIConfig
}

interface ConfigData {
    config: Config
}

export default function Settings() {
    const [saving, setSaving] = useState(false)
    const [key, setKey] = useState('')
    const inputRef: React.MutableRefObject<HTMLTextAreaElement | undefined> = useRef()

    const ddClient = createDockerDesktopClient();

    const save = useCallback(async () => {
        //const resp = await ddClient.extension.vm?.service?.post('/config', JSON.stringify({
        //    openai_api_key: key
        //}))
        await ddClient.extension.vm?.service?.post('/settings', JSON.stringify({
            apiKey: key,
            model: ''
        }))
        setSaving(false)
    }, [saving])

    useEffect(() => {
        if (!saving)
            return

        save()
            .catch(console.error)
    }, [saving])

    useEffect(() => {
        ddClient.extension.vm?.service?.get('/config')
            .then((data: unknown) => {
                let config: ConfigData = data as ConfigData
                setKey(config.config.openai.openai_key)
            })
    }, [])


    return (
        <Stack spacing={2}>
            <TextField
                placeholder="OpenAI API Key"
                sx={{ maxWidth: 300 }}
                inputRef={inputRef}
                value={key}
                onChange={e => setKey(e.target.value)}
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