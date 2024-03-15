import mysql from 'mysql2/promise';

/** 
 * Kokoelma kierrätettäviä tietokantayhteyksiä, liittyen tietokantaan DB_NAME:
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: ['DATE'],          // use a string to represent dates instead of javascript Date
    // idleTimeout: 20000,
    // connectTimeout: 5000,
});

/** 
 * Kokoelma kierrätettäviä tietokantayhteyksiä, joita ei ole liitetty tiettyyn tietokantaan.
 * Tällaisia yhteyksiä käytetään esimerkiksi poistamaan tai lisäämään tietokantoja.
 */
const poolNoDatabase = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dateStrings: ['DATE'],          // use a string to represent dates instead of javascript Date
    // idleTimeout: 20000,
    // connectTimeout: 5000
});

export { pool, poolNoDatabase };