/**
 * Useita koti- ja vierasotteluiden pistepörssi taulukoita.
 * Taulut ovat ResultTable komponentteja ja ne järjestetään käyttäen
 * addMultiSortRankColumn.
 * TODO Masters pörssi
 */

import { Order } from "../../../shared/generalUtils";
import { addMultiSortRankColumn, numberColumnComparator } from "../../utils/dataSort";
import { ResultTable } from "../general_tables/ResultTable";

const rowsPerPageOptions = { default: 200, max: 300 };

/** 
 * Muotoilee prosentit ja tarkistaa nollalla jakamisen.
 */
function roundPercentageformatter(row: any) {
    if (row.v_erat + row.h_erat == 0)
        return "-";
    return (row.p_erat as number).toFixed(1);
};

/**
 * Muotoilee prosentit ja tarkistaa nollalla jakamisen.
 */
function gamePercentageformatter(row: any) {
    if (row.v_pelit + row.h_pelit == 0)
        return "-";
    return (row.p_pelit as number).toFixed(1);
};

/**
 * Taulukko, jossa mukana yleisiä tuloksia kaikista peleistä ("kaikki" taulukko).
 */
const TotalWinsTable: React.FC<{ rows: any[], tableName: string, isHighlighted: ((row: any) => boolean) }> = ({ rows, tableName, isHighlighted }) => {
    const table = [];
    for (const row of rows) {
        const newRow = { 
            nimi: `${row.nimi} (${row.lyhenne})`,
            ottelut: Math.ceil((row.v_peli + row.h_peli)/3),   // HUOM! Tämä on oikein vain jos kaikki pelit aina kirjattu.
            erat: row.v_era + row.h_era,
            v_erat: row.v_era,
            h_erat: row.h_era,
            e_erat: row.v_era - row.h_era,
            p_erat: (row.v_era + row.h_era != 0) ? (100*row.v_era/(row.v_era + row.h_era)) : 0,
            pelit: row.v_peli + row.h_peli,
            v_pelit: row.v_peli,
            h_pelit: row.h_peli,
            e_pelit: row.v_peli - row.h_peli,
            p_pelit: (row.v_peli + row.h_peli != 0) ? (100*row.v_peli/(row.v_peli + row.h_peli)) : 0,
            highlight: isHighlighted(row),
        };
        table.push(newRow);
    }

    // Lajitellaan taulu ensin nimen mukaan (ei vaikuta sijaan):
    table.sort((rowA, rowB) => rowA.nimi.localeCompare(rowB.nimi));

    // Lasketaan sija:
    const comparators = [
        numberColumnComparator<any, "h_erat">("h_erat", "asc"), 
        numberColumnComparator<any, "v_erat">("v_erat", "desc"), 
        numberColumnComparator<any, "h_pelit">("h_pelit", "asc"), 
        numberColumnComparator<any, "v_pelit">("v_pelit", "desc"), 
    ];
    addMultiSortRankColumn(table, "sija", comparators, true);

    const headCells = [
        { id: 'sija', numeric: true, label: 'Sija', defaultOrder: "asc" as Order, width: "10%" },
        { id: 'nimi', numeric: false, label: 'Nimi', width: "30%" },
        { id: 'ottelut', numeric: true, label: 'Ottelut', width: "10%" },
        { id: 'erat', numeric: true, label: 'Erät', width: "10%" },
        { id: 'v_erat', numeric: true, label: 'Erä-voitot', width: "10%" },
        { id: 'h_erat', numeric: true, label: 'Erä-häviöt', width: "10%" },
        // { id: 'e_erat', numeric: true, label: 'Erä V-H', width: "10%" },
        { id: 'p_erat', numeric: true, label: 'Erä-%', width: "15%", entryFormatter: roundPercentageformatter },
        { id: 'pelit', numeric: true, label: 'Pelit', width: "10%" },
        { id: 'h_pelit', numeric: true, label: 'Peli-häviöt', width: "10%" },
        // { id: 'e_pelit', numeric: true, label: 'Peli V-H', width: "10%" },
        { id: 'p_pelit', numeric: true, label: 'Peli-%', width: "15%", entryFormatter: gamePercentageformatter },
        { id: 'v_pelit', numeric: true, label: 'Peli-voitot', width: "10%" },
    ];

    console.log("TotalWinsTable:", tableName, "rows:", table);

    return (
        <ResultTable 
            tableName={tableName} 
            headCells={headCells} 
            rows={table} 
            rowsPerPageOptions={rowsPerPageOptions}
            stripingId="sija_dense" 
            isHighlighted={(row: any) => row.highlight === true}
        >
        </ResultTable>
    );
};

/**
 * Taulukko, jossa mukana yleisiä tuloksia koti- ja vieraspeleistä 
 * ("koti", "vieras" taulukot).
 */
const DesignationWinsTable: React.FC<{ rows: any[], designation: "home"|"away", tableName: string, isHighlighted: ((row: any) => boolean) }> = ({ rows, designation, tableName, isHighlighted }) => {
    const affix = designation == "home" ? "_koti" : "_vieras";
    const table = [];
    for (const row of rows) {
        const v_era = row[`v_era${affix}`];
        const h_era = row[`h_era${affix}`];
        const v_peli = row[`v_peli${affix}`];
        const h_peli = row[`h_peli${affix}`];
        const newRow = { 
            nimi: `${row.nimi} (${row.lyhenne})`,
            ottelut: Math.ceil((v_peli + h_peli)/3),   // HUOM! Tämä on oikein vain jos kaikki pelit aina kirjattu.
            erat: v_era + h_era,
            v_erat: v_era,
            h_erat: h_era,
            e_erat: v_era - h_era,
            p_erat: (v_era + h_era != 0) ? (100*v_era/(v_era + h_era)) : 0,
            pelit: v_peli + h_peli,
            v_pelit: v_peli,
            h_pelit: h_peli,
            e_pelit: v_peli - h_peli,
            p_pelit: (v_peli + h_peli != 0) ? (100*v_peli/(v_peli + h_peli)) : 0,
            highlight: isHighlighted(row),
        };
        table.push(newRow);
    }

    // Lajitellaan taulu ensin nimen mukaan (ei vaikuta sijaan):
    table.sort((rowA, rowB) => rowA.nimi.localeCompare(rowB.nimi));

    // Lasketaan sija:
    const comparators = [
        numberColumnComparator<any, "h_erat">("h_erat", "asc"), 
        numberColumnComparator<any, "v_erat">("v_erat", "desc"), 
        numberColumnComparator<any, "h_pelit">("h_pelit", "asc"), 
        numberColumnComparator<any, "v_pelit">("v_pelit", "desc"), 
    ];
    addMultiSortRankColumn(table, "sija", comparators, true);

    const headCells = [
        { id: 'sija', numeric: true, label: 'Sija', defaultOrder: "asc" as Order, width: "10%" },
        { id: 'nimi', numeric: false, label: 'Nimi', width: "30%" },
        { id: 'ottelut', numeric: true, label: 'Ottelut', width: "10%" },
        { id: 'erat', numeric: true, label: 'Erät', width: "10%" },
        { id: 'v_erat', numeric: true, label: 'Erä-voitot', width: "10%" },
        { id: 'h_erat', numeric: true, label: 'Erä-häviöt', width: "10%" },
        // { id: 'e_erat', numeric: true, label: 'Erä V-H', width: "10%" },
        { id: 'p_erat', numeric: true, label: 'Erä-%', width: "15%", entryFormatter: roundPercentageformatter },
        { id: 'pelit', numeric: true, label: 'Pelit', width: "10%" },
        { id: 'h_pelit', numeric: true, label: 'Peli-häviöt', width: "10%" },
        // { id: 'e_pelit', numeric: true, label: 'Peli V-H', width: "10%" },
        { id: 'p_pelit', numeric: true, label: 'Peli-%', width: "15%", entryFormatter: gamePercentageformatter },
        { id: 'v_pelit', numeric: true, label: 'Peli-voitot', width: "10%" },
    ];

    console.log("TotalWinsTable:", tableName, "rows:", table);

    return (
        <ResultTable 
            tableName={tableName} 
            headCells={headCells} 
            rows={table} 
            rowsPerPageOptions={rowsPerPageOptions}
            stripingId="sija_dense" 
            isHighlighted={(row: any) => row.highlight === true}
        >
        </ResultTable>
    );
};

/**
 * Luo taulun, missä on tietyllä tavalla voitettujen (Kn, Vn, missä n=dbIndex) pelien 
 * sijoitukset.
 * @param dbIndex Indeksi, joka tietokannassa vastaa voiton tapaa, 1-6.
 */
const PlayerWinsTable: React.FC<{ rows: any[], dbIndex: 1|2|3|4|5|6, tableName: string, homeLabel: string, awayLabel: string, isHighlighted: ((row: any) => boolean) }> = ({ rows, dbIndex, tableName, homeLabel, awayLabel, isHighlighted }) => {
    const table = [];
    for (const row of rows) {
        const newRow = { 
            nimi: `${row.nimi} (${row.lyhenne})`,
            pelit: row.v_peli + row.h_peli, 
            erat: row.v_era + row.h_era,
            koti: row[`K${dbIndex}`],
            vieras: row[`V${dbIndex}`],
            yhteensa: row[`K${dbIndex}`] + row[`V${dbIndex}`],
            highlight: isHighlighted(row),
        };
        table.push(newRow);
    }

    // Lajitellaan taulu ensin nimen mukaan (ei vaikuta sijaan):
    table.sort((rowA, rowB) => rowA.nimi.localeCompare(rowB.nimi));

    // Lasketaan sija:
    const comparators = [
        numberColumnComparator<any, "erat">("erat", "asc"), 
        numberColumnComparator<any, "vieras">("vieras", "desc"), 
        numberColumnComparator<any, "yhteensa">("yhteensa", "desc"), 
    ];
    addMultiSortRankColumn(table, "sija", comparators, true);

    const headCells = [
        { id: 'sija', numeric: true, label: 'Sija', defaultOrder: "asc" as Order, width: "10%" },
        { id: 'nimi', numeric: false, label: 'Nimi', width: "30%" },
        { id: 'erat', numeric: true, label: 'Erät', width: "10%" },
        { id: 'koti', numeric: true, label: homeLabel, width: "10%" },
        { id: 'vieras', numeric: true, label: awayLabel, width: "10%" },
        { id: 'yhteensa', numeric: true, label: 'Yhteensä', width: "10%" },
    ];

    console.log("PlayerWinsTable:", tableName, "rows:", table);

    return (
        <ResultTable 
            tableName={tableName} 
            headCells={headCells} 
            rows={table} 
            rowsPerPageOptions={rowsPerPageOptions}
            stripingId="sija_dense" 
            isHighlighted={(row: any) => row.highlight === true}
        >
        </ResultTable>
    );
};

// Luodaan taulut kullekin tavalle voittaa, dbIndex: 2-6:

const RunoutWinsTable: React.FC<{ rows: any[], isHighlighted: ((row: any) => boolean) }> = ({ rows, isHighlighted }) => 
    PlayerWinsTable({ rows: rows, dbIndex: 2, tableName: "Parttien Pistepörssi", homeLabel: "Koti AP", awayLabel: "Vieras AP", isHighlighted });

const GoldenBreakWinsTable: React.FC<{ rows: any[], isHighlighted: ((row: any) => boolean) }> = ({ rows, isHighlighted }) => 
    PlayerWinsTable({ rows: rows, dbIndex: 3, tableName: "Ysi Pistepörssi", homeLabel: "Koti ysit", awayLabel: "Vieras ysit", isHighlighted });

const CombinationWinsTable: React.FC<{ rows: any[], isHighlighted: ((row: any) => boolean) }> = ({ rows, isHighlighted }) => 
    PlayerWinsTable({ rows: rows, dbIndex: 4, tableName: "Kyytien Pistepörssi", homeLabel: "Koti kyydit", awayLabel: "Vieras kyydit", isHighlighted });

const CaromWinsTable: React.FC<{ rows: any[], isHighlighted: ((row: any) => boolean) }> = ({ rows, isHighlighted }) => 
    PlayerWinsTable({ rows: rows, dbIndex: 5, tableName: "Karavoittojen Pistepörssi", homeLabel: "Koti karat", awayLabel: "Vieras karat", isHighlighted });

const ThreeFoulWinsTable: React.FC<{ rows: any[], isHighlighted: ((row: any) => boolean) }> = ({ rows, isHighlighted }) => 
    PlayerWinsTable({ rows: rows, dbIndex: 6, tableName: "Virheillä voittojen Pistepörssi", homeLabel: "Koti voitot", awayLabel: "Vieras voitot", isHighlighted });

export { TotalWinsTable, DesignationWinsTable, GoldenBreakWinsTable, RunoutWinsTable, CombinationWinsTable, CaromWinsTable, ThreeFoulWinsTable };