/**
 * Apufunktioita live-otteluiden yhdistämiseksi.
 */
import { isEmptyPlayer } from "../client/utils/matchTools";
import { deepCopy } from "./generalUtils";
import { ScoresheetFields, ScoresheetPlayer, ScoresheetTeam } from "./scoresheetTypes";

/**
 * Apufunktio, joka yhdistää kaksi pelaajalistaa. Palauttaa listan, missä on kaikki
 * pelaajat molemmista listoista.
 */
function combinePlayerLists(list1: ScoresheetPlayer[], list2: ScoresheetPlayer[]): ScoresheetPlayer[] {
    const idSet = new Set<number>();
    const combined: ScoresheetPlayer[] = [];
    [...list1, ...list2].forEach(player => {
        if (!idSet.has(player.id)) {
            idSet.add(player.id);
            combined.push({ ...player });
        }
    });
    return combined;
}

/**
 * Palauttaa uuden ScoresheetFields, missä kaikkien pelaajien listat on yhdistetty,
 * mutta on muutoin sama kuin newMatch.
 */
function combineLiveMatchPlayers(oldMatch: ScoresheetFields, newMatch: ScoresheetFields): ScoresheetFields {
    const result = deepCopy(newMatch);
    result.teamHome.allPlayers = combinePlayerLists(newMatch.teamHome.allPlayers, oldMatch.teamHome.allPlayers);
    result.teamAway.allPlayers = combinePlayerLists(newMatch.teamAway.allPlayers, oldMatch.teamAway.allPlayers);
    return result;
}

/**
 * Pakottaa oikeat erätulokset peleissä, joissa on puuttuva pelaaja.
 */
function enforceEmptyPlayerConstraints(match: ScoresheetFields): void {
    for (let gameIndex = 0; gameIndex < 9; gameIndex++) {
        const homePlayerEmpty = isEmptyPlayer(match, gameIndex, 0);
        const awayPlayerEmpty = isEmptyPlayer(match, gameIndex, 1);
        if (homePlayerEmpty || awayPlayerEmpty) {
            for (let playerIndex = 0; playerIndex < 2; playerIndex++) {
                for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                    let correctValue = " ";
                    if (homePlayerEmpty && !awayPlayerEmpty && playerIndex === 1 && roundIndex < 3)
                        correctValue = "1";
                    if (awayPlayerEmpty && !homePlayerEmpty && playerIndex === 0 && roundIndex < 3)
                        correctValue = "1";
                    match.scores[gameIndex][playerIndex][roundIndex] = correctValue;
                }
            }
        }
    }
}

/**
 * Apufunktio funktiolle integrateLiveMatchChanges. Yhdistää joukkueeseen kohdistuvat
 * live-ottelun muutokset resultTeam:iin.
 */
function integrateLiveMatchChangesTeam(resultTeam: ScoresheetTeam, oldTeam: ScoresheetTeam, newTeam: ScoresheetTeam): void {
    if (resultTeam.selectedPlayers.length < 3) {
        resultTeam.selectedPlayers = deepCopy(newTeam.selectedPlayers);
    } else {
        for (let k = 0; k < 3; k++) {
            // Jos pelaaja vaihtuu, käytetään newTeam pelaajaa.
            const oldPlayer = oldTeam.selectedPlayers.length > k ? oldTeam.selectedPlayers[k] : null;
            const newPlayer = newTeam.selectedPlayers.length > k ? newTeam.selectedPlayers[k] : null;
            if ((oldPlayer !== null && newPlayer !== null && oldPlayer.id !== newPlayer.id)
                    || (oldPlayer === null && newPlayer !== null) 
                    || (oldPlayer !== null && newPlayer === null))
                resultTeam.selectedPlayers[k] = deepCopy(newPlayer);
        }
    }

    resultTeam.allPlayers = combinePlayerLists(newTeam.allPlayers, resultTeam.allPlayers);
}

/** 
 * **Yhdistää live-ottelun muutokset baseMatch:iin.**
 * 
 * Tarkistetaan mitä muutoksia newMatch:ssa on edelliseen serverin lähettämään, oldMatch,
 * verrattuna. Palauttaa baseMatch kopion, missä on tehty samat muutokset, 
 * mutta on muutoin sama.
 */
function integrateLiveMatchChanges(baseMatch: ScoresheetFields, oldMatch: ScoresheetFields, newMatch: ScoresheetFields): ScoresheetFields {
    // console.log("integrateLiveMatchChanges");
    // console.log("baseMatch", baseMatch.scores[0][0], baseMatch.scores[1][0]);
    // console.log("oldMatch", oldMatch.scores[0][0], oldMatch.scores[1][0]);
    // console.log("newMatch", newMatch.scores[0][0], newMatch.scores[1][0]);

    const result = deepCopy(baseMatch);

    if (newMatch.id !== oldMatch.id)    // ei pitäisi tapahtua koskaan
        result.id = newMatch.id;

    // Jos joku status ei ole "T", käytetään sitä
    if (newMatch.status !== "T" && result.status === "T")
        result.status = newMatch.status;
    if (oldMatch.status !== "T" && result.status === "T")
        result.status = oldMatch.status;

    if (newMatch.date !== oldMatch.date)
        result.date = newMatch.date;

    integrateLiveMatchChangesTeam(result.teamHome, oldMatch.teamHome, newMatch.teamHome);
    integrateLiveMatchChangesTeam(result.teamAway, oldMatch.teamAway, newMatch.teamAway);

    for (let gameIndex = 0; gameIndex < 9; gameIndex++) {
        for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
            const oldValueHome = oldMatch.scores[gameIndex][0][roundIndex];
            const newValueHome = newMatch.scores[gameIndex][0][roundIndex];
            const oldValueAway = oldMatch.scores[gameIndex][1][roundIndex];
            const newValueAway = newMatch.scores[gameIndex][1][roundIndex];
            if (newValueHome !== oldValueHome || newValueAway !== oldValueAway) {
                result.scores[gameIndex][0][roundIndex] = newValueHome;
                result.scores[gameIndex][1][roundIndex] = newValueAway;
            }
        }
    }

    // Jos pelaaja muutettiin tyhjäksi niin tulokset määräytyvät yksikäsitteisesti
    enforceEmptyPlayerConstraints(result);

    // console.log("result", result);

    return result;
}

export { combineLiveMatchPlayers, integrateLiveMatchChanges };