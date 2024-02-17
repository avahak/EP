/**
 * AppRouter määrittelee kaikki React App käytössä olevat reitit.
 * Reitiyksessä express.js serverin määrittelemät reitit käytetään
 * ennen tässä määriteltyjä reittejä.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FileUpload from "../components/FileUpload";
import { Scoresheet } from '../components/Scoresheet';
import { App } from '../components/App';
import HoughDemo from '../components/HoughDemo';
import HomographyDemo from '../components/HomographyDemo';
import VisionExample from '../components/VisionExample';
import { DBTest } from '../components/DBTest';
// import { MatchChooser } from '../components/MatchChooser';
import { ResultSubmission } from '../components/ResultSubmission';

const AppRouter = () => {
    return (<>
        <Router>
            <Routes>
                {/* Verkkosivuja tai komponentteja */}
                <Route path="/report" element={<ResultSubmission />} />
                {/* <Route path="/scoresheet" element={<Scoresheet />} /> */}

                {/* Konenäkö */}
                <Route path="/hough" element={<HoughDemo />} />
                <Route path="/homography" element={<HomographyDemo />} />
                <Route path="/vision" element={<VisionExample />} />

                {/* Kehitystyökaluja */}
                <Route path="/upload" element={<FileUpload />} />
                <Route path="/db" element={<DBTest />} />

                {/* Juuri */}
                <Route path="/" element={<App />} />
            </Routes>
        </Router>
    </>);
}

export { AppRouter };