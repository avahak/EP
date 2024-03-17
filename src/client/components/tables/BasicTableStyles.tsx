/**
 * Tyylejä taulujen kustomoinniksi minimaalisella tyylillä. 
 * Näitä käytetään ottelun kirjaamisessa erätuloksien esittämisessä 
 * (GameDialog.tsx ja RoundResultsTable.tsx komponenteissa).
 */

import { Table, TableCell, TableCellProps, Typography, styled } from "@mui/material";

const BasicTable = styled(Table)({
    border: '2px solid black',
    borderCollapse: 'collapse',
});

interface BasicTableCellProps extends TableCellProps {
    paddingX?: string;
    paddingY?: string;
    minWidth?: string;
    maxWidth?: string;
}

const BasicTableCell = styled(TableCell)<BasicTableCellProps>(({ paddingX, paddingY }) => ({
    border: '2px solid black',
    paddingTop: paddingY || "8px",
    paddingBottom: paddingY || "8px",
    paddingLeft: paddingX || "4px",
    paddingRight: paddingX || "4px",
    overflow: "hidden",
}));

const BasicTableCellLow = styled(TableCell)<BasicTableCellProps>(({ paddingX, paddingY }) => ({
    border: '1px solid black',
    paddingTop: paddingY || "4px",
    paddingBottom: paddingY || "4px",
    paddingLeft: paddingX || "4px",
    paddingRight: paddingX || "4px",
    overflow: "hidden",
}));

const BasicTableHeadCell = styled(TableCell)({
    border: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
});

const BasicTypography = styled(Typography)({
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "clip",
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
});

const BasicNameTypography = styled(Typography)({
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
});

export { BasicTable, BasicTableCell, BasicTableCellLow, BasicTableHeadCell, BasicTypography, BasicNameTypography };