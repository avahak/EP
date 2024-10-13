/**
 * Funktiot ottelupöytäkirjan datan muuntamiseen serverillä käytettävään muotoon
 * ja sen validoimiseen serverillä.
 * HUOM! Tulisi refaktoroida ja yhdistää frontend ottelupöytäkirjan käsittelyn kanssa
 * koska nämä eivät muodosta yhtenäistä kokonaisuutta ja on päällekkäisyyttä.
 */

import { ScoresheetFields } from "./scoresheetTypes";
import { checkGameResults, playerIndexesToGameIndex } from "../client/utils/matchTools";

/**
 * Ottelupöytäkirjan symbolien muttaminen kirjoitetusta muodosta tietokannassa käytettävään.
 */
const symbols = {"1": 1, "A": 2, "9": 3, "K": 4, "C": 5, "V": 6};
/**
 * Ottelupöytäkirjan symbolien tietokannassa käytettävästä muodosta kirjoitettuun muotoon.
 */
const symbolsInverted = {1: "1", 2: "A", 3: "9", 4: "K", 5: "C", 6: "V"};

/**
 * Hyväksyttävät arvot ep_erat taulun erissä
 */
const validRoundResults = ["K1", "K2", "K3", "K4", "K5", "K6", "V0", "V1", "V2", "V3", "V4", "V5", "V6"];

/**
 * Kääntää lomakkeella olevan erän (koti, vieras) tietokannassa käytettäväksi symboliksi.
 */
function translateSymbol(symbolHome: string, symbolAway: string) {
    if (symbolHome in symbols)
        return `K${symbols[symbolHome as keyof typeof symbols]}`;
    if (symbolAway in symbols)
        return `V${symbols[symbolAway as keyof typeof symbols]}`;
    return 'V0';
}

/**
 * Muokkaa ottelun tiedot Scoresheet lomakkeella käytetystä muodosta
 * tietokannassa käytettävään muotoon.
 */
function parseMatch(newStatus: string, match: ScoresheetFields) {
    if (!match || !match.id)
        return { ok: false };
    if (match.teamHome.selectedPlayers.length != 3 || match.teamAway.selectedPlayers.length != 3)
        return { ok: false };
    for (let k = 0; k < 3; k++) 
        if (!match.teamHome.selectedPlayers[k] || !match.teamAway.selectedPlayers[k])
            return { ok: false };
           
    // Data for: INSERT INTO ep_peli (ottelu, kp, vp) VALUES ?
    const games: any[] = [];
    for (let kpIndex = 0; kpIndex < 3; kpIndex++) {
        for (let vpIndex = 0; vpIndex < 3; vpIndex++) {
            games.push([
                match.id, 
                match.teamHome.selectedPlayers[kpIndex]?.id, 
                match.teamAway.selectedPlayers[vpIndex]?.id
            ]);
        }
    }
        
    // Data for: INSERT INTO ep_erat (peli, era1, era2, era3, era4, era5) VALUES ?
    // Taulukkojen games, rounds järjestykset vastaavat toisiansa.
    const rounds: any[] = [];
    for (let kpIndex = 0; kpIndex < 3; kpIndex++) {
        for (let vpIndex = 0; vpIndex < 3; vpIndex++) {
            const roundNumber = playerIndexesToGameIndex(kpIndex, vpIndex);
            const roundResults = [];
            for (let k = 0; k < 5; k++) {
                const s = translateSymbol(match.scores[roundNumber][0][k], match.scores[roundNumber][1][k]);
                if (!s)
                    return { ok: false };
                roundResults.push(s);
            }
            rounds.push(roundResults);
        }
    }

    return { 
        ok: true, 
        status: match.status,
        newStatus,
        id: match.id, 
        date: match.date,
        homeTeamName: match.teamHome.name,
        awayTeamName: match.teamAway.name,
        playersHome: match.teamHome.selectedPlayers.map((player: any) => player.id), 
        playersAway: match.teamAway.selectedPlayers.map((player: any) => player.id), 
        games, 
        rounds,
    };
}

/**
 * Tarkistetaan, että lähetetyt tiedot vastaavat oikein täytettyä lomaketta.
 */
function isValidParsedMatch(match: any) {
    try {
        // Pelaajat tulevat olla erillisiä ja ainoastaan viimeinen pelaaja voi olla tyhjä:
        if (match.playersHome[0] == -1 || match.playersHome[1] == -1 
            || match.playersAway[0] == -1 || match.playersAway[1] == -1
            || match.playersHome[0] == match.playersHome[1] || match.playersHome[0] == match.playersHome[2]
            || match.playersHome[1] == match.playersHome[2] || match.playersAway[0] == match.playersAway[1]
            || match.playersAway[1] == match.playersAway[2] || match.playersAway[0] == match.playersAway[2])
            return false;

        // Tarkistetaan erätuloksien oikeellisuutta muuntamalla ensin takaisin
        // Scoresheet muotoon ja sitten kutsumalla checkGameResults:
        for (let gameIndex = 0; gameIndex < 9; gameIndex++) {
            const playerId1 = match.playersHome[Math.floor(gameIndex / 3)];
            const playerId2 = match.playersAway[gameIndex % 3];

            const gameRounds: string[][] = [[], []];
            for (let round = 0; round < 5; round++) {
                let symbol = match.rounds[gameIndex][round];
                let winTeamIndex = symbol[0] === 'K' ? 0 : 1;
                let winType = parseInt(symbol[1]);
                if (winType >= 1 && winType <= 6) {
                    gameRounds[winTeamIndex].push(symbolsInverted[winType as keyof typeof symbolsInverted]);
                    gameRounds[1-winTeamIndex].push(` `);
                } else {
                    gameRounds[0].push(` `);
                    gameRounds[1].push(` `);
                }
            }
            // console.log("p1, p2", playerId1, playerId2);
            // console.log("match.rounds[gameIndex]", match.rounds[gameIndex]);
            // console.log("gameRounds", gameRounds);

            const errorMessage = checkGameResults(gameRounds, playerId1, playerId2);
            if (errorMessage) {
                // console.log("error", errorMessage);
                return false;
            }
        }
        // console.log(match);
    } catch (error) {
        return false;
    }
    return true;
}


/**
 * Palautetaan erätuloksia vastaava uusi taulukko, joka sisältää vain hyväksyttäviä
 * erätulossymboleita. Lisäksi kunkin rivin alkuun on lisätty -1 pelin id:tä varten.
 */
function enforceValidSymbolsInRounds(rounds: any[][]): any[][] {
    let enforcedRounds = [];
    for (let j = 0; j < 9; j++) {
        // Kohta peli jätetään täyttämättä (arvo -1) koska sen arvo määräytyy dynaamisesti
        // ep_peli tietokantalisäyksen yhteydessä.
        const roundResults = ['V0', 'V0', 'V0', 'V0', 'V0'];
        for (let k = 0; k < 5; k++) {
            if (typeof (rounds[j][k]) === "string" && validRoundResults.includes(rounds[j][k]))
                roundResults[k] = rounds[j][k];
        }
        enforcedRounds.push([-1, ...roundResults]);
    }
    return enforcedRounds;
}

export { parseMatch, isValidParsedMatch, enforceValidSymbolsInRounds };