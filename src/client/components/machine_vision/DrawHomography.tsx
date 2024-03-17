/**
 * Komponentti, joka piirtää homografia-esimerkin.
 * HUOM! Ei käytössä tuotantoversiossa.
 */

import { useRef, useEffect } from 'react';

/**
 * Muodostaa ImageData olion annetun mustavalkoisen kuvan pohjalta.
 */
function rgbaFromGrayscale(imgData: any): ImageData {
    // Taulukko RGBA datalle
    const grayscaleData = new Uint8Array(Object.values(imgData.data));
    const rgbaData = new Uint8ClampedArray(imgData.cols*imgData.rows * 4);
    console.log(imgData.cols, imgData.rows);

    for (let i = 0; i < imgData.cols*imgData.rows; i++) {
        const value = grayscaleData[i];

        rgbaData[i*4 + 0] = value; // Red
        rgbaData[i*4 + 1] = value; // Green
        rgbaData[i*4 + 2] = value; // Blue
        rgbaData[i*4 + 3] = 255;   // Alpha
    }
    return new ImageData(rgbaData, imgData.cols);
}

/**
 * Komponentti, joka piirtää homografia-esimerkin.
 */
const Draw: React.FC<{ data: any }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        
        const rgbaImageData1 = rgbaFromGrayscale(data.image1);
        const rgbaImageData2 = rgbaFromGrayscale(data.image2);
        const rgbaImageDataWarped = rgbaFromGrayscale(data.warpedImage);
        canvas.width = data.image1.cols + data.image2.cols;
        canvas.height = Math.max(data.image1.rows, data.image2.rows) + data.warpedImage.rows;
        const secondImageoffsetX = data.image1.cols;
        ctx.putImageData(rgbaImageData1, 0, 0);
        ctx.putImageData(rgbaImageData2, secondImageoffsetX, 0);
        ctx.putImageData(rgbaImageDataWarped, 0, Math.max(data.image1.rows, data.image2.rows));


        for (let k = 0; k < Math.min(15, data.matches.length); k++) {
            console.log(data.matches[k]);
            const index1 = data.matches[k].index;
            const index2 = data.matches[k].matchIndex;
            const corner1 = data.corners1[index1];
            const corner2 = data.corners2[index2];
            console.log("pair", corner1, corner2);

            ctx.strokeStyle = 'red';
            ctx.beginPath();
            ctx.arc(corner1.x, corner1.y, 5, 0, 2*Math.PI);
            ctx.stroke();
            ctx.closePath();

            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            ctx.arc(secondImageoffsetX+corner2.x, corner2.y, 5, 0, 2*Math.PI);
            ctx.stroke();
            ctx.closePath();

            ctx.strokeStyle = 'white';
            ctx.beginPath();
            ctx.moveTo(corner1.x, corner1.y);
            ctx.lineTo(secondImageoffsetX+corner2.x, corner2.y);
            ctx.stroke();
        }

    }, [data]);
    
    return <canvas ref={canvasRef} />;
};

export default Draw;