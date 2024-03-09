import { Order } from "../../../shared/generalUtils";
import { addMultiSortRankColumn, numberColumnComparator } from "../../utils/dataSort";
import { ResultTable } from "../tables/ResultTable";

/**
 * Joukkueiden sarjatilanne taulukko.
 */
const TeamsTable: React.FC<{ rows: any[], tableName: string }> = ({ rows, tableName }) => {
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
            pisteet: row.v_peli,
        };
        table.push(newRow);
    }

    const comparators = [
        numberColumnComparator<any, "pisteet">("pisteet", "desc"), 
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
        { id: 'e_peli', numeric: true, label: 'Pelit V-H', width: "10%" },
        { id: 'v_era', numeric: true, label: 'Erät V', width: "10%" },
        { id: 'h_era', numeric: true, label: 'Erät H', width: "10%" },
        { id: 'e_era', numeric: true, label: 'Erät V-H', width: "10%" },
        { id: 'pisteet', numeric: true, label: 'Pisteet', width: "10%" },
    ];

    return (
        <ResultTable tableName={tableName} headCells={headCells} rows={table} stripingId="sija_dense" minWidth="500px" maxWidth="800px"></ResultTable>
    );
};

export { TeamsTable };