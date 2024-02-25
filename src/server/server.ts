/**
 * Express.js serveri Reactille ja SQL-kyselyille. Api-rajapinnan 
 * reittien esiliitteenä on /api.
 */

import util from 'util';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { Homography } from './homography.js';
// import { test } from './test.js';
import { HoughTransform } from './hough.js';
import multer from 'multer';
import { createThumbnail } from './imageTools.js';
import { /*myQuery,*/ parseSqlFileContent, recreateDatabase } from './database/dbGeneral.js';
// import { generateAndInsertToDatabase } from './database/dbFakeData.js';
import { getMatchesToReport, getPlayersInTeam, getResultsTeams, getResultsPlayers, getScores, submitMatchResult, getMatchInfo, AddPlayer } from './database/dbSpecific.js';

// Tämänhetkinen kausi, käytetään tietokantakyselyissä
const KULUVA_KAUSI = 3;

dotenv.config();

// interface User extends RowDataPacket {
//     id: number;
//     email: string;
// }

const app = express();
const PORT = process.env.PORT;
const baseUploadDirectory = process.env.BASE_UPLOAD_DIRECTORY || "/home/userdata";
const imageDirectory = `${baseUploadDirectory}/images`;
const thumbnailDirectory = `${baseUploadDirectory}/images/thumbnails`;
const miscDirectory = `${baseUploadDirectory}/misc`;

const __dirname = process.cwd();

// Välitä staattisia tiedostoja 'dist' hakemistosta
app.use(express.static(path.join(__dirname, 'dist')));

// Kaikki reitit käyttävät CORS-politiikkaa:
app.use(cors());
// Määritetään middleware JSON-parsija.
app.use(express.json());

// Tiedojen lataukseen serverille tarvitaan alustaa multer:
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Muodostetaan lupaus fs.writeFile:sta:
const writeFileAsync = util.promisify(fs.writeFile);

// @ts-ignore
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

// @ts-ignore
const poolNoDatabase = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dateStrings: ['DATE'],          // use a string to represent dates instead of javascript Date
    // idleTimeout: 20000,
    // connectTimeout: 5000
});

/**
 * Reitti homografian testaukseen.
 */
app.post('/api/homography', async (req: Request, res: Response) => {
    try {
        const imgPath1 = `${imageDirectory}/${req.body.imgName1}`;
        const imgPath2 = `${imageDirectory}/${req.body.imgName2}`;
        console.log("imgPath1", imgPath1);
        console.log("imgPath2", imgPath2);
        const h = new Homography(imgPath1, imgPath2);

        const x = Math.random();

        console.time(`h.execute_${x}`);
        await h.execute();
        console.timeEnd(`h.execute_${x}`);

        console.log("h.data.matches.length", h.data.matches.length);
        res.json({"data": h.data});
    } catch (error) {
        console.error('Hough transform failed.', error);
        res.status(500).send('Hough transform failed.');
    }
});

/**
 * Reitti Hough-muunnoksen testaamiseksi.
 */
app.post("/api/hough",  async (req: Request, res: Response) => {
    try {
        console.log("req.body", req.body);
        const imgPath = `${imageDirectory}/${req.body.imgName}`;
        console.log("imgPath", imgPath);
        const hough = await HoughTransform.hough(imgPath);

        // Koodaa kuvat base64-datana URL-osoitteiksi:
        const image1 = `data:image/png;base64,${hough[0].toString('base64')}`;
        const image2 = `data:image/png;base64,${hough[1].toString('base64')}`;

        // Lähetä kuvat JSON-muodossa vastauksessa:
        res.json({ images: [image1, image2] });
    } catch (error) {
        console.error('Hough transform failed.', error);
        res.status(500).send('Hough transform failed.');
    }
});

/**
 * Lataa tiedoston serverille. Jos tiedosto on kuva, muodostetaan myös
 * esikatselukuva ja tallennetaan molemmat.
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    // Tallennushakemistot:
    const imagePath = path.join(imageDirectory, file.originalname);
    const thumbnailPath = path.join(thumbnailDirectory, `thumbnail_${file.originalname}.jpeg`);
    const miscPath = path.join(miscDirectory, file.originalname);
    console.log("BASE_UPLOAD_DIRECTORY", process.env.BASE_UPLOAD_DIRECTORY);
    console.log("miscDirectory", miscDirectory);
    // Tarkistetaan, että kaikki hakemistot ovat olemassa:
    if (!fs.existsSync(imageDirectory) || !fs.existsSync(thumbnailDirectory) || !fs.existsSync(miscDirectory)) {
        const errorMessage = `Upload directory does not exist.`;
        console.error(errorMessage);
        res.status(500).send(errorMessage);
        return;
    }

    try {
        const thumbnailBuffer = await createThumbnail(file.buffer);
        if (thumbnailBuffer) {
            // Tiedosto on kuva:
            await writeFileAsync(imagePath, file.buffer);
            await writeFileAsync(thumbnailPath, thumbnailBuffer);
        } else {
            // Tiedosto ei ole kuva:
            await writeFileAsync(miscPath, file.buffer);
        }
        console.log(`File saved to: ${thumbnailBuffer ? imagePath : miscPath}`);
        res.status(200).send(`Received and saved: ${file.originalname}, size: ${file.size}`);
    } catch (error) {
        console.error('Error saving file or thumbnail:', error);
        res.status(500).send(`Error saving file or thumbnail: ${error}`);
    }
});

// Palauttaa listan esikatselukuvista:
app.get('/api/thumbnails', (_req, res) => {
    try {
        if (!fs.existsSync(thumbnailDirectory))
            throw Error("No thumbnail directory");
        // Luetaan thumbnailDirectory hakemiston sisältö:
        const thumbnailFiles = fs.readdirSync(thumbnailDirectory);
        res.json({ thumbnails: thumbnailFiles });
    } catch (error) {
        console.error('Error listing thumbnails:', error);
        res.status(500).send('Error listing thumbnails.');
    }
});

/**
 * Palvelee tiedoston pyynnön perusteella baseDirectory hakemistosta.
 */
const serveFile = (req: Request, res: Response, baseDirectory: string) => {
    const filename = req.params.filename;
    const filePath = path.join(baseDirectory, filename);
    try {
        // Jos tiedosto on olemassa, välitetään se:
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send('File not found.');
        }
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).send('Error serving file.');
    }
};

// Välitetään kuvia:
app.get('/api/images/:filename', (req, res) => serveFile(req, res, imageDirectory));
// Välitetään esikatselukuvia:
app.get('/api/thumbnails/:filename', (req, res) => serveFile(req, res, thumbnailDirectory));
// Välitetään muita tiedostoja:
app.get('/api/misc/:filename', (req, res) => serveFile(req, res, miscDirectory));

/**
 * SQL-tietokannan testausta
*/
app.get('/api/db/schema', async (_req, res) => {
    console.log(new Date(), "/api/db/schema requested")
    try {
        const sqlFile1 = fs.readFileSync('src/server/database/testaus_ep_tables.sql', 'utf-8');
        const sqlFile2 = fs.readFileSync('src/server/database/testaus_ep_triggers.sql', 'utf-8');
        const commands1 = parseSqlFileContent(sqlFile1);
        const commands2 = parseSqlFileContent(sqlFile2);
        // const commands = sqlFile.split(/\r\n/);
        // Replace \r characters with an empty string
        const sanitizedSchema1 = sqlFile1.replace(/\r/g, '').replace(/\n/g, '<br>');
        const sanitizedSchema2 = sqlFile2.replace(/\r/g, '').replace(/\n/g, '<br>');
        // const [rows] = await poolEP.query<any>('SHOW TABLES');
        // const dbList = await myQuery(poolNoDatabase, `SHOW DATABASES`);

        // const matches = await getAllMatches(pool);
        
        res.json({ 
            DB_NAME: process.env.DB_NAME,
            // dbList: dbList,
            commands1: commands1,
            commands2: commands2,
            // matches: matches,
            schema1: sanitizedSchema1,
            schema2: sanitizedSchema2
        });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Poistaa testaus_ep tietokannan ja luo sen uudelleen kaavion perusteella.
 * Sitten generoi ja lisää testidataa sen tauluihin.
 * HUOM: Poistaa kaiken olemassaolevan tiedon tietokannasta.
 */
app.get('/api/db/recreate/:stage', async (req, res) => {
    if (process.env.ENVIRONMENT != 'LOCALHOST')
        return res.status(403).send("Database creation forbidden in this environment.");
    const stage = parseInt(req.params.stage);
    if (isNaN(stage) || stage < 1 || stage > 3)
        return res.status(400).send("Invalid stage.");
    try {
        await recreateDatabase(pool, poolNoDatabase, process.env.DB_NAME || "testaus_ep", stage);
        // await generateAndInsertToDatabase(pool);
        // const data = generateFakeData();
        // const filePath = path.join(miscDirectory, `testaus_ep_data.json`);
        // fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        console.log(`/api/db/recreate/${stage} done`);
        res.send("success!");
    } catch (error) {
        console.error(`Error in /api/db/recreate/${stage}:`, error);
        res.status(500).send('Internal Server Error.');
    }
});

/**
 * Yhdistää API-kutsussa annetun parametrin dbSpecific.ts tiedostossa olevaan
 * funktioon, joka muodostaa SQL-kyselyn ja suorittaa sen. 
 */
const queryFunctions: Record<string, any> = {
    "get_players_in_team": getPlayersInTeam,
    "get_match_info": getMatchInfo,
    "get_matches_to_report": getMatchesToReport,
    "get_results_teams": getResultsTeams,
    "get_results_players": getResultsPlayers,
    "get_scores": getScores,
    "submit_match_result": submitMatchResult,
    "add_player": AddPlayer,
};

/**
 * Tätä reittiä käytetään tarjoamaan tietokannan spesifien kyselyiden 
 * (src/server/db/dbSpecific.ts) tuloksia.
 */
app.post('/api/db/specific_query', async (req, res) => {
    const queryName = req.body.queryName;
    const params = req.body.params || {};
    params._current_kausi = KULUVA_KAUSI;

    const queryFunction = queryFunctions[queryName];
    if (!queryName || !queryFunction)
        return res.status(400).send("Invalid or missing queryName.");
    try {
        const rows = await queryFunction(pool, params);
        res.json({ rows });
        console.log(`/api/db/specific_query (queryName=${queryName}) done`);
    } catch (error) {
        console.error('Error in /api/specific_query:', error);
        res.status(500).send(`Error: ${error}`);
    }
});

/**
 * Muissa reiteissä käytetään Reactin omaa reititystä.
 */
app.get('*', (_req, res) => {
    console.log("*:", _req.url);
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Käynnistetään express.js serveri:
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
