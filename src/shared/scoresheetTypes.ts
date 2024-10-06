/**
 * Tyyppejä ja triviaaleja apufunktioita Scoresheet liittyen.
 */

/**
 * Pelaajan tiedot Scoresheet muodossa.
 */
type ScoresheetPlayer = {
    id: number;
    name: string;
};

/**
 * Joukkueen tiedot Scoresheet muodossa.
 */
type ScoresheetTeam = {
    id: number;
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: ScoresheetPlayer[];
    selectedPlayers: (ScoresheetPlayer | null)[];
};

/**
 * Sisältää ottelupöytäkirjan kaikki tiedot.
 */
type ScoresheetFields = {
    id: number;
    status: string;
    teamHome: ScoresheetTeam;
    teamAway: ScoresheetTeam;
    date: string;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
    isSubmitted: boolean;
};

type ScoresheetMode = "modify" | "verify" | "display" | "display_modifiable";

/**
 * Luo tyhjän joukkueen.
 */
function createEmptyTeam() {
    const emptyTeam: ScoresheetTeam = {
        id: -1,
        teamName: '',
        teamRole: "home",
        allPlayers: [],
        selectedPlayers: [],
    };
    return emptyTeam;
}

/**
 * Luo tyhjän tulostaulukon.
 */
function createEmptyScores() {
    const emptyScores = Array.from({ length: 9 }, () => Array.from({ length: 2 }, () => Array.from({ length: 5 }, () => ' ')));
    return emptyScores;
}

/**
 * Luo tyhjän ScoresheetFields.
 */
function createEmptyScoresheet() {
    return {
        id: -1,
        status: 'T',
        teamHome: {...createEmptyTeam(), teamRole: "home"},
        teamAway: {...createEmptyTeam(), teamRole: "away"},
        date: '',
        scores: createEmptyScores(),
        isSubmitted: false,
    } as ScoresheetFields;
}

export type { ScoresheetPlayer, ScoresheetTeam, ScoresheetFields, ScoresheetMode };
export { createEmptyTeam, createEmptyScores, createEmptyScoresheet };