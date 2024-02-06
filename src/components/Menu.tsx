import { Typography } from "@mui/material";
import FileUpload from "./FileUpload";
import ThumbnailSelector from "./ThumbnailSelector";

const port = (window.location.hostname == "localhost") ? ":3001" : "";
const backendUrl = `${window.location.protocol}//${window.location.hostname}${port}`;

const Menu = () => {
    const selectionCallback = (thumbnail: string) => console.log(`selected thumbnail: ${thumbnail}`);

    return (
        <>
        <div>
            <Typography variant="h1">Testing Material UI</Typography>
            <br></br>
            backendUrl: {backendUrl}
            <FileUpload></FileUpload>
            <ThumbnailSelector selectionCallback={selectionCallback}></ThumbnailSelector>
        </div>
        </>
    );
}

export { Menu };