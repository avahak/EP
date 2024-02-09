import { Link } from 'react-router-dom';
import { Typography } from "@mui/material";
import Container from "@mui/material/Container";
// import FileUpload from "./FileUpload";
// import ThumbnailSelector from "./ThumbnailSelector";
// import { Scoresheet } from './Scoresheet';

// const port = (window.location.hostname == "localhost") ? ":3001" : "";
// const backendUrl = `${window.location.protocol}//${window.location.hostname}${port}`;

const App = () => {
    return (
        <Container sx={{backgroundColor: (theme) => theme.palette.common.white}}>
            <div style={{padding: "2em"}}>
                <Typography variant="h3">Demot</Typography>
                <Link to="/scoresheet">Scoresheet</Link> 
                <br />
                <Link to="/vision">Google Vision API esimerkki</Link> 
                <br />
                <Link to="/hough">Hough-muunnos</Link> 
                <br />
                <Link to="/homography">Homografiat</Link> 
            </div>
            <div style={{padding: "2em"}}>
                <Typography variant="h6">Työkalut</Typography>
                <Link to="/upload">Upload</Link>
                {/* <br />
                <Link to="/debug">Debug</Link> */}
            </div>
        </Container>
    );
}

export { App };