import {
    Card,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {useStats} from "../../hooks/useStats";
import React, {createRef, useEffect, useRef, useState} from "react";

interface StatProps {
    title: string
    stat: number
}

function StatBox({title, stat}: StatProps) {
    const theme = useTheme();
    const isSm = useMediaQuery(theme.breakpoints.up('sm'));
    const formattedStat = stat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (
        <Card variant="outlined" sx={{
            height: isSm ? 75 : 50,
            display: 'flex',
            flexDirection: isSm ? 'column' : 'row',
            '& p': {
                color: theme.palette.docker.grey[700]
            }
        }}>
            {isSm ?
                <Typography
                    sx={{pl: 2, pt: 1, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap'}}>{title}</Typography> :
                <Typography sx={{
                    pl: 2,
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>{title}</Typography>
            }
            {isSm ?
                <Typography sx={{pl: 2, flexGrow: 1, fontSize: 30}}>{formattedStat}</Typography> :
                <Typography sx={{
                    pl: 2,
                    flexGrow: 1,
                    fontSize: 24,
                    display: 'flex',
                    alignItems: 'center'
                }}>{formattedStat}</Typography>
            }
        </Card>
    )
}

export default function Stats(/*props: {graphs: {[name: string]: HTMLIFrameElement}}*/) {
    const [window, setWindow] = useState("minute")
    const {stats} = useStats()
    const theme = useTheme();
    const graphRef: React.MutableRefObject<HTMLDivElement | undefined> = useRef()
    const graphLeft: React.RefObject<HTMLDivElement> = createRef()
    const graphRight: React.RefObject<HTMLDivElement> = createRef()


    const isSm = useMediaQuery(theme.breakpoints.up('sm'));

    function getPanelUrl(title: string, window: string) {
        const windowIdx = ["minute", "hour", "day"].findIndex((v) => v == window)
        const timeFrame = ["1m", "1h", "1d"][windowIdx]

        return `http://localhost:2999/d-solo/${title}/${title}?orgId=1&refresh=10s&viewPanel=1&from=now-${timeFrame}&to=now&panelId=${windowIdx + 1}`
    }

    const updateGraphHeight = () => {
        const div = graphRef.current!
        if (!isSm)
            div.style.height = ''
        const height = document.defaultView!.innerHeight - div.getBoundingClientRect().y - 16
        div.style.height = `${height}px`
    }

    useEffect(() => {
        updateGraphHeight()
        document.defaultView!.addEventListener('resize', updateGraphHeight)
        return () => document.defaultView!.removeEventListener('resize', updateGraphHeight)
    })

    /*
    useEffect(() => {
        const left = props.graphs[`requests-${window}`]
        const right = props.graphs[`hitrate-${window}`]
        if (!left || !right)
            return
        left.style.display = ''
        right.style.display = ''
        graphLeft.current!.appendChild(left)
        graphRight.current!.appendChild(right)

        return () => {
            left.style.display = 'none'
            right.style.display = 'none'
            const root = document.getElementById('root')!
            root.appendChild(left)
            root.appendChild(right)
        }
    }, [window, props.graphs])

     */


    // @ts-ignore
    return (
        <div>
            <Grid container spacing={isSm ? 2 : 1} sx={{pb: 3}}>
                <Grid item md sm style={{width: '50%'}}>
                    <StatBox
                        title="Total Requests"
                        stat={stats.requests}
                    />
                </Grid>
                <Grid item md sm style={{width: '50%'}}>
                    <StatBox
                        title="Requests Cached"
                        stat={stats.cached}
                    />
                </Grid>
                <Grid item md sm style={{width: '50%'}}>
                    <StatBox
                        title="Errors"
                        stat={stats.errors}
                    />
                </Grid>
                <Grid item md sm style={{width: '50%'}}>
                    <StatBox
                        title="Tokens"
                        stat={stats.tokens}
                    />
                </Grid>
            </Grid>
            <FormControl sx={{width: 200, pb: 2}} size="small">
                <InputLabel id="window-label">Time Window</InputLabel>
                <Select
                    labelId="window-label"
                    label="Time Window"
                    value={window}
                    onChange={(e) => setWindow(e.target.value)}
                >
                    <MenuItem value="minute">Minute</MenuItem>
                    <MenuItem value="hour">Hour</MenuItem>
                    <MenuItem value="day">Day</MenuItem>
                </Select>
            </FormControl>
            {/*
// @ts-ignore */}
            <Grid container spacing={2} ref={graphRef} sx={{overflowY: 'scroll'}}>
                <Grid item md sm style={{width: '100%'}} ref={graphLeft}>
                    <iframe
                        src={getPanelUrl('requests', window)}
                        width="100%"
                        height={isSm ? "100%" : "300px"}
                        style={{border: 0}}
                    />
                </Grid>
                <Grid item md sm style={{width: '100%'}} ref={graphRight}>
                    <iframe
                        src={getPanelUrl('hitrate', window)}
                        width="100%"
                        height={isSm ? "100%" : "300px"}
                        style={{border: 0}}
                    />
                </Grid>
            </Grid>
        </div>
    )
}