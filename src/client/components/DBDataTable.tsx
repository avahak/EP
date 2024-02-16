/**
 * Esittää SQL-kyselyn tuloksen html taulukkona.
 */
const DataTable: React.FC<any> = ({ data }) => {
    if (!data || data.length === 0) {
        return <p>No data</p>;
    }
    
    const headers = Object.keys(data[0]);
    
    return (
        <table>
        <thead>
            <tr>
            {headers.map((header, index) => (
                <th key={index}>{header}</th>
            ))}
            </tr>
        </thead>
        <tbody>
            {data.map((row: any, rowIndex: number) => (
                <tr key={rowIndex}>
                {headers.map((header, colIndex) => (
                    <td key={colIndex}>{row[header]}</td>
                ))}
                </tr>
            ))}
        </tbody>
        </table>
    );
};
                
export default DataTable;