import {Message as MessageData} from "../../hooks/useChat";
import PersonIcon from '@mui/icons-material/Person';
import {Box, Typography, useTheme} from "@mui/material";
import { styled } from "@mui/material/styles"
import Markdown from 'react-markdown'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism'
import {ReactComponent as LLMDashSVG} from '../../../assets/llmdash_solo.svg';
import React, {createRef, useEffect, useRef} from "react";

interface MessageProps {
    message: MessageData
    observer: ResizeObserver
}

const Ping = styled('span')({
    background: 'black',
    borderRadius: '50%',
    boxShadow: '0 0 0 0 rgba(0, 0, 0, 1)',
    height: '14px',
    width: '14px',
    transform: 'scale(0.8)',
    position: 'absolute',
    marginLeft: '4px',
    marginTop: '3px',
    animation: 'ping 1s infinite',
    display: 'none',
    '@keyframes ping': {
        '0%': {
            transform: 'scale(0.95)',
            boxShadow: '0 0 0 0 rgba(0, 0, 0, 0.7)'
        },
        '50%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 5px rgba(0, 0, 0, 0)'
        },
        '100%': {
            transform: 'scale(0.95)',
            boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)'
        }
    }
})

export default function Message(props: MessageProps) {
    const theme = useTheme()
    const elemRef: React.MutableRefObject<HTMLDivElement | undefined> = useRef()
    const isAssistant = props.message.type != 'user'
    const content = props.message.content
    const contentRef: React.MutableRefObject<HTMLDivElement | undefined> = useRef()
    const pingRef: React.RefObject<HTMLSpanElement> = createRef()

    useEffect(() => {
        props.observer.observe(elemRef?.current!)
        return () => {
            if (elemRef.current) {
                props.observer.unobserve(elemRef.current)
            }
        }
    })

    // Place a pinging animation at the end of where GPT is typing
    useEffect(() => {
        if (!contentRef.current || props.message.type != 'assistant_pending')
            return

        const children = contentRef.current?.children
        if (!children) {
            return
        }
        // Find the deepest last element
        const findDeepest: (elem: Element) => Element = (elem: Element) => {
            if (elem.children.length == 0)
                return elem
            const last = elem.children.item(elem.children.length - 1)!
            if (last.tagName == 'CODE')
                return elem

            return findDeepest(last)
        }
        let lastElem: HTMLDivElement
        if (children?.length <= 1) {
            lastElem = contentRef.current!
            console.log("using content ref")
        } else {
            lastElem = findDeepest(children.item(children.length - 2)!) as HTMLDivElement
        }
        if (lastElem.tagName == 'PRE') // Skip code blocks
            return
        if (lastElem.children.item(lastElem.children.length - 1)?.tagName == 'PRE')
            return
        lastElem.style.position = 'relative'
        if (!pingRef.current)
            return
        const clone = pingRef.current!.cloneNode(true) as HTMLSpanElement
        clone.style.display = 'inline-block'
        lastElem.appendChild(clone)
        return () => clone.remove()
    })

    // @ts-ignore
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
                {props.message.type == 'assistant_error' &&
                    <div>Your request was unable to be fulfilled. Try again?</div>
                }
                {isAssistant &&
                    <Box ref={contentRef}>
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
                        />
                        <Ping ref={pingRef}/>
                    </Box>
                }
                {!isAssistant &&
                    <Typography sx={{'white-space': 'pre-line'}}>{content}</Typography>
                }
            </Box>

        </Box>
    )
}