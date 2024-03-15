/**
 * AppRouter määrittelee kaikki React App käytössä olevat reitit.
 * Reitiyksessä express.js serverin määrittelemät reitit käytetään
 * ennen tässä määriteltyjä reittejä.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FileUpload from "../components/FileUpload";
import HoughDemo from '../components/machine_vision/HoughDemo';
import HomographyDemo from '../components/machine_vision/HomographyDemo';
import VisionExample from '../components/machine_vision/VisionExample';
import { DBTest } from '../components/DBTest';
import { ResultSubmission } from '../components/result_submit/ResultSubmission';
import { DisplayResultsTeams } from '../components/result_tables/DisplayResultsTeams';
import { DisplayResultsPlayers } from '../components/result_tables/DisplayResultsPlayers';
import { MUITest } from '../components/sandbox/MUITest';
import { DisplayScoresheet } from '../components/result_tables/DisplayScoresheet';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { LiveMatches } from '../components/live_matches/LiveMatches';
import { LayoutWrapper } from '../components/layout/LayoutWrapper';
import { ReactNode, useContext, useEffect } from 'react';
import { PageNameContext, PageNameProvider } from '../contexts/PageNameContext';
import { SimulateLogin } from '../components/sandbox/SimulateLogin';
import { AuthenticationContext, AuthenticationProvider } from '../contexts/AuthenticationContext';
import { App } from '../components/App';

const Wrap: React.FC<{ children: ReactNode, pageName?: string, restricted?: boolean }> = ({ children, pageName, restricted = false }) => {
    const authenticationState = useContext(AuthenticationContext);
    const pageNameContext = useContext(PageNameContext);

    useEffect(() => {
        pageNameContext.setPageName(pageName ?? "Tuntematon sivu");
    }, [pageName, pageNameContext]);

    if (!authenticationState.isTokenChecked)
        return <p>Lataus kesken..</p>;
    
    if (restricted && !authenticationState.isAuthenticated)
        return (<Navigate to="/simulate_login" />);

    return (
        <LayoutWrapper>
            {children}
        </LayoutWrapper>
    );
};

const AppRouter = () => {
    return (<>
        <AuthenticationProvider>
        <PageNameProvider>
        <SnackbarProvider>
        <BrowserRouter basename='/test/'>
            <Routes>
                {/* Verkkosivuja tai komponentteja */}
                <Route path="/report" element={<Wrap pageName="Tulosten ilmoitus" restricted><ResultSubmission /></Wrap>} />
                <Route path="/results_teams" element={<Wrap pageName="Joukkueiden tuloksia"><DisplayResultsTeams /></Wrap>} />
                <Route path="/results_players" element={<Wrap pageName="Pelaajien tuloksia"><DisplayResultsPlayers /></Wrap>} />
                <Route path="/live_matches" element={<Wrap pageName="Live ottelut"><LiveMatches /></Wrap>} />
                <Route path="/display_match" element={<Wrap pageName="Esimerkki ottelusta"><DisplayScoresheet /></Wrap>} />

                {/* Konenäkö */}
                <Route path="/hough" element={<HoughDemo />} />
                <Route path="/homography" element={<HomographyDemo />} />
                <Route path="/vision" element={<VisionExample />} />

                {/* Kehitystyökaluja */}
                <Route path="/mui_test" element={<MUITest />} />
                <Route path="/upload" element={<FileUpload />} />
                <Route path="/db" element={<DBTest />} />
                <Route path="/simulate_login" element={<Wrap pageName="Simuloitu login"><SimulateLogin /></Wrap>} />

                {/* Juuri */}
                <Route path="/" element={<Wrap pageName="Etusivu"><App /></Wrap>} />
            </Routes>
        </BrowserRouter>
        </SnackbarProvider>
        </PageNameProvider>
        </AuthenticationProvider>
    </>);
}

export { AppRouter };