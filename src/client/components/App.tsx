/**
 * Määrittää etusivukomponentin. 
 * HUOM! Poistetaan tuotantoversiossa (etusivu on PHP puolella).
 */

import { Link } from 'react-router-dom';
import { Box, Typography } from "@mui/material";
import Container from "@mui/material/Container";

/**
 * Näkymä reitille '/'. Tämä on käytännössä verkkosivun etusivu.
 */
const App = () => {
    return (
        <Container maxWidth="md">
            <Box sx={{p: 2}}>
                <Typography variant="h3">Sivut</Typography>
                <Link to="/report">Ilmoita tulos (vaatii sisäänkirjautumisen)</Link>
                <br />
                <Link to="/results_teams">Tuloksia joukkueille</Link> 
                <br />
                <Link to="/results_players">Tuloksia pelaajille</Link> 
                <br />
                <Link to="/live_matches">Live otteluseuranta</Link> 
                <br />
                <Link to="/display_match">Näytä yksittäisen ottelun tulos</Link> 
                <br />
                <Link to="/simulate_login">Simuloi login</Link> 
                <br />
                <Link to="/">Etusivu</Link> 
                <br />
            </Box>
            <Box sx={{p: 2}}>
                <Typography variant="h6">Konenäkö</Typography>
                <Link to="/vision">Google Vision API esimerkki</Link> 
                <br />
                <Link to="/hough">Hough-muunnos</Link> 
                <br />
                <Link to="/homography">Homografiat</Link> 
            </Box>
            <Box sx={{p: 2}}>
                <Typography variant="h6">Työkalut</Typography>
                <Link to="/upload">Upload</Link>
                <br />
                <Link to="/db">DB Testaus</Link>
            </Box>
            <Typography variant="body2">Koottu: {BUILD_TIMESTAMP}</Typography>
        </Container>
    );
}

export { App };