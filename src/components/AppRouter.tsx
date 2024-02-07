/**
 * Handles routes for the React app.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { Typography } from "@mui/material";
import FileUpload from "./FileUpload";
// import ThumbnailSelector from "./ThumbnailSelector";
import { Scoresheet } from './Scoresheet';
import { App } from './App';
import HoughDemo from './HoughDemo';
import HomographyDemo from './HomographyDemo';
import VisionExample from './VisionExample';

// const port = (window.location.hostname == "localhost") ? ":3001" : "";
// const backendUrl = `${window.location.protocol}//${window.location.hostname}${port}`;

const AppRouter = () => {
    return (
        <>
        <Router>
            <Routes>
              <Route path="/scoresheet" element={<Scoresheet />} />
              <Route path="/hough" element={<HoughDemo />} />
              <Route path="/homography" element={<HomographyDemo />} />
              <Route path="/vision" element={<VisionExample />} />
              <Route path="/upload" element={<FileUpload />} />
              <Route path="/" element={<App />} />
            </Routes>
        </Router>
        </>
    );
}

export { AppRouter };