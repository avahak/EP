/**
 * Wrapperi Material UI taululle. Esittää tietokantataulun tyyppistä
 * dataa <table> elementtiin pohjautuvalla komponentilla.
 * Muokattu Material UI esimerkkikoodin https://mui.com/material-ui/react-table/ pohjalta.
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
// import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { extractKeys, getComparator } from '../../shared/generalUtils';
// import styled from '@emotion/styled';
// import { useTheme } from '@mui/material/styles';
import { Order } from '../../shared/generalUtils';

// Tyyli taulun otsikkoriville
const customColumnStyleHeader = {
    backgroundColor: "#99aaff",
    padding: "10px 5px",
    margin: "0px 0",
    border: "1px solid black"
};

// Tyyli taulun parittomille riveille
const customColumnStyleOdd = {
    backgroundColor: "#ffffff",
    padding: "10px 5px",
    margin: "0px 0",
    border: "1px solid black"
};

// Tyyli taulun parillisille riveille
const customColumnStyleEven = {
    ...customColumnStyleOdd,
    backgroundColor: "#ddeeff"
};

type HeadCell = {
    disablePadding: boolean;
    id: string;
    label: string;
    numeric: boolean;
}

type TableHeadProps = {
    headCells: HeadCell[]
    order: Order;
    orderBy: string;
    onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void;
}

type ResultTableProps = {
    tableName: string;
    headCells: HeadCell[];
    maxWidth: string;
    rows: any[];
};

/**
 * Muodostaa taulun otsikkorivin.
 */
function SortableTableHead(props: TableHeadProps) {
    const { headCells, order, orderBy, onRequestSort } = props;
    const createSortHandler =
        (property: string) => (event: React.MouseEvent<unknown>) => {
            onRequestSort(event, property);
        };

    return (
        <TableHead>
            <TableRow>
                {headCells.map((headCell) => (
                    <TableCell 
                        style={customColumnStyleHeader}
                        key={headCell.id}
                        // align={headCell.numeric ? 'right' : 'left'}
                        align={'center'}
                        padding={headCell.disablePadding ? 'none' : 'normal'}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
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
    // Erotetaan tableName, headCells, rows muuttujasta props:
    let tableName: string = props.tableName ?? "Table";
    let maxWidth: string = props.maxWidth ?? "750px";
    let headCells: HeadCell[] = [];
    let rows: any[] = props.rows;
    if (props.headCells) {
        headCells = props.headCells;
    } else {
        const keys = extractKeys(rows);
        keys.forEach(([key, type]) => {
            const hc: HeadCell = { 
                disablePadding: true,
                id: key,
                label: key,
                numeric: type == "number" ? true : false
            };
            headCells.push(hc);
        });
    }

    const [order, setOrder] = React.useState<Order>(headCells[0].numeric ? 'desc' : 'asc');
    const [orderBy, setOrderBy] = React.useState<string>(headCells[0].id);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    // const theme = useTheme();

    // @ts-ignore
    const handleRequestSort = (event: React.MouseEvent<unknown>, property: string) => {
        const isDesc = orderBy === property && order === 'desc';
        setOrder(isDesc ? 'asc' : 'desc');
        setOrderBy(property);
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value));
        setPage(0);
    };

    // Tyhjien rivien lukumäärä (!=0 vain viimeisellä sivulla).
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

    const visibleRows = React.useMemo(() =>
        rows.slice().sort(getComparator(order, orderBy)).slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage,
        ),
        [order, orderBy, page, rowsPerPage],
    );

    return (
        <Box sx={{ display: 'flex' }}>
        <Paper sx={{ width: maxWidth, px: 1, mx: 'auto' }} elevation={10}>
            <Typography sx={{width: '100%', textAlign: 'center', fontSize: '1.5rem'}}>{tableName}</Typography>
            <TableContainer>
            <Table
                // sx={{ maxWidth: 750 }}
                aria-labelledby={tableName}
                // size={dense ? 'small' : 'medium'}

            >
                <SortableTableHead
                    headCells={headCells}
                    order={order}
                    orderBy={orderBy}
                    onRequestSort={handleRequestSort}
                />
                <TableBody>
                {visibleRows.map((row, rowIndex) => {
                    return (
                    <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={row.id}
                    >
                        {headCells.map((headCell, colIndex) => (
                        <TableCell 
                            key={colIndex}
                            style={(rowIndex+1)%2 == 0 ? customColumnStyleEven : customColumnStyleOdd} 
                            align={headCell.numeric ? "center" : "left"}
                        >
                                {row[headCell.id]}
                        </TableCell>
                        ))}
                    </TableRow>
                    );
                })}
                {emptyRows > 0 && (
                    <TableRow
                    style={{
                        height: `${(20 + 20 + 1) * emptyRows}px`,
                    }}
                    >
                    <TableCell colSpan={headCells.length} />
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelDisplayedRows={({ from, to, count }) => (
                    `${from}-${to}, yhteensä ${count}`
                )}
                labelRowsPerPage="Rivejä sivulla"
            />
        </Paper>
        </Box>
    );
}

/**
 * ResultTable testusta Material UI esimerkkidatalla.
 */
// @ts-ignore
const _TestResultTable: React.FC = () => {
    const headCells = [
        { id: 'name', numeric: false, disablePadding: true, label: 'Dessert (100g serving)' },
        { id: 'calories', numeric: true, disablePadding: false, label: 'Calories' },
        { id: 'fat', numeric: true, disablePadding: false, label: 'Fat (g)' },
        { id: 'carbs', numeric: true, disablePadding: false, label: 'Carbs (g)' },
        { id: 'protein', numeric: true, disablePadding: false, label: 'Protein (g)' },
    ];
  
    interface Data {
        id: number;
        calories: number;
        carbs: number;
        fat: number;
        name: string;
        protein: number;
    }
    
    function createData(
        id: number,
        name: string,
        calories: number,
        fat: number,
        carbs: number,
        protein: number,
    ): Data {
        return {
            id,
            name,
            calories,
            fat,
            carbs,
            protein,
        };
    }
    
    const rows = [
        createData(1, 'Cupcake', 305, 3.7, 67, 4.3),
        createData(2, 'Donut', 452, 25.0, 51, 4.9),
        createData(3, 'Eclair', 262, 16.0, 24, 6.0),
        createData(4, 'Frozen yoghurt', 159, 6.0, 24, 4.0),
        createData(5, 'Gingerbread', 356, 16.0, 49, 3.9),
        createData(6, 'Honeycomb', 408, 3.2, 87, 6.5),
        createData(7, 'Ice cream sandwich', 237, 9.0, 37, 4.3),
        createData(8, 'Jelly Bean', 375, 0.0, 94, 0.0),
        createData(9, 'KitKat', 518, 26.0, 65, 7.0),
        createData(10, 'Lollipop', 392, 0.2, 98, 0.0),
        createData(11, 'Marshmallow', 318, 0, 81, 2.0),
        createData(12, 'Nougat', 360, 19.0, 9, 37.0),
        createData(13, 'Oreo', 437, 18.0, 63, 4.0),
        createData(14, 'Cupcake2', 305, 3.7, 67, 4.3),
        createData(15, 'Donut2', 452, 25.0, 51, 4.9),
        createData(16, 'Eclair2', 262, 16.0, 24, 6.0),
        createData(17, 'Frozen yoghurt2', 159, 6.0, 24, 4.0),
        createData(18, 'Gingerbread2', 356, 16.0, 49, 3.9),
        createData(19, 'Honeycomb2', 408, 3.2, 87, 6.5),
        createData(20, 'Ice cream sandwich2', 237, 9.0, 37, 4.3),
        createData(21, 'Jelly Bean2', 375, 0.0, 94, 0.0),
        createData(22, 'KitKat2', 518, 26.0, 65, 7.0),
        createData(23, 'Lollipop2', 392, 0.2, 98, 0.0),
        createData(24, 'Marshmallow2', 318, 0, 81, 2.0),
        createData(25, 'Nougat2', 360, 19.0, 9, 37.0),
        createData(26, 'Oreo2', 437, 18.0, 63, 4.0),
    ];
  
    return (
        <>
        <Link to="/">Takaisin</Link>
        <br />
        <ResultTable tableName="Nutritional Info" headCells={headCells} rows={rows} />
        </>);
};

/**
 * ResultTable testusta Material UI esimerkkidatalla.
 */
const TestResultTable: React.FC = () => {
    const rows = [
        { id: 1, name: 'Cupcake', calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
        { id: 2, name: 'Donut', calories: 452, fat: 25.0, carbs: 51, protein: 4.9 },
        { id: 3, name: 'Eclair', calories: 262, fat: 16.0, carbs: 24, protein: 6.0 },
        { id: 4, name: 'Frozen yoghurt', calories: 159, fat: 6.0, carbs: 24, protein: 4.0 },
        { id: 5, name: 'Gingerbread', calories: 356, fat: 16.0, carbs: 49, protein: 3.9 },
        { id: 6, name: 'Honeycomb', calories: 408, fat: 3.2, carbs: 87, protein: 6.5 },
        { id: 7, name: 'Ice cream sandwich', calories: 237, fat: 9.0, carbs: 37, protein: 4.3 },
        { id: 8, name: 'Jelly Bean', calories: 375, fat: 0.0, carbs: 94, protein: 0.0 },
        { id: 9, name: 'KitKat', calories: 518, fat: 26.0, carbs: 65, protein: 7.0 },
        { id: 10, name: 'Lollipop', calories: 392, fat: 0.2, carbs: 98, protein: 0.0 },
        { id: 11, name: 'Marshmallow', calories: 318, fat: 0, carbs: 81, protein: 2.0 },
        { id: 12, name: 'Nougat', calories: 360, fat: 19.0, carbs: 9, protein: 37.0 },
        { id: 13, name: 'Oreo', calories: 437, fat: 18.0, carbs: 63, protein: 4.0 },
        { id: 14, name: 'Cupcake2', calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
        { id: 15, name: 'Donut2', calories: 452, fat: 25.0, carbs: 51, protein: 4.9 },
        { id: 16, name: 'Eclair2', calories: 262, fat: 16.0, carbs: 24, protein: 6.0 },
        { id: 17, name: 'Frozen yoghurt2', calories: 159, fat: 6.0, carbs: 24, protein: 4.0 },
        { id: 18, name: 'Gingerbread2', calories: 356, fat: 16.0, carbs: 49, protein: 3.9 },
        { id: 19, name: 'Honeycomb2', calories: 408, fat: 3.2, carbs: 87, protein: 6.5 },
        { id: 20, name: 'Ice cream sandwich2', calories: 237, fat: 9.0, carbs: 37, protein: 4.3 },
        { id: 21, name: 'Jelly Bean2', calories: 375, fat: 0.0, carbs: 94, protein: 0.0 },
        { id: 22, name: 'KitKat2', calories: 518, fat: 26.0, carbs: 65, protein: 7.0 },
        { id: 23, name: 'Lollipop2', calories: 392, fat: 0.2, carbs: 98, protein: 0.0 },
        { id: 24, name: 'Marshmallow2', calories: 318, fat: 0, carbs: 81, protein: 2.0 },
        { id: 25, name: 'Nougat2', calories: 360, fat: 19.0, carbs: 9, protein: 37.0 },
        { id: 26, name: 'Oreo2', calories: 437, fat: 18.0, carbs: 63, protein: 4.0 },
    ];
  
    return (
        <>
        <Link to="/">Takaisin</Link>
        <br />
        <ResultTable tableName={"Data Table"} rows={rows} />
        </>);
};

export { ResultTable, TestResultTable };