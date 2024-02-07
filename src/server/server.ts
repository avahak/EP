/**
 * Express backend for serving the React app, SQL queries, etc.
 */

import util from 'util';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { Homography } from './homography.js';
import { test } from './test.js';
import { HoughTransform } from './hough.js';
import multer from 'multer';
import { createThumbnail } from './imageTools.js';

dotenv.config();

// interface User extends RowDataPacket {
//     id: number;
//     email: string;
// }

const app = express();
const PORT = 3001;
const baseUploadDirectory = process.env.BASE_UPLOAD_DIRECTORY || "/home/userdata";
const imageDirectory = `${baseUploadDirectory}/images`;
const thumbnailDirectory = `${baseUploadDirectory}/images/thumbnails`;
const miscDirectory = `${baseUploadDirectory}/misc`;

const __dirname = process.cwd();

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from the 'public' directory
// app.use('public', express.static(path.join(__dirname, 'public')));

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Promisify fs.writeFile
const writeFileAsync = util.promisify(fs.writeFile);

// @ts-ignore
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// @ts-ignore
const poolEP = mysql.createPool({
    host: process.env.EP_DB_HOST,
    port: parseInt(process.env.EP_DB_PORT || '3306'),
    user: process.env.EP_DB_USER,
    password: process.env.EP_DB_PASSWORD,
    database: process.env.EP_DB_NAME
});

// app.get('/api/anecdotes', (_req: Request, res: Response) => {
//     try {
//         // Load anecdotes from data.json
//         const data = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8');
//         const anecdotes = JSON.parse(data);
//         res.json(anecdotes);
//     } catch (error: any) {
//         console.error('Error reading data.json:', error.message);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.get('/api/users', async (_req: Request, res: Response) => {
//     try {
//         const [rows] = await pool.query<User[]>('SELECT * FROM users');

//         const userListHtml = rows.map(user => {
//             return `<li>${user.id}: ${user.email}</li>`;
//         }).join('');

//         const html = `<ul>${userListHtml}</ul>`;
//         res.send(html);
//     } catch (error) {
//         console.error('Error executing query:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });

/**
 * Used to test homography calculations.
 */
app.post('/api/homography', async (req: Request, res: Response) => {
    const imgUrl1 = `./public/${req.body.imgUrl1}`;
    const imgUrl2 = `./public/${req.body.imgUrl2}`;
    console.log("imgUrl1", imgUrl1);
    console.log("imgUrl2", imgUrl2);
    const h = new Homography(imgUrl1, imgUrl2);

    const x = Math.random();

    console.time(`h.execute_${x}`);
    await h.execute();
    console.timeEnd(`h.execute_${x}`);

    console.log("h.data.matches.length", h.data.matches.length);
    res.json({"data": h.data});
});

// Does nothing
app.get("/api/opencv", async (_req: Request, _res: Response) => {
    test();
});

/**
 * Used to test Hough transform calculations.
 */
app.post("/api/hough",  async (req: Request, res: Response) => {
    console.log("req.body", req.body);
    const imgUrl = `./public/${req.body.imgUrl}`;
    console.log("imgUrl", imgUrl);
    const hough = await HoughTransform.hough(imgUrl);

    // Encode the images as base64 data URLs
    const image1 = `data:image/png;base64,${hough[0].toString('base64')}`;
    const image2 = `data:image/png;base64,${hough[1].toString('base64')}`;

    // Send the images as JSON in the response
    res.json({ images: [image1, image2] });
});

/**
 * Upload an image to the server. It creates a thumbnail of the image
 * and stores both the image and the thumbnail on the file system.
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    // Directory to save the file in:
    const imagePath = path.join(imageDirectory, file.originalname);
    const thumbnailPath = path.join(thumbnailDirectory, `thumbnail_${file.originalname}.jpeg`);
    const miscPath = path.join(miscDirectory, file.originalname);
    console.log("BASE_UPLOAD_DIRECTORY", process.env.BASE_UPLOAD_DIRECTORY);
    console.log("miscDirectory", miscDirectory);
    // Check if the target directory exists
    if (!fs.existsSync(imageDirectory) || !fs.existsSync(thumbnailDirectory) || !fs.existsSync(miscDirectory)) {
        const errorMessage = `Upload directory does not exist.`;
        console.error(errorMessage);
        res.status(500).send(errorMessage);
        return;
    }

    try {
        const thumbnailBuffer = await createThumbnail(file.buffer);
        if (thumbnailBuffer) {
            // File is an image
            await writeFileAsync(imagePath, file.buffer);
            await writeFileAsync(thumbnailPath, thumbnailBuffer);
        } else {
            // File is not an image
            await writeFileAsync(miscPath, file.buffer);
        }
        console.log(`File saved to: ${thumbnailBuffer ? imagePath : miscPath}`);
        res.status(200).send(`Received and saved: ${file.originalname}, size: ${file.size}`);
    } catch (error) {
        console.error('Error saving file or thumbnail:', error);
        res.status(500).send(`Error saving file or thumbnail: ${error}`);
    }
});

// List all thumbnails
app.get('/api/thumbnails', (_req, res) => {
    try {
        if (!fs.existsSync(thumbnailDirectory))
            throw Error("No thumbnail directory");
        // Read the contents of the thumbnails directory
        const thumbnailFiles = fs.readdirSync(thumbnailDirectory);
        res.json({ thumbnails: thumbnailFiles });
    } catch (error) {
        console.error('Error listing thumbnails:', error);
        res.status(500).send('Error listing thumbnails.');
    }
});

// Serve a file
const serveFile = (req: Request, res: Response, baseDirectory: string) => {
    const filename = req.params.filename;
    const filePath = path.join(baseDirectory, filename);
    try {
        // If the file exists, serve it:
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

// Serve images
app.get('/api/images/:filename', (req, res) => serveFile(req, res, imageDirectory));
// Serve thumbnails
app.get('/api/thumbnails/:filename', (req, res) => serveFile(req, res, thumbnailDirectory));
// Serve misc files
app.get('/api/misc/:filename', (req, res) => serveFile(req, res, miscDirectory));

/**
 * Queries the SQL database for a schema and serves it.
 */
app.get('/api/schema', async (_req, res) => {
    // res.json({ 
    //     DB_HOST: process.env.DB_HOST,
    //     DB_PORT: process.env.DB_PORT,
    //     DB_NAME: process.env.DB_NAME,
    //     EP_DB_HOST: process.env.EP_DB_HOST,
    //     EP_DB_PORT: process.env.EP_DB_PORT,
    //     EP_DB_NAME: process.env.EP_DB_NAME,
    // });

    try {
        const [rows] = await poolEP.query<any>('SHOW TABLES');

        res.json({ rows });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).send('Internal Server Error');
    }
});

// For any other routes, serve the React app
app.get('*', (_req, res) => {
    console.log("*:", _req.url);
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
