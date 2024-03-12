import { Box } from "@mui/material";

const SideNavigation: React.FC = () => {
    return (
        <Box sx={{minHeight: "700px", minWidth: "217px", overflow: "hidden", background: "#e1faed"}}>
            <Box maxHeight="700px">
            <map name="#linkkikartta" id="Linkkikartta">
                <area alt="Etusivu" shape="rect" coords="0,30,190,50" href="./"/>
                <area alt="Uutiset" shape="rect" coords="0,70,190,88" href="Uutiset.php"/>
                <area alt="Kilpailut" shape="rect" coords="0,90,190,109" href="Kilpailut.php"/>
                <area alt="Tiedotteet" shape="rect" coords="0,110,190,123" href="Tiedotteet.php?vuosi=22&tieto=2"/>
                <area alt="Tulospalvelu" shape="rect" coords="0,147,190,163" href="Tulospalvelu.php"/>
                <area alt="Ohjelma" shape="rect" coords="0,164,190,180" href="Ohjelma35.php"/>
                <area alt="Mastersporssi" shape="rect" coords="0,181,190,195" href="Mastersporssi35.php"/>
                <area alt="Arkisto" shape="rect" coords="0,197,190,212" href="Arkisto.php"/>
                <area alt="Userfilu" shape="rect" coords="0,214,190,235" href="Userfilu.php"/>
                <area alt="Kilpailukalenteri" shape="rect" coords="0,260,190,275" href="Kilpailukalenteri.php"/>
                <area alt="Raflat" shape="rect" coords="0,290,190,326" href="Raflat.php"/>
                <area alt="Saannot" shape="rect" coords="0,356,190,371" href="Saannot.php"/>
                <area alt="Kilpailukaavio" shape="rect" coords="0,373,190,395" href="Kilpailukaavio23.php"/>
                <area alt="Kilpailusaannot" shape="rect" coords="0,397,190,412" href="Kilpailusaannot.php"/>
                <area alt="Pelisaannot" shape="rect" coords="0,414,190,430" href="Pelisaannot.php"/>
                <area alt="Kapteeninohjeet" shape="rect" coords="0,432,190,452" href="Kapteeninohjeet.php"/>
                <area alt="Yhdistyssaannot" shape="rect" coords="0,454,190,471" href="Yhdistyssaannot.php"/>
                <area alt="Jaseneksi" shape="rect" coords="0,480,190,510" href="Jaseneksi.php"/>
                <area alt="Yhteys" shape="rect" coords="0,529,190,549" href="Yhteys.php"/>
                <area alt="Vastuuhenkilot" shape="rect" coords="0,550,190,569" href="Vastuuhenkilot.php"/>
                <area alt="Kapteenit" shape="rect" coords="0,570,190,589" href="Kapteenit.php"/>
                <area alt="Mediakortti" shape="rect" coords="0,590,190,609" href="EP_mediakortti_2009_screen.pdf"/>
                <area alt="Pulinat" shape="rect" coords="0,630,190,650" href="Pulinat.php"/>
            </map>
            <img alt="Linkkilista" src="Linkit.gif" useMap="#linkkikartta" />
            </Box>
        </Box>
    );
};

export { SideNavigation };