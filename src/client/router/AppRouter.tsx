/**
 * AppRouter määrittelee kaikki Reactin käytössä olevat reitit.
 * Express.js-palvelimen reitit saavat etusijan tämän komponentin määrittelemiin 
 * reitteihin nähden eli jos palvelimella on määritelty sama reitti kuin tässä,
 * niin käytetään palvelimen reittiä.
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
import { DisplayScoresheet } from '../components/result_submit/DisplayScoresheet';
import { SnackbarProvider } from '../contexts/SnackbarContext';
import { LiveMatches } from '../components/live_matches/LiveMatches';
import { LayoutWrapper } from '../components/layout/LayoutWrapper';
import { ReactNode, useContext, useEffect } from 'react';
import { PageNameContext, PageNameProvider } from '../contexts/PageNameContext';
import { SimulateLogin } from '../components/sandbox/SimulateLogin';
import { AuthenticationContext, AuthenticationProvider } from '../contexts/AuthenticationContext';
import { App } from '../components/App';

/**
 * Wrap lisää nimen ja mahdollisen käyttörajoituksen elementtiin ja
 * lisää muut sivun elementit (menut, mainokset, etc.) käärimällä sen LayoutWrapper sisään.
 */
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

/**
 * AppRouter määrittelee kaikki Reactin käytössä olevat reitit. Lisää myös
 * SnackbarContext, PageNameContext, AuthenticationContext kontekstit sivuille.
 */
const AppRouter = () => {
    return (<>
        <BrowserRouter basename='/node/'>
        <AuthenticationProvider>
        <PageNameProvider>
        <SnackbarProvider>
            <Routes>
                {/* Sivuja tai komponentteja */}
                <Route path="/report" element={<Wrap pageName="Tulosten ilmoitus" restricted><ResultSubmission /></Wrap>} />
                <Route path="/results_teams" element={<Wrap pageName="Joukkueiden tuloksia"><DisplayResultsTeams /></Wrap>} />
                <Route path="/results_teams_debug" element={<Wrap pageName="Joukkueiden tuloksia"><DisplayResultsTeams debug /></Wrap>} />
                <Route path="/results_players" element={<Wrap pageName="Pelaajien tuloksia"><DisplayResultsPlayers /></Wrap>} />
                <Route path="/results_players_debug" element={<Wrap pageName="Pelaajien tuloksia"><DisplayResultsPlayers debug /></Wrap>} />
                <Route path="/live_matches" element={<Wrap pageName="Live ottelut"><LiveMatches /></Wrap>} />
                <Route path="/display_match/:matchId" element={<Wrap pageName="Ottelun tiedot"><DisplayScoresheet /></Wrap>} />

                {/* Konenäkö */}
                <Route path="/hough" element={<HoughDemo />} />
                <Route path="/homography" element={<HomographyDemo />} />
                <Route path="/vision" element={<VisionExample />} />

                {/* Väliaikaisia kehitystyökaluja */}
                <Route path="/upload" element={<FileUpload />} />
                <Route path="/db" element={<DBTest />} />
                <Route path="/simulate_login" element={<Wrap pageName="Simuloitu login"><SimulateLogin /></Wrap>} />

                {/* Juuri */}
                <Route path="/" element={<Wrap pageName="Etusivu"><App /></Wrap>} />
            </Routes>
        </SnackbarProvider>
        </PageNameProvider>
        </AuthenticationProvider>
        </BrowserRouter>
    </>);
}

export { AppRouter };