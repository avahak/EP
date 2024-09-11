/**
 * Laatikko, joka sisältää selitykset voittosymboleille.
 * Lisätään Scoresheet kanssa.
 */
import { Paper, Typography } from "@mui/material";

const LegendBox = () => {
    return (<>
        <Paper elevation={10} sx={{p: 1, m: 2}}>
        <Typography variant="subtitle1" textAlign="center" fontWeight="bold">
            Selitykset
        </Typography>
        <Typography>
            <b>1</b> = normaali voitto
            <br />
            <b>9</b> = aloitusysi
            <br />
            <b>A</b> = partti
            <br />
            <b>C</b> = kara
            <br />
            <b>K</b> = kyyti
            <br />
            <b>V</b> = voitto virheillä
        </Typography>
        </Paper>
    </>);
}

export { LegendBox };