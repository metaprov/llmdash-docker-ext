import {Message as MessageData} from "../../hooks/useChat";
import PersonIcon from '@mui/icons-material/Person';
import {Box, Typography, useTheme} from "@mui/material";
import Markdown from 'react-markdown'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism'
import {ReactComponent as LLMDashSVG} from '../../../assets/llmdash_solo.svg';
import React, {useEffect, useRef} from "react";

interface MessageProps {
    message: MessageData
    observer: ResizeObserver
}

export default function Message(props: MessageProps) {
    const theme = useTheme()
    const elemRef: React.MutableRefObject<HTMLDivElement | undefined> = useRef()
    const isAssistant = props.message.type != 'user'
    const content = props.message.content

    useEffect(() => {
        props.observer.observe(elemRef?.current!)
        return () => {
            if (elemRef.current) {
                props.observer.unobserve(elemRef.current)
            }
        }
    })

    return (
        <Box ref={elemRef} sx={{
            display: 'flex',
            width: '100%',
            border: 1,
            borderRadius: 1,
            backgroundColor: theme.palette.docker.grey[200],
            borderColor: theme.palette.docker.grey[300],
        }}>
            <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                flexShrink: 0,
                m: 1,
                backgroundColor: isAssistant ? '#0B353E' : theme.palette.docker.blue[400],
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                padding: isAssistant ? '4px' : 0
            }}>
                {isAssistant ? <LLMDashSVG/> : <PersonIcon sx={{color: theme.palette.common.white}}/>}
            </Box>
            <Box sx={{
                m: 1,
                mt: 2,
                flexGrow: 1,
                maxWidth: 'calc(100% - 80px)',
                '& p': {
                    mt: 0
                },
                '& pre': {
                    mt: 0,
                    '& div': {
                        pr: 1,
                        borderRadius: 1
                    }
                }
            }}>
                {isAssistant ?
                    <Markdown
                        children={content}
                        components={{
                            code(props) {
                                const {children, className, node, ...rest} = props
                                const match = /language-(\w+)/.exec(className || '')
                                return match ? (
                                    // @ts-ignore
                                    <SyntaxHighlighter
                                        {...rest}
                                        children={String(children).replace(/\n$/, '')}
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                    />
                                ) : (
                                    <code {...rest} className={className}>
                                        {children}
                                    </code>
                                )
                            }
                        }}
                    /> :
                    <Typography sx={{'white-space': 'pre-line'}}>{ content }</Typography>
                }
            </Box>

        </Box>
    )
}