import {useState} from "react";
import {Stats} from "../types";

export const useStats = () => {
    const [window, setWindow] = useState("minute")
    const [stats, setStats] = useState({
        requests: 0,
        cached: 0,
        errors: 0,
        cost: 0,
        tokens: 0
    } as Stats)

    return { window, setWindow, stats }
}