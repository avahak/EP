import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Theme, Typography, styled } from "@mui/material";
import "./GameResultsTable.css";
import { GameRunningStatRow, playerIndexesToGameIndex } from "../../utils/matchTools";
import { ScoresheetTeam } from "./scoresheetTypes";

const StyledTable = styled(Table)(({ }) => ({
    border: '2px solid black',
    borderCollapse: 'collapse',
}));

const StyledTableText = styled(Typography)(({ }) => ({
    // color: "red",
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: "center",
}));

interface StyledTableCellProps {
    variant?: string;
    theme?: Theme;
}

const StyledTableCell = styled(TableCell)<StyledTableCellProps>(({ height }) => ({
    border: '1px solid black',
    height: height || "40px",
    padding: 2,
    // overflow: 'hidden',
}));

/**
 * Yksi laatikko pelin lopputuloksen esittämiseksi. Tässä on kummankin
 * pelaajan voittamien pelien määrät (left, right).
 */
const DiagonalSplitBox: React.FC<{ left: any; right: any }> = ({left, right}) => {
    return (
        <Box>
            <Box className="diagonal-split-box-left">
                {left}
            </Box>
            <Box className="diagonal-split-box-right">
                {right}
            </Box>
        </Box>
    );
}

/**
 * GameResultsTable on ottelun pelien lopputulokset sisältävä laatikko, jossa on
 * pelaajien nimet ja pelien lopputulokset samalla tavalla esitettynä kuin
 * pöytäkirjassa.
 */
const GameResultsTable: React.FC<{ gameRunningStats: GameRunningStatRow[]; displayErrors: boolean; teamHome: ScoresheetTeam; teamAway: ScoresheetTeam }> = ({gameRunningStats, displayErrors, teamHome, teamAway}) => {

    /**
     * Palauttaa taustavärin tulokselle - punainen väri virheelle.
     */
    const cellBackgroundColor = (theme: Theme, row: number, col: number) => {
        const gameIndex = playerIndexesToGameIndex(row, col);
        if (displayErrors && !gameRunningStats[gameIndex].isValidGame)
            return theme.palette.error.light;
        return theme.palette.background.default;
    };

    return (
        <Paper elevation={10} sx={{p: 1, m: 2}}>
        <Typography textAlign="center" fontWeight="bold">
            {gameRunningStats[8].isAllGamesValid ?
            `Ottelun tulos ${gameRunningStats[8].runningMatchScore[0]} - ${gameRunningStats[8].runningMatchScore[1]}`
            : 
            `Pelien tulokset`
            }
        </Typography>
        <StyledTable sx={{tableLayout: "fixed"}}>
            <TableHead>
                <TableRow>
                    <StyledTableCell width="30%" className="diagonal-split-box">
                        <DiagonalSplitBox 
                            left={<StyledTableText variant="body2" fontWeight="bold">{teamHome.teamName}</StyledTableText>}
                            right={<StyledTableText variant="body2" fontWeight="bold">{teamAway.teamName}</StyledTableText>}
                        />
                    </StyledTableCell>

                    {[0, 1, 2].map((col) => (
                        <StyledTableCell width="20%" key={`box-${col}`} variant="head">
                            <StyledTableText variant="body2" textAlign="center" fontWeight="bold">
                                {teamAway.selectedPlayers[col]?.name ?? ""}
                            </StyledTableText>
                        </StyledTableCell>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {[0, 1, 2].map((row) => (
                    <TableRow key={`box-${row}`}>
                        <StyledTableCell variant="head">
                            <StyledTableText variant="body2" textAlign="center" fontWeight="bold">
                                {teamHome.selectedPlayers[row]?.name ?? ""}
                            </StyledTableText>
                        </StyledTableCell>
                        {[0, 1, 2].map((col) => (
                            <StyledTableCell 
                                key={`box-${row}-${col}`}
                                sx={{backgroundColor: (theme) => cellBackgroundColor(theme, row, col)}}
                            >
                                {/* <DiagonalSplitBox 
                                    left={<StyledTableText className="dsb2-left-text">{roundWins[(9-row*2+col*3) % 9][0]}</StyledTableText>}
                                    right={<StyledTableText className="dsb2-right-text">{roundWins[(9-row*2+col*3) % 9][1]}</StyledTableText>}
                                /> */}
                                {/* <StyledTableText>{roundWins[(9-row*2+col*3) % 9][0]} - {roundWins[(9-row*2+col*3) % 9][1]}</StyledTableText> */}
                                <StyledTableText>
                                    {gameRunningStats[playerIndexesToGameIndex(row, col)].roundWins[0]} - {gameRunningStats[playerIndexesToGameIndex(row, col)].roundWins[1]}
                                </StyledTableText>
                            </StyledTableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </StyledTable>
        </Paper>
    );
}

export { GameResultsTable };