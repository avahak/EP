import express, { Request, Response } from 'express';
import path from 'path';
// import fs from 'fs';
import cors from 'cors';
// import mysql, { RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';
import { Homography } from './homography.js';
import { test } from './test.js';
import { HoughTransform } from './hough.js';

// interface User extends RowDataPacket {
//     id: number;
//     email: string;
// }

const app = express();
const PORT = 3001;

const __dirname = process.cwd();

dotenv.config();

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from the 'public' directory
// app.use('public', express.static(path.join(__dirname, 'public')));

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());

// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     port: parseInt(process.env.DB_PORT || '3306', 10),
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
// });

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

// app.get('/users', async (_req: Request, res: Response) => {
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

app.post('/homography', async (req: Request, res: Response) => {
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

app.get("/opencv", async (_req: Request, _res: Response) => {
    test();
});

app.post("/hough",  async (req: Request, res: Response) => {
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

// For any other routes, serve the React app
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
