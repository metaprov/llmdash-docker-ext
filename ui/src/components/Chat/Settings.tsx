import {Chat, ConversationData} from "../../hooks/useChat";
import {Box, FormControl, InputLabel, MenuItem, Popover, Select, Slider, Stack, Typography} from "@mui/material";
import {useEffect, useState} from "react";

interface SettingsProps {
    chat: Chat
    conversation?: string
    anchor: HTMLElement
    onClose: (conv: ConversationData) => void
}

const Models: { [name: string]: string } = {
    "GPT 3.5 Turbo": "gpt-3.5-turbo",
    "GPT 4": "gpt-4"
}

export default function Settings(props: SettingsProps) {
    const [temperature, setTemperature] = useState(0)
    const [maxTokens, setMaxTokens] = useState(0)
    const [topP, setTopP] = useState(1)
    const [model, setModel] = useState('gpt-3.5-turbo')

    useEffect(() => {
        if (!props.conversation)
            return
        const conversation = props.chat.conversations.get(props.conversation)
        if (!conversation)
            return

        setModel(conversation.model)
        setTemperature(conversation.temperature)
        setMaxTokens(conversation.maxTokens)
        setTopP(conversation.topP)
    }, [])

    const onClose = () => {
        if (!props.conversation)
            return props.onClose({
                id: '',
                topic: 'New Conversation',
                time: Date.now(),
                model: model,
                temperature: temperature,
                maxTokens: maxTokens,
                topP: topP,
            })

        const conversation = props.chat.conversations.get(props.conversation)!
        return props.onClose({
            ...conversation,
            model: model,
            temperature: temperature,
            maxTokens: maxTokens,
            topP: topP,
        })
    }

    return (
        <Popover
            anchorEl={props.anchor}
            open={Boolean(props.anchor)}
            onClose={onClose}
            transformOrigin={{
                vertical: 217,
                horizontal: -4,
            }}
        >

            <Stack sx={{width: 300, height: 200}}>
                <Box sx={{display: 'flex', alignItems: 'center', p: 2}}>
                    <FormControl fullWidth>
                        <InputLabel id="model-select-label">Model</InputLabel>
                        <Select
                            fullWidth
                            value={model}
                            label="Model"
                            labelId="model-select-label"
                            onChange={(v) => setModel(v.target.value)}
                        >
                            {Object.entries(Models).map((v) => (
                                <MenuItem value={v[1]} key={v[1]}>{v[0]}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                </Box>
                <Box sx={{display: 'flex', alignItems: 'center', pl: 3, pr: 4, pb: 1}}>
                    <Typography sx={{width: 150}}>Temperature</Typography>
                    <Slider
                        onChange={(_, v) => setTemperature(v as number)}
                        value={temperature}
                        valueLabelDisplay="auto"
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ml: 2}}
                    />
                </Box>
                <Box sx={{display: 'flex', alignItems: 'center', pl: 3, pr: 4, pb: 1}}>
                    <Typography sx={{width: 150}}>Max Tokens</Typography>
                    <Slider
                        onChange={(_, v) => setMaxTokens(v as number)}
                        value={maxTokens}
                        valueLabelDisplay="auto"
                        min={0}
                        max={1024}
                        step={16}
                        sx={{ml: 2}}
                    />
                </Box>
                <Box sx={{display: 'flex', alignItems: 'center', pl: 3, pr: 4}}>
                    <Typography sx={{width: 150}}>Top P</Typography>
                    <Slider
                        onChange={(_, v) => setTopP(v as number)}
                        value={topP}
                        valueLabelDisplay="auto"
                        min={0}
                        max={1}
                        step={0.01}
                        sx={{ml: 2}}
                    />
                </Box>
            </Stack>
        </Popover>
    )
}