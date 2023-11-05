import {useEffect, useState} from "react";
import {GetStatsResponse, InstallResponse, Stats} from "../requests";
import {createDockerDesktopClient} from "@docker/extension-api-client";

export const useStats = () => {
    const [stats, setStats] = useState({
        requests: 0,
        cached: 0,
        errors: 0,
        cost: 0,
        tokens: 0
    } as Stats)

    const ddClient = createDockerDesktopClient()

    useEffect(() => {
        const fetchInterval = setInterval(() => {
            ddClient.extension.vm?.service?.get("/stats")
                .then((data: any) => {
                    const response: Stats = JSON.parse(atob(data as string))
                    setStats(stats)
                })
        },  1000)

        return () => clearInterval(fetchInterval)
    })

    return { stats }
}