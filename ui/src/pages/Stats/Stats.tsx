import {
    Box,
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

interface StatProps {
    title: string
    stat: number
}

function StatBox({ title, stat }: StatProps) {
    const theme = useTheme();
    const isMd = useMediaQuery(theme.breakpoints.up('md'));
    const formattedStat = stat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (
        <Card variant="outlined" sx={{
            height: isMd ? 90 : 50,
            display: 'flex',
            flexDirection: isMd ? 'column' : 'row'
        }}>
            {isMd ?
                <Typography variant="h6" sx={{pl: 2, pt: 1, fontWeight: 600}}>{title}</Typography> :
                <Typography variant="h6" sx={{pl: 2, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{title}</Typography>
            }
            <Typography sx={{ pl: 2, flexGrow: 1, fontSize: 30 }}>
                { formattedStat }
            </Typography>
        </Card>
    )
}

export default function Stats() {
    const {window, setWindow, stats} = useStats()
    const theme = useTheme();

    const isMd = useMediaQuery(theme.breakpoints.up('md'));

    return (
        <div>
            <Grid container spacing={isMd ? 2 : 1} sx={{ pb: 4 }}>
                <Grid item md sm={12} style={{ width: '100%' }}>
                    <StatBox
                        title="Total Requests"
                        stat={stats.requests}
                    />
                </Grid>
                <Grid item md sm={12} style={{ width: '100%' }}>
                    <StatBox
                        title="Cached Requests"
                        stat={stats.cached}
                    />
                </Grid>
                <Grid item md sm={12} style={{ width: '100%' }}>
                    <StatBox
                        title="Errors"
                        stat={stats.errors}
                    />
                </Grid>
                <Grid item md sm={12} style={{ width: '100%' }}>
                    <StatBox
                        title="Cost"
                        stat={stats.cost}
                    />
                </Grid>
                <Grid item md sm={12} style={{ width: '100%' }}>
                    <StatBox
                        title="Tokens"
                        stat={stats.tokens}
                    />
                </Grid>
            </Grid>
            <FormControl sx={{ width: 200 }} size="small">
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
        </div>
    )
}