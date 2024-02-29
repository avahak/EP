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
import { DisplayScoresheet } from '../components/result_tables/DisplayScoresheet';
import { SnackbarProvider } from '../utils/SnackbarContext';

const AppRouter = () => {
    return (<>
        <SnackbarProvider>
        <BrowserRouter>
            <Routes>
                {/* Verkkosivuja tai komponentteja */}
                <Route path="/report_fx1" element={<ResultSubmission userTeam="FX1" />} />
                <Route path="/report_aa1" element={<ResultSubmission userTeam="AA1" />} />
                <Route path="/report_mg1" element={<ResultSubmission userTeam="MG1" />} />
                <Route path="/report_kp1" element={<ResultSubmission userTeam="KP1" />} />
                <Route path="/report_tp1" element={<ResultSubmission userTeam="TP1" />} />
                <Route path="/results_teams" element={<DisplayResultsTeams />} />
                <Route path="/results_players" element={<DisplayResultsPlayers />} />
                <Route path="/display_match" element={<DisplayScoresheet />} />

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
        </SnackbarProvider>
    </>);
}

export { AppRouter };