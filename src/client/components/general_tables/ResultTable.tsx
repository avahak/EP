/**
 * Wrapperi Material UI taululle. Esittää tietokantataulun tyyppistä
 * dataa <table> elementtiin pohjautuvalla Material UI komponentilla.
 * Muokattu Material UI esimerkkikoodin pohjalta:
 * https://mui.com/material-ui/react-table/
 */

import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';
import { Typography } from '@mui/material';
import { extractKeys, getComparator } from '../../../shared/generalUtils';
import { Order } from '../../../shared/generalUtils';

/** 
 * Tyyli taulun otsikkoriville
 */
const customColumnStyleHeader = {
    backgroundColor: "#99aaff",
    padding: "2px 4px",
    margin: "0px 0",
    border: "1px solid black",
    borderBottom: "3px solid black",
    overflow: "hidden",
    whiteSpace: "wrap",
    fontWeight: "bold"
};

/** 
 * Tyyli taulun parittomille riveille
 */
const customColumnStyleOdd = {
    backgroundColor: "#ffffff",
    padding: "2px 4px",
    margin: "0px 0",
    border: "1px solid black",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
};

/**
 * Tyyli taulun parillisille riveille
 */
const customColumnStyleEven = {
    ...customColumnStyleOdd,
    backgroundColor: "#ddeeff"
};

/**
 * HeadCell määrittelee esitettävän sarakkeen muodon.
 */
type HeadCell = {
    id: string;
    label: string;
    numeric: boolean;
    disablePadding?: boolean;
    defaultOrder?: Order;
    width?: any;
    numericToFixed?: number;
    entryFormatter?: (row: any) => string;
};

type TableHeadProps = {
    headCells: HeadCell[];
    order: Order;
    orderBy: string;
    onRequestSort: (event: React.MouseEvent<unknown>, property: string, defaultOrder: Order|undefined) => void;
};

type ResultTableProps = {
    tableName: string;
    headCells: HeadCell[];
    minWidth: string;
    maxWidth: string;
    stripingId: string;     // määrää rivin värin, pitää olla integer
    rows: any[];
    rowsPerPageOptions: { default: number, max: number };
};

/**
 * Muotoilee solun row[headCell.id] sisällön.
 */
function getEntryValue(headCell: HeadCell, row: any) {
    if (headCell.entryFormatter)
        return headCell.entryFormatter(row);
    const value = row[headCell.id];
    if (headCell.numeric) {
        if (isNaN(value))
            return "-";
        if (headCell.numericToFixed)
            return (value as number).toFixed(headCell.numericToFixed);
    }
    return value;
}

/**
 * Määrittelee oletusarvoisen järjestyksen suunnan (nouseva/laskeva) sarakkeelle.
 */
function getDefaultOrder(headCell: HeadCell): Order {
    if (headCell.defaultOrder)
        return headCell.defaultOrder;
    return headCell.numeric ? "desc" : "asc";
}

/**
 * Palauttaa rivin tyylinä customColumnStyleEven tai customColumnStyleOdd.
 * TODO! Mieti stripingId toiminta uudelleen, tämä ei ole kovin hyvä.
 */
function getColumnStyle(rows: any[], orderBy: string, rowIndex: number, stripingId: string | undefined) {
    const row = rows[rowIndex];
    const stripeIndex = (stripingId && `${orderBy}_dense` === stripingId) ? parseInt(row[stripingId]) : rowIndex;
    return stripeIndex % 2 == 0 ? customColumnStyleEven : customColumnStyleOdd;
}

/**
 * Muodostaa taulun otsikkorivin.
 */
function SortableTableHead(props: TableHeadProps) {
    const { headCells, order, orderBy, onRequestSort } = props;
    const createSortHandler =
        (property: string, defaultOrder: Order | undefined) => (event: React.MouseEvent<unknown>) => {
            onRequestSort(event, property, defaultOrder);
        };

    return (
        <TableHead>
            <TableRow>
                {headCells.map((headCell, headCellIndex) => (
                    <TableCell 
                        width={headCell.width ?? "10%"}
                        style={customColumnStyleHeader}
                        key={headCellIndex}
                        // align={headCell.numeric ? 'right' : 'left'}
                        align={'center'}
                        padding={headCell.disablePadding ? 'none' : 'normal'}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : getDefaultOrder(headCell)}
                            onClick={createSortHandler(headCell.id, getDefaultOrder(headCell))}
                        >
                        {headCell.label}
                        {orderBy === headCell.id ? (
                            <Box component="span" sx={visuallyHidden}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                            </Box>
                        ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

/**
 * Muodostaa varsinaisen taulun. Parametrina annetaan taulun data ja valinnaisesti
 * ostikkorivin tiedot.
 */
const ResultTable: React.FC<Partial<ResultTableProps> & { rows: any[] }> = (props) => {
    let tableName: string = props.tableName ?? "Table";
    let minWidth: string = props.minWidth ?? "200px";
    let maxWidth: string = props.maxWidth ?? "750px";
    let rowsPerPageOptions = props.rowsPerPageOptions ?? { default: 10, max: 20 };
    let rowsPerPage = props.rows.length > rowsPerPageOptions.max ? rowsPerPageOptions.default : Math.max(props.rows.length, 1);
    let headCells: HeadCell[] = [];
    let rows: any[] = props.rows;
    if (props.headCells) {
        headCells = props.headCells;
    } else {
        // Ei ole annettu headCells, joten muodostetaan 
        // sarakeasetukset seuraavilla oletusarvoilla:
        const keys = extractKeys(rows);
        keys.forEach(([key, type]) => {
            const headCell: HeadCell = { 
                disablePadding: true,
                id: key,
                label: key,
                numeric: type == "number" ? true : false
            };
            headCells.push(headCell);
        });
    }

    const [order, setOrder] = React.useState<Order>(headCells[0].numeric ? 'asc' : 'asc');
    const [orderBy, setOrderBy] = React.useState<string>(headCells[0].id);
    const [page, setPage] = React.useState(0);
    // const [rowsPerPage, setRowsPerPage] = React.useState(10);

    // const theme = useTheme();

    /**
     * Kutsutaan kun käyttäjä pyytää järjestämään rivin uudelleen (valitsemalla otsakerivin).
     */
    const handleRequestSort = (_event: React.MouseEvent<unknown>, property: string, defaultOrder: Order | undefined) => {
        let newOrder: Order = "desc";
        if (orderBy === property)
            newOrder = (order == "asc") ? "desc" : "asc";
        else 
            newOrder = defaultOrder ?? "asc";
        setOrder(newOrder);
        setOrderBy(property);
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    // const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     setRowsPerPage(parseInt(event.target.value));
    //     setPage(0);
    // };

    // Tyhjien rivien lukumäärä (!=0 vain viimeisellä sivulla).
    const emptyRows =
        page > 0 ? Math.max(0, (1+page)*rowsPerPage - rows.length) : 0;

    // Tällä hetkellä näkyvät rivit:
    const visibleRows = React.useMemo(() =>
        rows.slice().sort(getComparator(order, orderBy)).slice(
            page*rowsPerPage,
            page*rowsPerPage + rowsPerPage,
        ),
        [order, orderBy, page, rowsPerPage, rows],
    );

    return (
        <Box sx={{ display: 'flex', overflowX: 'scroll' }}>
        <Paper sx={{ minWidth: minWidth, width: maxWidth, px: 1, mx: 'auto' }} elevation={10}>
            <Typography sx={{width: '100%', textAlign: 'center', fontSize: '1.5rem'}}>{tableName}</Typography>
            <TableContainer>
            <Table
                sx={{ tableLayout: "fixed" }}
                aria-labelledby={tableName}
            >
                <SortableTableHead
                    headCells={headCells}
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={(event, property, defaultOrder) => handleRequestSort(event, property, defaultOrder)}
                />
                <TableBody>
                {visibleRows.map((row, rowIndex) => {
                    return (
                    <TableRow
                        key={rowIndex}
                    >
                        {headCells.map((headCell, colIndex) => (
                        <TableCell 
                            key={colIndex}
                            style={getColumnStyle(visibleRows, orderBy, rowIndex, props.stripingId)} 
                            align={headCell.numeric ? "center" : "left"}
                        >
                            {getEntryValue(headCell, row)}
                        </TableCell>
                        ))}
                    </TableRow>
                    );
                })}
                {emptyRows > 0 && (
                    <TableRow
                    style={{
                        height: `${(25) * emptyRows}px`,
                    }}
                    >
                    <TableCell colSpan={headCells.length} />
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </TableContainer>
            <TablePagination
                component="div"
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[]}
                // onRowsPerPageChange={handleChangeRowsPerPage}
                // labelRowsPerPage="Rivejä"
                count={rows.length}
                page={page}
                onPageChange={handleChangePage}
                labelDisplayedRows={({ from, to, count }) => (
                    `${from}-${to} (${count})`
                )}
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                }}
                showFirstButton={true}
                showLastButton={true}
            />
        </Paper>
        </Box>
    );
}

export { ResultTable };