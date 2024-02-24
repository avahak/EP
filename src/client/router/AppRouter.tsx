/**
 * AppRouter määrittelee kaikki React App käytössä olevat reitit.
 * Reitiyksessä express.js serverin määrittelemät reitit käytetään
 * ennen tässä määriteltyjä reittejä.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FileUpload from "../components/FileUpload";
// import { Scoresheet } from '../components/Scoresheet';
import { App } from '../components/App';
import HoughDemo from '../components/machine_vision/HoughDemo';
import HomographyDemo from '../components/machine_vision/HomographyDemo';
import VisionExample from '../components/machine_vision/VisionExample';
import { DBTest } from '../components/DBTest';
// import { MatchChooser } from '../components/MatchChooser';
import { ResultSubmission } from '../components/result_submit/ResultSubmission';
import { DisplayResultsTeams } from '../components/result_tables/DisplayResultsTeams';
import { DisplayResultsPlayers } from '../components/result_tables/DisplayResultsPlayers';
import { TestResultTable } from '../components/ResultTable';
import { MUITest } from '../components/sandbox/MUITest';

const AppRouter = () => {
    return (<>
        <BrowserRouter>
            <Routes>
                {/* Verkkosivuja tai komponentteja */}
                <Route path="/report" element={<ResultSubmission />} />
                <Route path="/results_teams" element={<DisplayResultsTeams />} />
                <Route path="/results_players" element={<DisplayResultsPlayers />} />

                {/* Konenäkö */}
                <Route path="/hough" element={<HoughDemo />} />
                <Route path="/homography" element={<HomographyDemo />} />
                <Route path="/vision" element={<VisionExample />} />

                {/* Kehitystyökaluja */}
                <Route path="/mui_test" element={<MUITest />} />
                <Route path="/result_table" element={<TestResultTable />} />
                <Route path="/upload" element={<FileUpload />} />
                <Route path="/db" element={<DBTest />} />

                {/* Juuri */}
                <Route path="/" element={<App />} />
            </Routes>
        </BrowserRouter>
    </>);
}

export { AppRouter };