import {Box, Button, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import {Dialog as MUIDialog} from "@mui/material"
import React from "react";

export interface DialogProps {
    title: string;
    text: string;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    confirmation: boolean;
    onConfirm?: () => any
}

export default function Dialog(props: DialogProps) {
    const { title, text, open, setOpen, confirmation, onConfirm } = props;
    return (
        <MUIDialog
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="confirm-dialog"
        >
            <DialogTitle id="confirm-dialog" sx={{minWidth: '300px'}}>{title}</DialogTitle>
            <DialogContent>{text}</DialogContent>
            {confirmation ?
                <DialogActions>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '60%', gap: '8px' }}>
                        <Button
                            sx={{ height: '35px'}}
                            fullWidth
                            variant="contained"
                            onClick={() => setOpen(false)}
                            color="secondary"
                        >
                            No
                        </Button>
                        <Button
                            sx={{ height: '35px'}}
                            fullWidth
                            variant="contained"
                            onClick={() => {
                                setOpen(false);
                                if (onConfirm)
                                    onConfirm();
                            }}
                        >
                            Yes
                        </Button>
                    </Box>
                </DialogActions> :
                <DialogActions>
                    <Button
                        sx={{ height: '35px', minWidth: '100px'}}
                        variant="contained"
                        onClick={() => setOpen(false)}
                        color="secondary"
                    >
                        OK
                    </Button>
                </DialogActions>
            }
        </MUIDialog>
    );
};