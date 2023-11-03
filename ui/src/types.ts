
export type Window = "minute" | "hour" | "day"

export interface GetStatsRequest {
    window: Window
}

export interface GetStatsResponse {
    stats: Stats
}

export interface Stats {
    requests: number
    cached: number
    errors: number
    cost: number
    tokens: number
}

export interface InstallResponse {
    installed: boolean
    error: string
}