/**
 * Lomake ottelun tulosten kirjaamiseksi. Käyttäjä valitsee ensin ottelun. Tämän
 * jälkeen käyttäjä voi molempien joukkueiden pelaajat listalta.
 * Pelien tulokset valitaan myös select-elementin avulla ja kirjatut tulokset
 * näkyvät tulostaulussa (ScoreTable.tsx) välittömästi.
 * 
 * Suomennokset: ottelu=match, peli=game, erä=round.
 */
import { useForm, SubmitHandler } from "react-hook-form";
import React, { useEffect, useState } from "react";
import { ScoreTable } from "./ScoreTable";
import AddPlayerModal from './AddPlayerModal';
import { getDayOfWeekStrings, toDDMMYYYY } from '../../../shared/generalUtils';
import { Box, Button, Typography } from '@mui/material';
// import { parseMatch } from '../../../shared/parseMatch';
import './Scoresheet.css';

// Erän mahdolliset lopputulokset pelaajalle:
const POSSIBLE_OUTCOMES = ["1", "A", "C", "K", "V", "9", " "];
const PARITY = Array.from({ length: 9 }, (_, k) => (k%2 == 0 ? "even" : "odd"));

type Player = {
    id: number;
    name: string;
};

type Team = {
    id: number;
    teamName: string;
    teamRole: "home" | "away";
    allPlayers: (Player | null)[];
    selectedPlayers: (Player | null)[];
};

type FormFields = {
    id: number;
    oldStatus: string;
    teamHome: Team;
    teamAway: Team;
    date: string;
    scores: string[][][];   // scores[peli][0(koti)/1(vieras)][erä]
};

const emptyTeam: Team = {
    id: -1,
    teamName: '',
    teamRole: "home",
    allPlayers: [],
    selectedPlayers: [null, null, null],
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
 * Palauttaa pelaajan players[index] nimen jos ei tyhjä ja defaultName muutoin.
 */
const playerName = (players: (Player | null)[], index: number, defaultName: string) => {
    const player = players[index];
    if (!!player)
        return player.name;
    return `${defaultName} ${index+1}`;
}

/**
 * React komponentti tuloslomakkeelle.
 * @param mode Tuloslomakkeen esitysmuoto, "modify"=muokattava lomake, "verify"=vahvistamisen tarvitseva lomake, "display"=vain tulosten esitys.
 */
const Scoresheet: React.FC<{ initialValues: any, mode: "modify" | "verify" | "display", submitCallback?: (data: FormFields) => void, rejectCallback?: () => void}> = ({initialValues, mode, submitCallback, rejectCallback}) => {
    // isAddPlayerModalOpen seuraa onko modaali pelaajan lisäämiseksi auki:
    const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
    // currentPlayerSlot on apumuuttuja pitämään kirjaa vimeiseksi muutetusta pelaajasta. 
    // Tätä käytetään selvittämään mikä joukkue ja monesko pelaaja on kyseessä kun 
    // uusi pelaaja lisätään modaalin avulla:
    const [currentPlayerSlot, setCurrentPlayerSlot] = useState<{team: Team, slot: number}>({team: emptyTeam, slot: 0});
    // Lomakkeen kenttien tila:
    const { register, setValue, handleSubmit, watch } = useForm<FormFields>({
        defaultValues: initialValues
    });

    const allFormValues = watch();
    // console.log("initialValues", initialValues);
    // console.log("allFormValues", allFormValues);

    useEffect(() => {
        console.log("Scoresheet useEffect called");
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
    const handleAddPlayer = (player: Player, team: Team, slot: number) => {
        console.log("handleAddPlayer", player.name, team);
        console.log("currentPlayerSlot", currentPlayerSlot);
        const isHome = (team.teamRole == "home");
        // const baseTeam = isHome ? allFormValues.teamHome : allFormValues.teamAway;
        setValue(isHome ? "teamHome.allPlayers" : "teamAway.allPlayers", [...team.allPlayers, player]);
        setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, player);
        console.log("handleAddPlayer isHome", isHome);
        console.log("handleAddPlayer allPlayers", isHome ? allFormValues.teamHome.allPlayers : allFormValues.teamAway.allPlayers);
        console.log("handleAddPlayer selectedPlayers", isHome ? allFormValues.teamHome.selectedPlayers : allFormValues.teamAway.selectedPlayers);
    } 

    // Funktio, joka kutsutaan kun lomake lähetetään:
    const onSubmit: SubmitHandler<FormFields> = (data) => {
        if (submitCallback) 
            submitCallback(data);
    }

    const { runningScore, roundWins } = computeDerivedStats(allFormValues.scores);

    /**
     * Kutsutaan kun käyttäjä valitsee erän tuloksen. Päivittää scores taulukkoa.
     */
    const handleSelectOutcome = (event: React.ChangeEvent<HTMLSelectElement>, gameIndex: number, playerIndex: number, roundIndex: number) => {
        const selectValue = event.target.value;
        const updatedScores = [...allFormValues.scores];
        updatedScores[gameIndex][playerIndex][roundIndex] = selectValue;
        // Jos valitaan voitto, niin vastustajan mahdollinen voitto tulee poistaa:
        if (selectValue !== " ")
            updatedScores[gameIndex][1-playerIndex][roundIndex] = " ";
        setValue('scores', updatedScores);
    };

    /**
     * Kutsutaan kun käyttäjä valitsee pelaajan. Jos pelaaja on "newPlayer", 
     * avataan modaali pelaajan lisäämiseksi.
     */
    const handleSelectPlayer = (event: React.ChangeEvent<HTMLSelectElement>, team: Team, slot: number) => {
        console.log("handleSelectPlayer", event.target.value);
        const isHome = (team == allFormValues.teamHome);
        if (event.target.value == "newPlayer") {
            // Reset the selected value
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, null);
            setCurrentPlayerSlot({team, slot});
            console.log("newPlayer selected", slot);
            handleOpenAddPlayerModal();
        } else {
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, 
                team.allPlayers[team.allPlayers.findIndex((player) => player?.id == parseInt(event.target.value))]);
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
                onAddPlayer={(player) => handleAddPlayer(player, currentPlayerSlot.team, currentPlayerSlot.slot)}
            />
        </>);
    }

    /**
     * Luo joukkueen valintaan liittyvät elementit: joukkueen nimi
     * ja pelaajien valintaan käytettävät select-elementit.
     */
    const teamSelection = (teamRole: "home" | "away") => {
        const team = (teamRole == "home") ? allFormValues.teamHome! : allFormValues.teamAway!;
        // const teamString = (teamRole == "home") ? "teamHome" : "teamAway";
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
            {mode == "modify" ? <>
            {[0, 1, 2].map((playerIndex) => (
                <React.Fragment key={`player-${playerIndex}`}>
                <select disabled={!team.teamName}
                        value={team.selectedPlayers[playerIndex]?.id ?? ''} 
                        // {...register(`${teamString}.selectedPlayers.${playerIndex}.id` as const)}
                        onChange={(event) => {
                            // if React Hook Form implements onChange, run it: 
                            // if (register(`${teamString}.selectedPlayers.${playerIndex}.id`).onChange)
                            //     register(`${teamString}.selectedPlayers.${playerIndex}.id`).onChange(event);
                            handleSelectPlayer(event, team, playerIndex);
                        }}>
                    <option value="" disabled hidden>
                        {`${defaultOptionText} ${playerIndex+1}`}
                    </option>
                    {team.allPlayers.map((playerOption, playerOptionIndex) => (
                        <option 
                            value={playerOption?.id ?? ''}
                            disabled={(playerOption?.id != team.selectedPlayers[playerIndex]?.id) && (team.selectedPlayers.map((player) => player?.id).includes(playerOption?.id))}
                            key={`player-option-${playerOptionIndex}`}>
                            {playerOption?.name ?? ''}
                        </option>
                    ))}
                    <option value="newPlayer">
                        Lisää uusi pelaaja
                    </option>
                </select>
                </React.Fragment>))} </>
                : <>
                {[0, 1, 2].map((playerIndex) => (
                    <label key={`label-${playerIndex}`}>{playerIndex+1}. {team.selectedPlayers[playerIndex]?.name ?? ''}</label>
                ))}
                </> }
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
            {allFormValues.scores.map((_game, gameIndex) => (
            Array.from({ length: 2 }, (_, playerIndex) => (
                <tr key={`row-${gameIndex}-${playerIndex}`}>
                {/* Peli */}
                {playerIndex == 0 &&
                    <td className={`${PARITY[gameIndex]} table-col-1`} rowSpan={2} style={{ fontSize: '1.25em', fontWeight: 'bold' }}>
                        {gameIndex % 3 + 1} - {(gameIndex+Math.floor(gameIndex/3)) % 3 + 1}
                    </td>}

                {/* Pelaaja */}
                <td className={`${PARITY[gameIndex]} table-col-2`} key={`player-${gameIndex}-${playerIndex}`}>
                    {playerIndex == 0 ? 
                        playerName(allFormValues.teamHome.selectedPlayers, gameIndex % 3, "Kotipelaaja")
                        : playerName(allFormValues.teamAway.selectedPlayers, (gameIndex+Math.floor(gameIndex/3)) % 3, "Vieraspelaaja")}
                </td>

                {/* Erätulokset */}
                {mode == "modify" ? Array.from({ length: 5 }, (_, roundIndex) => (
                    <td className={`${PARITY[gameIndex]} table-col-3`} key={`cell-${gameIndex}-${playerIndex}-${roundIndex}`}>
                    <select className={allFormValues.scores[gameIndex][playerIndex][roundIndex] == " " ? "" : "winner"}
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
                )) : Array.from({ length: 5 }, (_, roundIndex) => (
                    <td className={`${PARITY[gameIndex]} table-col-3`} key={`cell2-${gameIndex}-${playerIndex}-${roundIndex}`}>
                    <div style={{width: '25px', textAlign: 'center'}}>{allFormValues.scores[gameIndex][playerIndex][roundIndex]}</div>
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

                </tr>))
            ))}
        </tbody>
        </table>
        </div>);
    };

    return (
        <Box>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Box>
            {createAddPlayerModal()}
            <div id="my_container">
            <div id="scoresheet">
            {/* Ottelu ja päivämäärä */}
            <Box display="flex" justifyContent="center" marginBottom="20px">
                <Box textAlign="center">
                <Typography variant='h4'>
                    {allFormValues.teamHome.teamName} - {allFormValues.teamAway.teamName}
                </Typography>
                <Typography variant='body1'>
                    {!allFormValues.date ? "" : getDayOfWeekStrings(new Date(allFormValues.date)).long}
                        &nbsp;{toDDMMYYYY(new Date(allFormValues.date))}
                </Typography>
                </Box>
            </Box>

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
        </div>
        </div>
        </Box>
        <Box display="flex" justifyContent="flex-end" marginTop="16px">
            {mode == 'modify' &&
            <Button type="submit" variant="contained" color="success">Lähetä</Button>}

            {(mode == "verify") && 
            <Box display="flex" gap="20px">
                <Button type="button" variant="contained" color="error" onClick={rejectCallback}>Muokkaa</Button>
                <Button type="submit" variant="contained" color="success">Hyväksy</Button>
            </Box>}
        </Box>
        {/* {JSON.stringify(allFormValues)} */}
        {/* {`data: ${JSON.stringify(parseMatch("?", allFormValues))}`} */}
        </form>
        </Box>
    );
}

export { Scoresheet };