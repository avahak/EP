import { Typography } from "@mui/material";
import FileUpload from "./FileUpload";
import { useEffect, useState } from 'react';
import axios from 'axios';

const port = (window.location.hostname == "localhost") ? ":3001" : "";
const backendUrl = `${window.location.protocol}//${window.location.hostname}${port}`;

const Menu = () => {
    const [thumbnailList, setThumbnailList] = useState<string[]>([]);

    useEffect(() => {
        const fetchThumbnails = async () => {
            try {
                const response = await axios.get(`${backendUrl}/thumbnails`);
                console.log("DATA", response.data);
                setThumbnailList(response.data.thumbnails);
            } catch (error) {
                console.error('Error fetching thumbnails:', error);
            }
        };
        fetchThumbnails();
    }, []);

    return (
        <>
        <div>
            <Typography variant="h1">Testing Material UI</Typography>
            <br></br>
            backendUrl: {backendUrl}
            <FileUpload></FileUpload>
        </div>
        <div>
            <h2>Thumbnail List</h2>
            <ul>
                {thumbnailList.map((thumbnail, index) => (
                <li key={index}>{thumbnail}</li>
                ))}
            </ul>
        </div>
        </>
    );
}

export { Menu };