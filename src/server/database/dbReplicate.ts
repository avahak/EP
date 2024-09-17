import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

function loadSQLFiles(directory: string): string[] {
    const sqlFiles: string[] = [];

    fs.readdirSync(directory).forEach(file => {
        const filePath = path.join(directory, file);
        if (path.extname(filePath) === '.sql') {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            sqlFiles.push(fileContent);
        }
    });

    return sqlFiles;
}

async function replicateDB(sqlFiles: string[], pool: mysql.Pool) {
    
    const connection = await pool.getConnection();
    try {
        for (const s of sqlFiles) {
            await connection.query(s);
        }
    } catch (error) {
        console.error("recreateDatabase error:", error);
    } finally {
        connection.destroy();       // TEHOTONTA! Käytetään vain Azure SQL ongelmien takia
        // Vapautetaan yhteys takaisin altaaseen:
        // connection.release();
    }
}

export { loadSQLFiles, replicateDB };