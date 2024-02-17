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
                <Link to="/report">Ottelun ilmoitus</Link> 
                <br />
                {/* <Link to="/scoresheet">Scoresheet</Link> 
                <br /> */}
            </div>
            <div style={{padding: "2em"}}>
                <Typography variant="h3">Konenäkö</Typography>
                <Link to="/vision">Google Vision API esimerkki</Link> 
                <br />
                <Link to="/hough">Hough-muunnos</Link> 
                <br />
                <Link to="/homography">Homografiat</Link> 
            </div>
            <div style={{padding: "2em"}}>
                <Typography variant="h6">Työkalut</Typography>
                <Link to="/upload">Upload</Link>
                <br />
                <Link to="/db">DB Testaus</Link>
            </div>
        </Container>
    );
}

export { App };