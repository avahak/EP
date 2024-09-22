import { Order } from "../../../shared/generalUtils";
import { addMultiSortRankColumn, numberColumnComparator } from "../../utils/dataSort";
import { ResultTable } from "../general_tables/ResultTable";

const rowsPerPageOptions = { default: 100, max: 200 };

/**
 * Joukkueiden sarjatilanne taulukko.
 * TODO Poista "Pelit V-H" ja "Erät V-H" sarakkeet kapealla näytöllä?
 */
const TeamsTable: React.FC<{ rows: any[], tableName: string, isHighlighted: ((row: any) => boolean) }> = ({ rows, tableName, isHighlighted }) => {
    const table = [];
    for (const row of rows) {
        const newRow = { 
            nimi: `${row.nimi}`,
            ottelut: row.voitto + row.tappio,
            voitto: row.voitto,
            tappio: row.tappio,
            v_peli: row.v_peli,
            h_peli: row.h_peli,
            e_peli: row.v_peli - row.h_peli,
            v_era: row.v_era,
            h_era: row.h_era,
            e_era: row.v_era - row.h_era,
            pisteet: row.voitto,
            highlight: isHighlighted(row),
        };
        table.push(newRow);
    }

    // Lajitellaan taulu ensin nimen mukaan (ei vaikuta sijaan):
    table.sort((rowA, rowB) => rowA.nimi.localeCompare(rowB.nimi));

    // Lasketaan sija:
    const comparators = [
        numberColumnComparator<any, "v_era">("v_era", "desc"),
        numberColumnComparator<any, "v_peli">("v_peli", "desc"),
        numberColumnComparator<any, "voitto">("voitto", "desc"), 
    ];
    addMultiSortRankColumn(table, "sija", comparators, true);

    const headCells = [
        { id: 'sija', numeric: true, label: 'Sija', defaultOrder: "asc" as Order, width: "10%" },
        { id: 'nimi', numeric: false, label: 'Joukkue', width: "30%" },
        { id: 'ottelut', numeric: true, label: 'Ottelut', width: "10%" },
        { id: 'voitto', numeric: true, label: 'Voitot', width: "10%" },
        { id: 'tappio', numeric: true, label: 'Häviöt', width: "10%" },
        { id: 'v_peli', numeric: true, label: 'Pelit V', width: "10%" },
        { id: 'h_peli', numeric: true, label: 'Pelit H', width: "10%" },
        // { id: 'e_peli', numeric: true, label: 'Pelit V-H', width: "10%" },
        { id: 'v_era', numeric: true, label: 'Erät V', width: "10%" },
        { id: 'h_era', numeric: true, label: 'Erät H', width: "10%" },
        // { id: 'e_era', numeric: true, label: 'Erät V-H', width: "10%" },
        { id: 'pisteet', numeric: true, label: 'Pisteet', width: "10%" },
    ];

    return (
        <ResultTable 
            tableName={tableName} 
            headCells={headCells} 
            rowsPerPageOptions={rowsPerPageOptions} 
            rows={table} 
            stripingId="sija_dense" 
            isHighlighted={(row: any) => row.highlight === true}
        >
        </ResultTable>
    );
};

export { TeamsTable };