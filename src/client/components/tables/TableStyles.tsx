/**
 * Tyylejä taulujen kustomoinniksi.
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

const BasicTableCell = styled(TableCell)<BasicTableCellProps>(({ minWidth, maxWidth, paddingX, paddingY }) => ({
    border: '2px solid black',
    paddingTop: paddingY || "8px",
    paddingBottom: paddingY || "8px",
    paddingLeft: paddingX || "2px",
    paddingRight: paddingX || "2px",
    minWidth: minWidth || "20px",
    maxWidth: maxWidth || "50px",
    overflow: "hidden",
}));

const BasicTableCellLow = styled(TableCell)<BasicTableCellProps>(({ minWidth, maxWidth, paddingX, paddingY }) => ({
    border: '1px solid black',
    paddingTop: paddingY || "4px",
    paddingBottom: paddingY || "4px",
    paddingLeft: paddingX || "2px",
    paddingRight: paddingX || "2px",
    minWidth: minWidth || "20px",
    maxWidth: maxWidth || "50px",
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
});

const BasicNameTypography = styled(Typography)({
    textAlign: "center",
    // maxWidth: "50px",
    textWrap: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: 0,
    margin: 0,
});

export { BasicTable, BasicTableCell, BasicTableCellLow, BasicTableHeadCell, BasicTypography, BasicNameTypography };