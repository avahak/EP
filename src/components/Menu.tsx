import { Typography } from "@mui/material";
import FileUpload from "./FileUpload";

const Menu = () => {
    const port = (window.location.hostname == "localhost") ? ":3001" : "";
    const apiUrl = `${window.location.protocol}//${window.location.hostname}${port}/upload`;
    return (
        <div>
            <Typography variant="h1">Testing Material UI</Typography>
            <br></br>
            apiUrl: {apiUrl}
            <FileUpload></FileUpload>
        </div>
    );
}

export { Menu };