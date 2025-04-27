import { Box } from "@mui/material";

/**
 * Sivukartta komponentti (Linkit.gif) navigointiin sivujen välillä.
 */
const SideNavigation: React.FC = () => {
    const url = "http://www.eastpool.fi/"; 
    const src = "/node/Linkit.gif";
    return (
        <Box sx={{minHeight: "700px", minWidth: "217px", overflow: "hidden", background: "#e1faed"}}>
            <Box maxHeight="700px">
            <img alt="Linkkilista" src={src} useMap="#linkkikartta" />
            <map name="linkkikartta">
                <area alt="Etusivu" shape="rect" coords="0,30,190,50" href={`/node/`}/>
                <area alt="Uutiset" shape="rect" coords="0,70,190,88" href={`${url}`+"Uutiset.php"}/>
                <area alt="Kilpailut" shape="rect" coords="0,90,190,109" href={`${url}`+"Kilpailut.php"}/>
                <area alt="Tiedotteet" shape="rect" coords="0,110,190,123" href={`${url}`+"Tiedotteet.php?vuosi=22&tieto=2"}/>
                <area alt="Tulospalvelu" shape="rect" coords="0,147,190,163" href={`${url}`+"Tulospalvelu.php"}/>
                <area alt="Ohjelma" shape="rect" coords="0,164,190,180" href={`${url}`+"Ohjelma37.php"}/>
                <area alt="Mastersporssi" shape="rect" coords="0,181,190,195" href={`/node/results_players`}/>
                <area alt="Arkisto" shape="rect" coords="0,197,190,212" href={`${url}`+"Arkisto.php"}/>
                <area alt="Userfilu" shape="rect" coords="0,214,190,235" href="/node/report"/>
                <area alt="Kilpailukalenteri" shape="rect" coords="0,260,190,275" href={`${url}`+"Kilpailukalenteri.php"}/>
                <area alt="Raflat" shape="rect" coords="0,290,190,326" href={`${url}`+"Raflat.php"}/>
                <area alt="Saannot" shape="rect" coords="0,356,190,371" href={`${url}`+"Saannot.php"}/>
                <area alt="Kilpailukaavio" shape="rect" coords="0,373,190,395" href={`${url}`+"Kilpailukaavio23.php"}/>
                <area alt="Kilpailusaannot" shape="rect" coords="0,397,190,412" href={`${url}`+"Kilpailusaannot.php"}/>
                <area alt="Pelisaannot" shape="rect" coords="0,414,190,430" href={`${url}`+"Pelisaannot.php"}/>
                <area alt="Kapteeninohjeet" shape="rect" coords="0,432,190,452" href={`${url}`+"Kapteeninohjeet.php"}/>
                <area alt="Yhdistyssaannot" shape="rect" coords="0,454,190,471" href={`${url}`+"Yhdistyssaannot.php"}/>
                <area alt="Jaseneksi" shape="rect" coords="0,480,190,510" href={`${url}`+"Jaseneksi.php"}/>
                <area alt="Yhteys" shape="rect" coords="0,529,190,549" href={`${url}`+"Yhteys.php"}/>
                <area alt="Vastuuhenkilot" shape="rect" coords="0,550,190,569" href={`${url}`+"Vastuuhenkilot.php"}/>
                <area alt="Kapteenit" shape="rect" coords="0,570,190,589" href={`${url}`+"Kapteenit.php"}/>
                <area alt="Mediakortti" shape="rect" coords="0,590,190,609" href={`${url}`+"EP_mediakortti_2009_screen.pdf"}/>
                <area alt="Pulinat" shape="rect" coords="0,630,190,650" href={`${url}`+"Pulinat.php"}/>
            </map>
            </Box>
        </Box>
    );
};

export { SideNavigation };