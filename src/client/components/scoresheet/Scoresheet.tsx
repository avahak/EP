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
import { GameResultsTable } from "./GameResultsTable";
import AddPlayerDialog from './AddPlayerDialog';
import { getDayOfWeekStrings, toDDMMYYYY } from '../../../shared/generalUtils';
import { Box, Button, Grid, SelectChangeEvent, Typography } from '@mui/material';
// import { parseMatch } from '../../../shared/parseMatch';
import { TeamSelection } from "./TeamSelection";
import { RoundResultsTable } from "./RoundResultsTable";

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

type ScoresheetMode = "modify" | "verify" | "display";

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
 * React komponentti tuloslomakkeelle.
 * @param mode Tuloslomakkeen esitysmuoto, "modify"=muokattava lomake, "verify"=vahvistamisen tarvitseva lomake, "display"=vain tulosten esitys.
 */
const Scoresheet: React.FC<{ initialValues: any, mode: ScoresheetMode, submitCallback?: (data: FormFields) => void, rejectCallback?: () => void}> = ({initialValues, mode, submitCallback, rejectCallback}) => {
    // isAddPlayerDialogOpen seuraa onko modaali pelaajan lisäämiseksi auki:
    const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
    // currentPlayerSlot on apumuuttuja pitämään kirjaa vimeiseksi muutetusta pelaajasta. 
    // Tätä käytetään selvittämään mikä joukkue ja monesko pelaaja on kyseessä kun 
    // uusi pelaaja lisätään modaalin avulla:
    const [currentPlayerSlot, setCurrentPlayerSlot] = useState<{team: Team, slot: number}>({team: emptyTeam, slot: 0});
    // Lomakkeen kenttien tila:
    const { setValue, handleSubmit, watch } = useForm<FormFields>({
        defaultValues: initialValues
    });

    const formFields = watch();
    // console.log("initialValues", initialValues);
    // console.log("formFields", formFields);

    useEffect(() => {
        console.log("Scoresheet useEffect called");
    }, []);

    // avaa AddPlayerDialog
    const handleOpenAddPlayerDialog = () => {
        setIsAddPlayerDialogOpen(true);
    }

    // sulkee AddPlayerDialog
    const handleCloseAddPlayerDialog = () => {
        setIsAddPlayerDialogOpen(false);
    }

    // Takaisinkutsufunktio AddPlayerDialog varten:
    const handleAddPlayer = (player: Player, team: Team, slot: number) => {
        console.log("handleAddPlayer", player.name, team);
        console.log("currentPlayerSlot", currentPlayerSlot);
        const isHome = (team.teamRole == "home");
        // const baseTeam = isHome ? formFields.teamHome : formFields.teamAway;
        setValue(isHome ? "teamHome.allPlayers" : "teamAway.allPlayers", [...team.allPlayers, player]);
        setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, player);
        console.log("handleAddPlayer isHome", isHome);
        console.log("handleAddPlayer allPlayers", isHome ? formFields.teamHome.allPlayers : formFields.teamAway.allPlayers);
        console.log("handleAddPlayer selectedPlayers", isHome ? formFields.teamHome.selectedPlayers : formFields.teamAway.selectedPlayers);
    } 

    // Funktio, joka kutsutaan kun lomake lähetetään:
    const onSubmit: SubmitHandler<FormFields> = (data) => {
        if (submitCallback) 
            submitCallback(data);
    }

    const { runningScore, roundWins } = computeDerivedStats(formFields.scores);

    /**
     * Kutsutaan kun käyttäjä valitsee erän tuloksen. Päivittää scores taulukkoa.
     */
    // const handleSelectOutcome = (event: React.ChangeEvent<HTMLSelectElement>, gameIndex: number, playerIndex: number, roundIndex: number) => {
    //     const selectValue = event.target.value;
    //     const updatedScores = [...formFields.scores];
    //     updatedScores[gameIndex][playerIndex][roundIndex] = selectValue;
    //     // Jos valitaan voitto, niin vastustajan mahdollinen voitto tulee poistaa:
    //     if (selectValue !== " ")
    //         updatedScores[gameIndex][1-playerIndex][roundIndex] = " ";
    //     setValue('scores', updatedScores);
    // };

    /**
     * Kutsutaan kun käyttäjä valitsee erän tuloksen. Päivittää scores taulukkoa.
     */
    const handleGameDialogSubmit = (gameIndex: number, results: string[][]) => {
        const updatedScores = [...formFields.scores];
        updatedScores[gameIndex] = [...results];
        setValue('scores', updatedScores);
    };

    /**
     * Kutsutaan kun käyttäjä valitsee pelaajan. Jos pelaaja on "newPlayer", 
     * avataan modaali pelaajan lisäämiseksi.
     */
    const handleSelectPlayer = (event: SelectChangeEvent<any>, team: Team, slot: number) => {
        const value = event.target.value;
        event.target.value = "";
        console.log("handleSelectPlayer", value);
        const isHome = (team.teamRole == "home");
        if (value == "newPlayer") {
            // Tyhjennetään pelaajan valinta:
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, null);
            setCurrentPlayerSlot({team, slot});
            console.log("newPlayer selected, slot: ", slot);
            handleOpenAddPlayerDialog();
        } else {
            setValue(isHome ? `teamHome.selectedPlayers.${slot}` : `teamAway.selectedPlayers.${slot}`, 
                team.allPlayers[team.allPlayers.findIndex((player) => player?.id == parseInt(value))]);
        }
    };

    return (
        <Box>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Box>
            {/* Lisätään dialog pelaajan lisäämiseksi  */}
            <AddPlayerDialog
                isOpen={isAddPlayerDialogOpen}
                team={currentPlayerSlot.team}
                onClose={handleCloseAddPlayerDialog}
                onAddPlayer={(player) => handleAddPlayer(player, currentPlayerSlot.team, currentPlayerSlot.slot)}
            />
            
            {/* Ottelu ja päivämäärä */}
            <Box display="flex" justifyContent="center" marginBottom="20px">
                <Box textAlign="center">
                <Typography variant='h4'>
                    {formFields.teamHome.teamName} - {formFields.teamAway.teamName}
                </Typography>
                <Typography variant='body1'>
                    {!formFields.date ? "" : getDayOfWeekStrings(new Date(formFields.date)).long}
                        &nbsp;{toDDMMYYYY(new Date(formFields.date))}
                </Typography>
                </Box>
            </Box>


            <Box>
                <Grid container spacing={5}>
                    {/* Kotijoukkueen nimi ja pelaajat */}
                    <Grid item xs={12} sm={6}>
                        {<TeamSelection mode={mode} team={formFields.teamHome} handleSelectPlayer={handleSelectPlayer} />}
                    </Grid>
                    {/* Vierasjoukkueen nimi ja pelaajat */}
                    <Grid item xs={12} sm={6}>
                        {<TeamSelection mode={mode} team={formFields.teamAway} handleSelectPlayer={handleSelectPlayer} />}
                    </Grid>
                </Grid>
            </Box>

            {/* Tuloslaatikko */}
            {mode != "modify" &&
                <GameResultsTable roundWins={roundWins} teamHome={formFields.teamHome} teamAway={formFields.teamAway}></GameResultsTable>
            }

            <RoundResultsTable mode={mode} formFields={formFields} onGameDialogSubmit={handleGameDialogSubmit} runningScore={runningScore} roundWins={roundWins}></RoundResultsTable>
        </Box>
        {mode == "modify" &&
            <GameResultsTable roundWins={roundWins} teamHome={formFields.teamHome} teamAway={formFields.teamAway}></GameResultsTable>
        }
        {/* Tuloslaatikko */}
        <Box display="flex" justifyContent="space-between" marginTop="16px">
            <Box>
            </Box>
            <Box display="flex" flexDirection="column" sx={{p: 1}}>
                <Box flexGrow={1}>
                </Box>
                <Box>
                {mode == 'modify' &&
                <Button type="submit" variant="contained" color="success">Lähetä</Button>}

                {(mode == "verify") && 
                <Box display="flex" gap="20px">
                    <Button type="button" variant="contained" color="error" onClick={rejectCallback}>Muokkaa</Button>
                    <Button type="submit" variant="contained" color="success">Hyväksy</Button>
                </Box>}
                </Box>
            </Box>
         </Box>
        {/* {JSON.stringify(formFields)} */}
        {/* {`data: ${JSON.stringify(parseMatch("?", formFields))}`} */}
        </form>
        </Box>
    );
}

export { Scoresheet };