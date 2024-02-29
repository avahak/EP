import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Theme, Typography, styled } from "@mui/material";
import "./ResultTable.css";

// @ts-ignore
const StyledTable = styled(Table)(({ theme }) => ({
    border: '2px solid black',
    borderCollapse: 'collapse',
}));

// @ts-ignore
const StyledTableText = styled(Typography)(({ theme }) => ({
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

// @ts-ignore
const StyledTableCell1 = styled(TableCell)<StyledTableCellProps>(({ theme }) => ({
    border: '1px solid black',
    // height: "50px",
    padding: 2,
    // overflow: 'hidden',
}));

// @ts-ignore
const StyledTableCell2 = styled(TableCell)<StyledTableCellProps>(({ theme }) => ({
    border: '1px solid black',
    height: "40px",
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
 * ResultTable on ottelun pelien lopputulokset sisältävä laatikko, jossa on
 * pelaajien nimet ja pelien lopputulokset samalla tavalla esitettynä kuin
 * pöytäkirjassa.
 */
const ResultTable: React.FC<{ roundWins: number[][]; teamHome: Team; teamAway: Team }> = ({roundWins, teamHome, teamAway}) => {
    return (
        <Box sx={{m: 0, p: 0}} >
        <Paper elevation={10} sx={{p: 1, m: 2}}>
        <Typography textAlign="center" fontWeight="bold">
            Tulokset
        </Typography>
        <StyledTable size="small">
            <TableHead>
                <TableRow>
                    <StyledTableCell1 sx={{minWidth: "30px", maxWidth: "100px"}} className="diagonal-split-box">
                        <DiagonalSplitBox 
                            left={<StyledTableText variant="body2" fontWeight="bold">{teamHome.teamName}</StyledTableText>}
                            right={<StyledTableText variant="body2" fontWeight="bold">{teamAway.teamName}</StyledTableText>}
                        />
                    </StyledTableCell1>

                    {[0, 1, 2].map((col) => (
                        <StyledTableCell2 sx={{maxWidth: "60px"}} key={`box-${col}`} variant="head">
                            <StyledTableText variant="body2" textAlign="center" fontWeight="bold">
                                {teamAway.selectedPlayers[col]?.name ?? ""}
                            </StyledTableText>
                        </StyledTableCell2>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {[0, 1, 2].map((row) => (
                    <TableRow key={`box-${row}`}>
                        <StyledTableCell1 sx={{maxWidth: "100px"}} variant="head">
                            <StyledTableText variant="body2" textAlign="center" fontWeight="bold">
                                {teamHome.selectedPlayers[row]?.name ?? ""}
                            </StyledTableText>
                        </StyledTableCell1>
                        {[0, 1, 2].map((col) => (
                            <StyledTableCell2 sx={{maxWidth: "60px"}} key={`box-${row}-${col}`}>
                                {/* <DiagonalSplitBox 
                                    left={<StyledTableText className="dsb2-left-text">{roundWins[(9-row*2+col*3) % 9][0]}</StyledTableText>}
                                    right={<StyledTableText className="dsb2-right-text">{roundWins[(9-row*2+col*3) % 9][1]}</StyledTableText>}
                                /> */}
                                <StyledTableText>{roundWins[(9-row*2+col*3) % 9][0]} - {roundWins[(9-row*2+col*3) % 9][1]}</StyledTableText>
                            </StyledTableCell2>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </StyledTable>
        </Paper>
        </Box>
    );
}

export { ResultTable };