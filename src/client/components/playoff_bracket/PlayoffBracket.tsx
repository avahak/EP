/**
 * Pyytää pudotuspelien ottelut serveriltä ja käyttää RenderPlayoffBracket komponenttia
 * esittämään ne kaaviona.
 */
import { useEffect, useState } from "react";
import { serverFetch } from "../../utils/apiUtils";
import { Box, Link, Typography } from "@mui/material";
import { RenderPlayoffBracket } from "./RenderBracket";
import { createEmptyMatch, getWinnerAndLoser, isEmptyName, matchHasResult, MatchInfo } from "./common";
// import { ArrowLeft, ArrowRight } from "@mui/icons-material";
import { dateFromYYYYMMDD, dateToDayDDMM, deepCopy } from "../../../shared/generalUtils";

/**
 * Rakentaa pudotuspelien datan esitettäväksi kaaviomuotoisena. Ensimmäisen kierroksen
 * joukkue luetaan `bracket`:sta ja loput kierrokset ja tulokset rakennetaan dynaamisesti
 * `matches` avulla.
 */
function computeRounds(bracket: any, matchesOriginal: any): MatchInfo[][] { //, progress_DEBUG: number): MatchInfo[][] {
    // const matches = matchesOriginal.slice(0, progress_DEBUG);   // TODO remove later
    const matches = deepCopy(matchesOriginal);
    // for (let k = progress_DEBUG; k < matches.length; k++) {
    //     // TODO remove later
    //     matches[k].ktulos = 0;
    //     matches[k].vtulos = 0;
    //     matches[k].k_erat = 0;
    //     matches[k].v_erat = 0;
    // }

    const rounds: MatchInfo[][] = [];
    let n0 = bracket.length;

    // Alustetaan rounds tyhjillä alkuarvoilla
    for (let len = n0; len >= 1; len /= 2) {
        const newRound = [];
        for (let k = 0; k < len; k++)
            newRound.push(createEmptyMatch());
        rounds.push(newRound);
    }

    // Lookup taulukko, missä joukkuenimipariin liitetään ottelu matches taulukosta
    const matchesLut = new Map<string, any>();
    for (let match of matches)
        matchesLut.set(`${match.k_nimi},${match.v_nimi}`, match);

    /**
     * Päivittää kierroksen `round` tulokset hakemalla niitä matches taulukosta.
     */
    const updateResults = (round: number) => {
        for (let k = 0; k < rounds[round].length; k++) {
            const teamOne = rounds[round][k].teamOne;
            const teamTwo = rounds[round][k].teamTwo;
            teamOne.gameWins = 0;
            teamTwo.gameWins = 0;
            teamOne.roundWins = 0;
            teamTwo.roundWins = 0;

            let matchesPlayed = 0;
            const matchHome = matchesLut.has(`${teamOne.name},${teamTwo.name}`) ? matchesLut.get(`${teamOne.name},${teamTwo.name}`) : null;
            const matchAway = matchesLut.has(`${teamTwo.name},${teamOne.name}`) ? matchesLut.get(`${teamTwo.name},${teamOne.name}`) : null;
            if (matchHasResult(matchHome)) {
                matchesPlayed++;
                teamOne.gameWins += matchHome.ktulos;
                teamTwo.gameWins += matchHome.vtulos;
                teamOne.roundWins += matchHome.k_erat;
                teamTwo.roundWins += matchHome.v_erat;
            }
            if (matchHasResult(matchAway)) {
                matchesPlayed++;
                teamOne.gameWins += matchAway.vtulos;
                teamTwo.gameWins += matchAway.ktulos;
                teamOne.roundWins += matchAway.v_erat;
                teamTwo.roundWins += matchAway.k_erat;
            }
            rounds[round][k].matchesPlayed = matchesPlayed;
        }
    };

    // Lisätään 1. kierroksen tietoja bracket:sta
    for (let k = 0; k < n0; k++) {
        const home = bracket[k].koti;
        const away = bracket[k].vieras;
        rounds[0][k].teamOne.name = isEmptyName(home) ? '-' : home;
        rounds[0][k].teamTwo.name = isEmptyName(away) ? '-' : away;
    }
    // Päivitetään 1. kierroksen tiedot matches:sta
    updateResults(0);    

    // Käsitellään loput kierrokset
    for (let round = 1; round < rounds.length; round++) {
        // Jos aiemman kierroksen voittaja on selvinnyt, siirretään voittaja eteenpäin
        for (let k = 0; k < rounds[round].length; k++) {
            // if (2*k+1 >= rounds[round-1].length)
            //     continue;
            const prevOne = rounds[round-1][2*k];
            const prevTwo = rounds[round-1][2*k+1];
            const winnerOne = getWinnerAndLoser(prevOne).winner;
            const winnerTwo = getWinnerAndLoser(prevTwo).winner;
            if (winnerOne) 
                rounds[round][k].teamOne.name = winnerOne;
            if (winnerTwo) 
                rounds[round][k].teamTwo.name = winnerTwo;
        }

        // Päivitetään kierroksen tiedot matches:sta
        updateResults(round);
    }

    const lastRound = rounds.length-1;
    rounds[lastRound][0].desc = 'Finaali';

    // Lisätään pronssipeli - semifinaalikierroksen häviäjät vastakkain
    const bronzeMatch = createEmptyMatch();
    bronzeMatch.desc = 'Pronssiottelu';
    rounds[lastRound].push(bronzeMatch);
    const loserOne = getWinnerAndLoser(rounds[lastRound-1][0]).loser;
    const loserTwo = getWinnerAndLoser(rounds[lastRound-1][1]).loser;
    if (loserOne) 
        bronzeMatch.teamOne.name = loserOne;
    if (loserTwo) 
        bronzeMatch.teamTwo.name = loserTwo;
    updateResults(lastRound);

    // Lisätään päivämäärät 
    for (let round = 0; round < rounds.length; round++) {
        for (let k = 0; k < rounds[round].length; k++) {
            const dates = [];
            const teamOne = rounds[round][k].teamOne;
            const teamTwo = rounds[round][k].teamTwo;
            const matchHome = matchesLut.has(`${teamOne.name},${teamTwo.name}`) ? matchesLut.get(`${teamOne.name},${teamTwo.name}`) : null;
            const matchAway = matchesLut.has(`${teamTwo.name},${teamOne.name}`) ? matchesLut.get(`${teamTwo.name},${teamOne.name}`) : null;
            if (matchHome && !matchHasResult(matchHome) && matchHome.paiva)
                dates.push(matchHome.paiva);
            if (matchAway && !matchHasResult(matchAway) && matchAway.paiva)
                dates.push(matchAway.paiva);
            dates.sort();       // Päivämäärät pitäisi olla merkkijonovertailtavassa muodossa
            rounds[round][k].dates = dates.map((date) => dateToDayDDMM(dateFromYYYYMMDD(date))).join(', ');
        }
    }

    console.log('rounds', rounds);

    return rounds;
}

// interface SliderProps_DEBUG {
//     value: number;
//     setValue: React.Dispatch<React.SetStateAction<number>>;
//     maxValue: number;
//     label: string;
//     labelSelected: string;
// };

// const Slider_DEBUG: React.FC<SliderProps_DEBUG> = (props) => {
//     return (
//         <Box sx={{ width: '100%', padding: 0, margin: 0 }}>
//             <Typography id="integer-slider" gutterBottom>
//                 {props.label}
//             </Typography>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <IconButton 
//                     onClick={() => props.setValue((v) => Math.max(0, v-1))}
//                     size="small"
//                     disabled={props.value === 0}
//                 >
//                     <ArrowLeft />
//                 </IconButton>
                
//                 <Slider
//                     value={props.value}
//                     onChange={(_e: Event, newValue: number | number[]) => 
//                         props.setValue(newValue as number)
//                     }
//                     aria-labelledby="integer-slider"
//                     step={1}
//                     marks
//                     min={0}
//                     max={props.maxValue}
//                     valueLabelDisplay="auto"
//                     sx={{ flex: 1 }}
//                 />
                
//                 <IconButton 
//                     onClick={() => props.setValue((v) => Math.min(props.maxValue, v+1))}
//                     size="small"
//                     disabled={props.value === props.maxValue}
//                 >
//                     <ArrowRight />
//                 </IconButton>
//             </Box>
//             <Typography variant="body1" mt={2}>
//                 {props.labelSelected}: <strong>{props.value}</strong>
//             </Typography>
//         </Box>
//     );
// }

/**
 * Komponentti pudotuspelisivulle.
 */
const PlayoffBracket: React.FC<{ lohko: number }> = ({ lohko }) => {
    const [matches, setMatches] = useState<any>(null);
    const [bracket, setBracket] = useState<any>(null);

    // debug muuttuja, kuinka monta riviä matches taulukosta otetaan huomioon
    // const [progress_DEBUG, setProgress_DEBUG] = useState<number>(0);

    /**
     * Hakee pudotuspelien ottelut.
     */
    const fetchMatches = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_playoff_matches", params: { lohko } }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setMatches(jsonData.rows);
            // setProgress_DEBUG(jsonData.rows.length);
            console.log("matches", jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    /**
     * Hakee 1. kierroksen pelien järjestyksen tietokannan ep_cup taulusta.
     */
    const fetchBracket = async () => {
        try {
            const response = await serverFetch("/api/db/specific_query", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ queryName: "get_playoff_bracket", params: { lohko } }),
            }, null);
            if (!response.ok) 
                throw new Error(`HTTP error! Status: ${response.status}`);
            const jsonData = await response.json();
            setBracket(jsonData.rows);
            console.log("bracket", jsonData.rows);
        } catch(error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        // Haetaan ottelut
        fetchMatches();
        // Haetaan joukkueiden järjestys kaaviossa
        fetchBracket();
    }, []);

    if (!matches || !bracket) {
        return (
            <Box>
                <Typography>
                    Ladataan sivua...
                </Typography>
            </Box>
        );
    }

    const rounds = computeRounds(bracket, matches);//, progress_DEBUG);

    return (
        <Box>
            <Typography variant='h3' textAlign="center" sx={{m: 4}}>
                Pudotuspelit 
            </Typography>
            {/* <Slider_DEBUG 
                value={progress_DEBUG}
                setValue={setProgress_DEBUG}
                maxValue={matches.length}
                label="Huomioon otettujen ep_ottelu rivien määrä"
                labelSelected="Rivit"
            /> */}

            <RenderPlayoffBracket rounds={rounds} />

            {<Box sx={{mx: 2, my: 4}}>
                <Typography>
                    <Link href="/Ohjelma39.php">Takaisin Alueliiga-sivulle</Link>
                </Typography>
            </Box>}
        </Box>
    );
};

export { PlayoffBracket };