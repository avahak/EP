/**
 * Apufunktioita pudotuspelien esittämiseen.
 */

/**
 * Joukkue ja sen voitot, tämä edustaa yhtä riviä kaavion ottelussa.
 */
type MatchTeamInfo = {
    name: string;
    gameWins: number;
    roundWins: number;
};

/**
 * Yksi kaavion ottelu.
 */
type MatchInfo = {
    desc?: String;
    teamOne: MatchTeamInfo;
    teamTwo: MatchTeamInfo;
    dates: string;
    matchesPlayed?: number;
};

const createEmptyTeam: () => MatchTeamInfo = () => ({ 
    name: '_TBD_', 
    gameWins: 0, 
    roundWins: 0 
});

const createEmptyMatch: () => MatchInfo = () => ({
    desc: '_TBD_', 
    teamOne: createEmptyTeam(), 
    teamTwo: createEmptyTeam(), 
    dates: '_TBD_' 
});

const isEmptyName = (s: string) => !s || s === '-' || s === 'W.O';

/**
 * Palauttaa true joss ottelu (matches taulukosta) on todehko ja sillä on kirjattu tulos.
 */
const matchHasResult = (match: any) => (match && (match.ktulos > 0 || match.vtulos > 0));

/**
 * Palauttaa ottelun voittajan ja häviäjän `MatchInfo` tietojen perusteella. Jos tietoja ei ole
 * riittävästi, jättää kohdan `null` arvoksi.
 */
const getWinnerAndLoser: (match: MatchInfo) => { winner: string|null, loser: string|null } = (match) => {
    const isEmptyOne = isEmptyName(match.teamOne.name);
    const isEmptyTwo = isEmptyName(match.teamTwo.name);
    if (isEmptyOne && isEmptyTwo)
        return { winner: null, loser: null };
    if (isEmptyOne && !isEmptyTwo)
        return { winner: match.teamTwo.name, loser: null };
    if (!isEmptyOne && isEmptyTwo)
        return { winner: match.teamOne.name, loser: null };

    if (match.matchesPlayed !== 2)
        return { winner: null, loser: null };
    const dg = match.teamOne.gameWins - match.teamTwo.gameWins;
    const dr = match.teamOne.roundWins - match.teamTwo.roundWins;
    if (dg > 0 || (dg === 0 && dr > 0))
        return { winner: match.teamOne.name, loser: match.teamTwo.name };
    else if (dg < 0 || (dg === 0 && dr < 0))
        return { winner: match.teamTwo.name, loser: match.teamOne.name };
    // TODO Jos tilanne vieläkin tasan niin tarvitaan lisää tietoa..
    // Yksi mahdollinen tapa ratkaista pattitilanne (dg=0=dr): voittajalle kirjataan 
    // manuaalisesti ylimääräinen voitto toisen ottelun ktulos/vtulos kentässä.
    return { winner: null, loser: null };
};

export type { MatchInfo, MatchTeamInfo };
export { createEmptyTeam, createEmptyMatch, isEmptyName, matchHasResult, getWinnerAndLoser };