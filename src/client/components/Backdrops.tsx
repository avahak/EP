import { Backdrop, Box, Button, CircularProgress, Typography } from "@mui/material";
import React from "react"

/**
 * Koko ruudun peittävä overlay, joka esittää tekstin ja
 * CircularProgress ikonin.
 */
const ProcessingBackdrop: React.FC<{ title: string, text?: string }> = ({ title, text="" }) => {
    return (
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={true}
        >
            <Box display="flex" flexDirection="column" textAlign="center">
                <Typography variant="h2">{title}</Typography>
                <Typography>{text}</Typography>
                <Box marginTop="20px">
                    <CircularProgress color="inherit" />
                </Box>
            </Box>
        </Backdrop>
    );
};

/**
 * Koko ruudun peittävä overlay, joka esittää tekstin ja
 * CircularProgress ikonin.
 */
const MessageBackdrop: React.FC<{ title: string, text: string, buttonText: string, buttonCallback: () => void }> = ({ title, text, buttonText, buttonCallback }) => {
    return (
        <Backdrop
            sx={{ color: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={true}
        >
            <Box display="flex" flexDirection="column" textAlign="center">
                <Typography variant="h2" sx={{ mb: 1 }}>{title}</Typography>
                <Typography>{text}</Typography>
                <Box sx={{ my: 2 }}>
                    <Button onClick={buttonCallback} size="large" variant="contained" sx={{ maxWidth: 100 }}>
                        {buttonText}
                    </Button>
                </Box>
            </Box>
        </Backdrop>
    );
};

export { ProcessingBackdrop, MessageBackdrop };