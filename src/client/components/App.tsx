import { Link } from 'react-router-dom';
import { Typography } from "@mui/material";
import Container from "@mui/material/Container";
// import FileUpload from "./FileUpload";
// import ThumbnailSelector from "./ThumbnailSelector";
// import { Scoresheet } from './Scoresheet';

/**
 * Näkymä reitille '/'. Tämä on käytännössä verkkosivun etusivu.
 */
const App = () => {
    return (
        <Container sx={{backgroundColor: (theme) => theme.palette.common.white}}>
            <div style={{padding: "2em"}}>
                <Typography variant="h3">Sivut</Typography>
                Ilmoita tulos joukkueelle&nbsp;
                <Link to="/report_fx1">FX1</Link>&nbsp;
                <Link to="/report_aa1">AA1</Link>&nbsp;
                <Link to="/report_mg1">MG1</Link>&nbsp;
                <Link to="/report_kp1">KP1</Link>&nbsp;
                <Link to="/report_tp1">TP1</Link> 
                <br />
                <Link to="/results_teams">Tuloksia joukkueille</Link> 
                <br />
                <Link to="/results_players">Tuloksia pelaajille</Link> 
                <br />
            </div>
            <div style={{padding: "2em"}}>
                <Typography variant="h6">Konenäkö</Typography>
                <Link to="/vision">Google Vision API esimerkki</Link> 
                <br />
                <Link to="/hough">Hough-muunnos</Link> 
                <br />
                <Link to="/homography">Homografiat</Link> 
            </div>
            <div style={{padding: "2em"}}>
                <Typography variant="h6">Työkalut</Typography>
                <Link to="/result_table">Taulu</Link> 
                <br />
                <Link to="/mui_test">MUI testi</Link> 
                <br />
                <Link to="/upload">Upload</Link>
                <br />
                <Link to="/db">DB Testaus</Link>
            </div>
        </Container>
    );
}

export { App };