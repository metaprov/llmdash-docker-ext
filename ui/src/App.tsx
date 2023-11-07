import {Route, Routes} from 'react-router-dom';
import {Box} from '@mui/material';
import Stats from './pages/Stats/Stats';
import Chat from './pages/Chat/Chat';
import Settings from './pages/Settings/Settings'
import NavBar from './components/NavBar/NavBar';
import React, {ReactElement, useEffect, useState} from "react";

export default function App() {
    /* Keep Grafana graphs loaded in memory
    const [graphs, setGraphs] = useState({} as {[name: string]: HTMLIFrameElement})

    function getPanelUrls(title: string): [string, string][] {
        const windows = ["minute", "hour", "day"]
        const timeFrame = ["1m", "1h", "1d"]
        const urls: [string, string][] = []

        windows.forEach((w, i) => {
            urls.push([w, `http://localhost:2999/d-solo/${title}/${title}?orgId=1&refresh=5s&viewPanel=1&from=now-${timeFrame[i]}&to=now&panelId=${i + 1}`])
        })

        return urls
    }

    useEffect(() => {
        const graphNames = ["requests", "hitrate"]

        for (const graph of graphNames) {
            for (const url of getPanelUrls(graph)) {
                const elem = document.createElement('iframe')
                elem.src = url[1]
                elem.style.display = 'none'
                graphs[`${graph}-${url[0]}`] = elem
                document.getElementById('root')!.appendChild(elem)
            }
        }

        setGraphs(graphs)

        return () => {
            for (const elem of Object.values(graphs)) {
                elem.remove()
            }
        }
    })*/

    return (
        <Box sx={{height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
            <NavBar/>
            <Routes>
                <Route path="/" element={<Stats/>}/>
                <Route path="/chat" element={<Chat/>}/>
                <Route path="/settings" element={<Settings/>}/>
                <Route path="*" element={<div>Page not found</div>}/>
            </Routes>
        </Box>
    );
}
