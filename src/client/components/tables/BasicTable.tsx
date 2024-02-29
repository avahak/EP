// Ei käytössä

import { Table, TableBody, TableCell, TableHead, TableRow, Theme, Typography, styled } from "@mui/material";

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

const BasicTable: React.FC<{ headContent: React.ReactNode[], bodyContent: React.ReactNode[][] }> = ({ headContent, bodyContent }) => {
    return (
        <StyledTable>
            <TableHead>
                <TableRow>
                    {headContent.map((content) => (
                        <StyledTableCell1>
                            {content}
                        </StyledTableCell1>
                    ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {bodyContent.map((bodyContentRow) => (
                <TableRow>
                    {bodyContentRow.map((content) => (
                        <StyledTableCell2>
                            {content}
                        </StyledTableCell2>
                    ))}
                </TableRow>
                ))}
            </TableBody>

        </StyledTable>
    );
}

export { BasicTable };