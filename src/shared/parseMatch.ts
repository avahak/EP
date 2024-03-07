const symbols = {"1": 1, "A": 2, "9": 3, "K": 4, "C": 5, "V": 6};
// const symbolsInverted = {1: "1", 2: "A", 3: "9", 4: "K", 5: "C", 6: "V"};

/**
 * Kääntää lomakkeella olevan erän (koti, vieras) tietokannassa käytettäväksi symboliksi.
 */
function translateSymbol(symbolHome: keyof typeof symbols, symbolAway: keyof typeof symbols) {
    if (symbols[symbolHome])
        return `K${symbols[symbolHome]}`;
    if (symbols[symbolAway])
        return `V${symbols[symbolAway]}`;
    return 'V0';
}

/**
 * Muokkaa ottelun tiedot Scoresheet lomakkeella käytetystä muodosta
 * tietokannassa käytettävään muotoon.
 */
function parseMatch(newStatus: string, match: any) {
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
                match.teamHome.selectedPlayers[kpIndex].id, 
                match.teamAway.selectedPlayers[vpIndex].id
            ]);
        }
    }
        
    // Data for: INSERT INTO ep_erat (peli, era1, era2, era3, era4, era5) VALUES ?
    // Taulukkojen games, rounds järjestykset vastaavat toisiansa.
    // Kohta peli jätetään täyttämättä (arvo -1) koska sen arvo määräytyy dynaamisesti
    // ep_peli tietokantalisäyksen yhteydessä.
    const rounds: any[] = [];
    for (let kpIndex = 0; kpIndex < 3; kpIndex++) {
        for (let vpIndex = 0; vpIndex < 3; vpIndex++) {
            const roundNumber = (9 - kpIndex*2 + vpIndex*3) % 9;
            const roundResults = [];
            for (let k = 0; k < 5; k++) {
                const s = translateSymbol(match.scores[roundNumber][0][k], match.scores[roundNumber][1][k]);
                if (!s)
                    return { ok: false };
                roundResults.push(s);
            }
            rounds.push([-1, ...roundResults]);
        }
    }

    return { 
        ok: true, 
        status: match.status,
        newStatus: newStatus,
        id: match.id, 
        date: match.date,
        playersHome: match.teamHome.selectedPlayers.map((player: any) => player.id), 
        playersAway: match.teamAway.selectedPlayers.map((player: any) => player.id), 
        games, 
        rounds,
        isSubmitted: match.isSubmitted
    };
}

export { parseMatch };