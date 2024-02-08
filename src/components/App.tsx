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
                <br></br>
                <Link to="/vision">Google Vision API esimerkki</Link> 
                <br></br>
                <Link to="/hough">Hough-muunnos</Link> 
                <br></br>
                <Link to="/homography">Homografiat</Link> 
            </div>
            <div style={{padding: "2em"}}>
                <Typography variant="h6">Työkalut</Typography>
                <Link to="/upload">Upload</Link>
            </div>
        </Container>
    );
    // const selectionCallback = (thumbnail: string) => console.log(`selected thumbnail: ${thumbnail}`);
    // return (
        // <>
        // <div>
        //     <h1>Demos</h1>
        //     <ul>
        //         <li><a href="{{ url_for('main.config') }}">Config</a></li>
        //         <li><a href="{{ url_for('main.email') }}">Email</a></li>
        //         <li><a href="{{ url_for('main.exception')}}">Exception</a></li>
        //         <li><a href="{{ url_for('main.fernet')}}">Tokens</a></li>
        //         <li><a href="{{ url_for('main.message')}}">Message</a></li>
        //         <li><a href="{{ url_for('main.test')}}">Test</a></li>
        //     </ul>
        // </div>
        // <div>
        //     <h1>Dev</h1>
        //     <ul>
        //         <li><a href="{{ url_for('main.config') }}">Config</a></li>
        //         <li><a href="{{ url_for('main.email') }}">Email</a></li>
        //         <li><a href="{{ url_for('main.exception')}}">Exception</a></li>
        //         <li><a href="{{ url_for('main.fernet')}}">Tokens</a></li>
        //         <li><a href="{{ url_for('main.message')}}">Message</a></li>
        //         <li><a href="{{ url_for('main.test')}}">Test</a></li>
        //     </ul>
        // </div>
        // <div>
        //     <Typography variant="h1">Testing Material UI</Typography>
        //     <br></br>
        //     backendUrl: {backendUrl}
        //     <FileUpload></FileUpload>
        //     <ThumbnailSelector selectionCallback={selectionCallback}></ThumbnailSelector>
        // </div>
        // </>
    // );
}

export { App };