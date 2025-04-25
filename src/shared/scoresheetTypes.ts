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
    name: string;
    nameFull: string;
    role: "home" | "away";
    allPlayers: ScoresheetPlayer[];
    selectedPlayers: (ScoresheetPlayer | null)[];
};

/**
 * Sisältää ottelupöytäkirjan kaikki tiedot.
 */
type ScoresheetFields = {
    id: number;
    status: string;
    laji: string;
    teamHome: ScoresheetTeam;
    teamAway: ScoresheetTeam;
    date: string;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
};

// type ScoresheetMode = 
//     "modify" |                      // muokattava lomake
//     "verify" |                      // vahvistamisen tarvitseva lomake
//     "display" |                     // vain tulosten esitys
//     "display_modifiable" |          // esitys adminille joka voi vielä muokata
//     "modify_no_submit";             // mukattava lomake ilman submit painiketta (vierasjoukkueen live-syöttöön)

// /**
//  * Tila, jossa Scoresheet toimii.
//  */
// const enum ScoresheetMode {
//     /**
//      * Muokattava lomake
//      */
//     Modify,
//     /**
//      * Vahvistamisen tarvitseva lomake
//      */
//     Verify,
//     /**
//      * Vain tulosten esitys
//      */
//     Display,
//     /**
//      * Esitys adminille joka voi vielä muokata
//      */
//     DisplayModifiable,
//     /**
//      * Mukattava lomake ilman submit painiketta (vierasjoukkueen live-syöttöön)
//      */
//     ModifyWithoutSubmit
// };

/**
 * Luo tyhjän joukkueen.
 */
function createEmptyTeam(role: "home"|"away") {
    const emptyTeam: ScoresheetTeam = {
        id: -1,
        name: '',
        nameFull: '',
        role: role,
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
        teamHome: {...createEmptyTeam("home")},
        teamAway: {...createEmptyTeam("away")},
        date: '',
        scores: createEmptyScores(),
    } as ScoresheetFields;
}

export type { ScoresheetPlayer, ScoresheetTeam, ScoresheetFields };
export { createEmptyTeam, createEmptyScores, createEmptyScoresheet };