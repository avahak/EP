import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Theme, Typography, styled } from "@mui/material";
import "./GameResultsTable.css";

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
const GameResultsTable: React.FC<{ roundWins: number[][]; teamHome: Team; teamAway: Team }> = ({roundWins, teamHome, teamAway}) => {
    return (
        <Box sx={{m: 0, p: 0}} >
        <Paper elevation={10} sx={{p: 1, m: 2}}>
        <Typography textAlign="center" fontWeight="bold">
            Tulokset
        </Typography>
        <StyledTable size="small">
            <TableHead>
                <TableRow>
                    <StyledTableCell sx={{minWidth: "30px", maxWidth: "100px"}} className="diagonal-split-box">
                        <DiagonalSplitBox 
                            left={<StyledTableText variant="body2" fontWeight="bold">{teamHome.teamName}</StyledTableText>}
                            right={<StyledTableText variant="body2" fontWeight="bold">{teamAway.teamName}</StyledTableText>}
                        />
                    </StyledTableCell>

                    {[0, 1, 2].map((col) => (
                        <StyledTableCell sx={{maxWidth: "60px"}} key={`box-${col}`} variant="head">
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
                        <StyledTableCell sx={{maxWidth: "100px"}} variant="head">
                            <StyledTableText variant="body2" textAlign="center" fontWeight="bold">
                                {teamHome.selectedPlayers[row]?.name ?? ""}
                            </StyledTableText>
                        </StyledTableCell>
                        {[0, 1, 2].map((col) => (
                            <StyledTableCell sx={{maxWidth: "60px"}} key={`box-${row}-${col}`}>
                                {/* <DiagonalSplitBox 
                                    left={<StyledTableText className="dsb2-left-text">{roundWins[(9-row*2+col*3) % 9][0]}</StyledTableText>}
                                    right={<StyledTableText className="dsb2-right-text">{roundWins[(9-row*2+col*3) % 9][1]}</StyledTableText>}
                                /> */}
                                <StyledTableText>{roundWins[(9-row*2+col*3) % 9][0]} - {roundWins[(9-row*2+col*3) % 9][1]}</StyledTableText>
                            </StyledTableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </StyledTable>
        </Paper>
        </Box>
    );
}

export { GameResultsTable };