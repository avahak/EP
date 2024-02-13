/**
 * Lomake ottelun tulosten kirjaamiseksi. Käyttäjä valitsee ensin ottelun. Tämän
 * jälkeen käyttäjä voi molempien joukkueiden pelaajat listalta.
 * Pelien tulokset valitaan myös select-elementin avulla ja kirjatut tulokset
 * näkyvät tulostaulussa (ScoreTable.tsx) välittömästi.
 * 
 * TODO: Otteluiden ja pelaajien hakeminen SQL-tietokannasta.
 * TODO: Vierasjoukkue tulee hyväksyä kirjatut tulokset ja tämän jälkeen admin vielä.
 * 
 * Suomennokset: ottelu=match, peli=game, erä=round.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { ScoreTable } from "./ScoreTable";
import './Scoresheet.css';
import AddPlayerModal from './AddPlayerModal';

// Erän mahdolliset lopputulokset pelaajalle:
const POSSIBLE_OUTCOMES = ["1", "A", "C", "K", "V", "9", " "];
const PARITY = Array.from({ length: 9 }, (_, k) => (k%2 == 0 ? "even" : "odd"));

type Team = {
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: string[];
    selectedPlayers: string[];
};

type FormFields = {
    teamHome: Team;
    teamAway: Team;
    date: Date | undefined;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
};

/**
 * Laskee juoksevan tuloksen "runningScore" ja voitettujen erien lukumäärän "roundWins"
 * erien tulosten perusteella.
 */
const computeDerivedStats = (scores: string[][][]): { runningScore: number[][], roundWins: number[][] } => {
    const runningScore = Array.from({ length: 9 }, () => [0, 0]);
    const roundWins = Array.from({ length: 9 }, () => Array.from({ length: 2 }, () => 0));
    for (let gameIndex = 0; gameIndex < 9; gameIndex++) {
        for (let k = 0; k < 2; k++)
            runningScore[gameIndex][k] = gameIndex == 0 ? 0 : runningScore[gameIndex-1][k];
        for (let playerIndex = 0; playerIndex < 2; playerIndex++) {
            let playerRoundWins = 0;
            for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
                if (scores[gameIndex][playerIndex][roundIndex] != " ")
                    playerRoundWins += 1;
            }
            roundWins[gameIndex][playerIndex] = playerRoundWins;
        }
        // Lasketaan juokseva tulos ainoastaan jos pelit tähän asti on 
        // kirjattu täysin valmiiksi.
        const gamesCompleteUpToThis = (runningScore[gameIndex][0] >= 0) && (Math.max(...roundWins[gameIndex]) >= 3);
        if (gamesCompleteUpToThis) {
            if (roundWins[gameIndex][0] > roundWins[gameIndex][1])
                runningScore[gameIndex][0] += 1;
            else if (roundWins[gameIndex][1] > roundWins[gameIndex][0])
                runningScore[gameIndex][1] += 1;
        } else {
            runningScore[gameIndex] = [-1, -1];
        }
    }
    return { runningScore, roundWins };
}

/**
 * Palauttaa pelaajan nimen playerNames[index] jos ei tyhjä ja defaultName muutoin.
 */
const playerName = (playerNames: string[], index: number, defaultName: string) => {
    const name = playerNames[index];
    if (!!name)
        return name;
    return `${defaultName} ${index+1}`;
}

/**
 * Palauttaa tämän päivän päivämäärän muodossa YYYY-MM-DD.
 */
// const getTodayDateString = () => {
//     const today = new Date();
//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, '0');
//     const day = String(today.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// };

/**
 * React komponentti tuloslomakkeelle.
 */
const Scoresheet: React.FC = () => {
    // isAddPlayerModalOpen seuraa onko modaali pelaajan lisäämiseksi auki:
    const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
    const emptyTeam: Team = {
        teamName: '',
        teamRole: "home",
        allPlayers: [''],
        selectedPlayers: ['', '', ''],
    };
    // currentPlayerSlot on apumuuttuja pitämään kirjaa vimeiseksi muutetusta pelaajasta. 
    // Tätä käytetään selvittämään mikä joukkue ja monesko pelaaja on kyseessä kun 
    // uusi pelaaja lisätään modaalin avulla:
    const [currentPlayerSlot, setCurrentPlayerSlot] = useState<{team: Team, slot: number}>({team: emptyTeam, slot: 0});
    const scoresDefaultValue = Array.from({ length: 9 }, () => Array.from({ length: 2 }, () => Array.from({ length: 5 }, () => ' ')));
    // Lomakkeen kenttien tila:
    const { register, setValue, handleSubmit, watch } = useForm<FormFields>({
        defaultValues: {
            teamHome: {...emptyTeam, teamRole: "home"},
            teamAway: {...emptyTeam, teamRole: "away"},
            date: undefined,
            scores: [...scoresDefaultValue],
        },
    });

    const scores = watch('scores');
    const allFormValues = watch();

    const navigate = useNavigate();

    useEffect(() => {
        console.log("useEffect called");
    }, []);

    // avaa AddPlayerModal
    const handleOpenAddPlayerModal = () => {
        setIsAddPlayerModalOpen(true);
    }

    // sulkee AddPlayerModal
    const handleCloseAddPlayerModal = () => {
        setIsAddPlayerModalOpen(false);
    }

    // Takaisinkutsufunktio AddPlayerModal varten:
    const handleAddPlayer = (playerName: string, team: Team, slot: number) => {
        console.log("handleAddPlayer", playerName, team);
        const isHome = (team == allFormValues.teamHome);
        // const baseTeam = isHome ? allFormValues.teamHome : allFormValues.teamAway;
        setValue(isHome ? "teamHome.allPlayers" : "teamAway.allPlayers", [...team.allPlayers, playerName]);
        setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, playerName);
        console.log("handleAddPlayer isHome", isHome);
        console.log("handleAddPlayer allPlayers", isHome ? allFormValues.teamHome.allPlayers : allFormValues.teamAway.allPlayers);
        console.log("handleAddPlayer selectedPlayers", isHome ? allFormValues.teamHome.selectedPlayers : allFormValues.teamAway.selectedPlayers);
    } 

    // Funktio, joka kutsutaan kun lomake lähetetään:
    const onSubmit: SubmitHandler<FormFields> = (_data) => {
        navigate("/");
    }

    const { runningScore, roundWins } = computeDerivedStats(scores);

    /**
     * Kutsutaan kun käyttäjä valitsee erän tuloksen. Päivittää scores taulukkoa.
     */
    const handleSelectOutcome = (event: React.ChangeEvent<HTMLSelectElement>, gameIndex: number, playerIndex: number, roundIndex: number) => {
        const selectValue = event.target.value;
        const updatedScores = [...scores];
        updatedScores[gameIndex][playerIndex][roundIndex] = selectValue;
        // Jos valitaan voitto, niin vastustajan mahdollinen voitto tulee poistaa:
        if (selectValue !== " ")
            updatedScores[gameIndex][1-playerIndex][roundIndex] = " ";
        setValue('scores', updatedScores);
    };

    /**
     * Kutsutaan kun käyttäjä valitsee joukkueen.
     */
    const handleSelectMatch = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectValue = event.target.value;
        const parts = selectValue.split("-", 2);
        // parts tulee olla taulukko, jossa on 2 alkiota:
        if (parts.length != 2)
            return;
        // Käytetään kovakoodattuja väliaikaisia arvoja kunnes SQL-kyselyt toiminnassa:
        if (parts[0] == "TH3") {
            setValue("teamHome", {
                teamName: parts[0],
                teamRole: "home",
                allPlayers: ["Matti", "Ville", "Joonas", "Jesse", "Aleksi"],
                selectedPlayers: ['', '', '']
            });
            setValue("teamAway", {
                teamName: parts[1],
                teamRole: "away",
                allPlayers: ["Kaisa", "Emmi", "Anne", "Päivi", "Leena"],
                selectedPlayers: ['', '', '']
            });
        } else {
            setValue("teamHome", {
                teamName: parts[0],
                teamRole: "home",
                allPlayers: ["Pekka", "Rauno", "Pöde", "Tuomas", "Pete S."],
                selectedPlayers: ['', '', '']
            });
            setValue("teamAway", {
                teamName: parts[1],
                teamRole: "away",
                allPlayers: ["Erika", "Kati", "Sanna T", "Tytti", "Ulla"],
                selectedPlayers: ['', '', '']
            });
        }
        console.log("handleSelectMatch", allFormValues);
    };

    /**
     * Kutsutaan kun käyttäjä valitsee pelaajan. Jos pelaaja on "newPlayer", 
     * avataan modaali pelaajan lisäämiseksi.
     */
    const handleSelectPlayer = (event: React.ChangeEvent<HTMLSelectElement>, team: Team, slot: number) => {
        console.log(event);
        if (event.target.value == "newPlayer") {
            const isHome = (team == allFormValues.teamHome);
            // Reset the selected value
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, '');
            setCurrentPlayerSlot({team, slot});
            console.log("newPlayer selected", slot);
            handleOpenAddPlayerModal();
        }
    };

    /**
     * Luo modaalin pelaajan lisäämiseksi.
     */
    const createAddPlayerModal = () => {
        return (<>
            {/* Render the AddPlayerModal */}
            <AddPlayerModal
                isOpen={isAddPlayerModalOpen}
                team={currentPlayerSlot.team}
                onClose={handleCloseAddPlayerModal}
                onAddPlayer={(playerName) => handleAddPlayer(playerName, currentPlayerSlot.team, currentPlayerSlot.slot)}
            />
        </>);
    }

    /**
     * Luo joukkueen valintaan liittyvät elementit: joukkueen nimi
     * ja pelaajien valintaan käytettävät select-elementit.
     */
    const teamSelection = (teamRole: "home" | "away") => {
        const team = (teamRole == "home") ? allFormValues.teamHome! : allFormValues.teamAway!;
        const teamString = (teamRole == "home") ? "teamHome" : "teamAway";
        const teamText = (teamRole == "home") ? "Kotijoukkue" : "Vierasjoukkue";
        const defaultOptionText = (teamRole == "home") ? "Valitse kotipelaaja" : "Valitse vieraspelaaja";
        console.log("team", team);
        return (<>
        <div className="team-select-container">
            {/* Joukkuen nimi */}
            <label className="team-label">{teamText}&nbsp;
            {!!team.teamName ? team.teamName : "-"}
            </label>

            {/* Joukkueen pelaajat */}
            {[0, 1, 2].map((playerIndex) => (
                <React.Fragment key={`player-${playerIndex}`}>
                <select disabled={!team.teamName}
                        value={team.selectedPlayers[playerIndex]} 
                        {...register(`${teamString}.selectedPlayers.${playerIndex}` as const)}
                        onChange={(event) => {
                            // if React Hook Form implements onChange, run it: 
                            if (register(`${teamString}.selectedPlayers.${playerIndex}`).onChange)
                                register(`${teamString}.selectedPlayers.${playerIndex}`).onChange(event);
                            handleSelectPlayer(event, team, playerIndex);
                        }}>
                    <option value="" disabled hidden>
                        {`${defaultOptionText} ${playerIndex+1}`}
                    </option>
                    {team.allPlayers.map((playerOption, playerOptionIndex) => (
                        <option 
                            disabled={team.selectedPlayers.includes(playerOption)}
                            key={`player-option-${playerOptionIndex}`}>
                            {playerOption}
                        </option>
                    ))}
                    <option value="newPlayer">
                        Lisää uusi pelaaja
                    </option>
                </select>
                </React.Fragment>))}
        </div>
        </>)
    };

    /**
     * Luo taulukon (html table) erien tulosten kirjaamiseksi.
     */
    const makeTable = () => {
        return (
        <div id="table-box">
        <table className="game-table">
        <thead>
            <tr>
            <th>Peli</th>
            <th className="table-head-2">Pelaajan nimi</th>
            <th>1.</th>
            <th>2.</th>
            <th>3.</th>
            <th>4.</th>
            <th>5.</th>
            <th>Voitot</th>
            <th>Tilanne<br />K - V</th>
            </tr>
        </thead>
        <tbody>
            {scores.map((_game, gameIndex) => (
            Array.from({ length: 2 }, (_, playerIndex) => (
                <tr key={`row-${gameIndex}-${playerIndex}`}>
                {/* Peli */}
                {playerIndex == 0 &&
                    <td className={`${PARITY[gameIndex]} table-col-1`} rowSpan={2} style={{ fontSize: '1.25em', fontWeight: 'bold' }}>
                        {gameIndex % 3 + 1} - {(gameIndex+Math.floor(gameIndex/3)) % 3 + 1}
                    </td>
                }

                {/* Pelaaja */}
                <td className={`${PARITY[gameIndex]} table-col-2`} key={`player-${gameIndex}-${playerIndex}`}>
                    {playerIndex == 0 ? 
                        playerName(allFormValues.teamHome.selectedPlayers, gameIndex % 3, "Kotipelaaja")
                        : playerName(allFormValues.teamAway.selectedPlayers, (gameIndex+Math.floor(gameIndex/3)) % 3, "Vieraspelaaja")}
                </td>

                {/* Erätulokset */}
                {Array.from({ length: 5 }, (_, roundIndex) => (
                    <td className={`${PARITY[gameIndex]} table-col-3`} key={`cell-${gameIndex}-${playerIndex}-${roundIndex}`}>
                    <select className={scores[gameIndex][playerIndex][roundIndex] == " " ? "" : "winner"}
                        {...register(
                        `scores.${gameIndex}.${playerIndex}.${roundIndex}` as const
                        )}
                        onChange={(event) => handleSelectOutcome(event, gameIndex, playerIndex, roundIndex)}
                    >
                        {POSSIBLE_OUTCOMES.map((outcome, outcomeIndex) => (
                        <option key={outcomeIndex} value={outcome}>
                            {outcome}
                        </option>
                        ))}
                    </select>
                    </td>
                ))}

                {/* Voitot */}
                <td className={`${roundWins[gameIndex][playerIndex] >= 3 ? "winner" : ""} ${PARITY[gameIndex]} table-col-4`} key={`voitot-${gameIndex}-${playerIndex}`}>
                    {roundWins[gameIndex][playerIndex]}
                </td>

                {/* Tilanne */}
                {playerIndex == 0 ? 
                <td rowSpan={2} className={`${PARITY[gameIndex]} table-col-5`} key={`running-score-${gameIndex}-${playerIndex}`}>
                    {runningScore[gameIndex][0] >= 0 ? 
                    `${runningScore[gameIndex][0]} - ${runningScore[gameIndex][1]}`
                    : " - "}
                </td>
                : <></>}

                </tr>
            ))
            ))}
        </tbody>
        </table>
        </div>);
    };

    return (
        <>
        <Link to="/">Back</Link>
        {createAddPlayerModal()}
        <div id="container">
        <div id="scoresheet">
        <form onSubmit={handleSubmit(onSubmit)}>
            {/* Ottelun valinta (TODO) */}
            <label>
            Ottelu (TODO):
            <select onChange={handleSelectMatch} defaultValue="">
                <option value="" disabled hidden>
                    Valitse ottelu
                </option>
                {["TH3-RT4", "OT2-JI3"].map((match, matchIndex) => (
                    <option key={matchIndex} value={match}>
                    {match}
                </option>
                ))}
            </select>
            </label>

            <br />

            {/* Päivämäärä */}
            <label>
            Ottelun päivämäärä:
            <input type="date" {...register('date')} />
            </label>

            <br />

            <div id="table-box-outer">
                <div id="table-box-outer-top">
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        {/* Kotijoukkueen nimi ja pelaajat */}
                        {teamSelection("home")}

                        {/* Vierasjoukkueen nimi ja pelaajat */}
                        {teamSelection("away")}
                    </div>

                    {/* Tuloslaatikko */}
                    <div className="score-table">
                        <ScoreTable roundWins={roundWins} playersHome={allFormValues.teamHome.selectedPlayers} playersAway={allFormValues.teamAway.selectedPlayers}></ScoreTable>
                    </div>
                </div>

                {/* Taulukko tulosten kirjaamiseksi */}
                {makeTable()}
            </div>

            <button type="submit">Lähetä</button>
        </form>
        </div>
        </div>
        </>
    );
}

export { Scoresheet };