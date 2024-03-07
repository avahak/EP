type ScoresheetPlayer = {
    id: number;
    name: string;
};

type ScoresheetTeam = {
    id: number;
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: (ScoresheetPlayer | null)[];
    selectedPlayers: (ScoresheetPlayer | null)[];
};

type ScoresheetFields = {
    id: number;
    status: string;
    teamHome: ScoresheetTeam;
    teamAway: ScoresheetTeam;
    date: string;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
    isSubmitted: boolean;
};

type ScoresheetMode = "modify" | "verify" | "display";

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

export { createEmptyTeam, createEmptyScores };
export type { ScoresheetPlayer, ScoresheetTeam, ScoresheetFields, ScoresheetMode };