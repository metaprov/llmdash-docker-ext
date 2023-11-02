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
    const isSm = useMediaQuery(theme.breakpoints.up('sm'));
    const formattedStat = stat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (
        <Card variant="outlined" sx={{
            height: isSm ? 75 : 50,
            display: 'flex',
            flexDirection: isSm ? 'column' : 'row'
        }}>
            {isSm ?
                <Typography sx={{pl: 2, pt: 1, fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap'}}>{title}</Typography> :
                <Typography sx={{pl: 2, fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{title}</Typography>
            }
            {isSm ?
                <Typography sx={{ pl: 2, flexGrow: 1, fontSize: 30 }}>{ formattedStat }</Typography> :
                <Typography sx={{ pl: 2, flexGrow: 1, fontSize: 24, display: 'flex', alignItems: 'center' }}>{ formattedStat }</Typography>
            }
        </Card>
    )
}

export default function Stats() {
    const {window, setWindow, stats} = useStats()
    const theme = useTheme();

    const isSm = useMediaQuery(theme.breakpoints.up('sm'));

    return (
        <div>
            <Grid container spacing={isSm ? 2 : 1} sx={{pb: 3}}>
                <Grid item md sm style={{ width: '50%' }}>
                    <StatBox
                        title="Total Requests"
                        stat={stats.requests}
                    />
                </Grid>
                <Grid item md sm style={{ width: '50%' }}>
                    <StatBox
                        title="Requests Cached"
                        stat={stats.cached}
                    />
                </Grid>
                <Grid item md sm style={{ width: '50%' }}>
                    <StatBox
                        title="Errors"
                        stat={stats.errors}
                    />
                </Grid>
                <Grid item md sm style={{ width: '50%' }}>
                    <StatBox
                        title="Tokens"
                        stat={stats.tokens}
                    />
                </Grid>
            </Grid>
            <FormControl sx={{ width: 200, pb: 2 }} size="small">
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