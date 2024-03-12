import { Box, Paper, Typography } from "@mui/material";
import React from "react";

const BannerBox: React.FC<{ text: string}> = ({ text }) => {
    return (
        <Paper sx={{width: "175px", height: "125px", m: 1, background: "lightblue"}} elevation={1}>
            <Box height="100%" display="flex" flexDirection="column" justifyContent="center">
                <Typography variant="h3" textAlign="center">
                    {text}
                </Typography>
            </Box>
        </Paper>
    );
};

export { BannerBox };