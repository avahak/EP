import { useRef, useEffect } from 'react';

function rgbaFromGrayscale(imgData: any): ImageData {
    // Create an array for RGBA data
    const grayscaleData = new Uint8Array(Object.values(imgData.data));
    const rgbaData = new Uint8ClampedArray(imgData.cols*imgData.rows * 4);
    console.log(imgData.cols, imgData.rows);

    // Replicate grayscale values into RGBA
    for (let i = 0; i < imgData.cols*imgData.rows; i++) {
        const value = grayscaleData[i];

        rgbaData[i*4 + 0] = value; // Red channel
        rgbaData[i*4 + 1] = value; // Green channel
        rgbaData[i*4 + 2] = value; // Blue channel
        rgbaData[i*4 + 3] = 255;   // Alpha channel (fully opaque)
    }
    return new ImageData(rgbaData, imgData.cols);
}

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


        // const img = new Image();
        // img.src = imgUrl;
        
        // img.onload = () => {
        //     // Set canvas size to match the image size
        //     canvas.width = img.width;
        //     canvas.height = img.height;
        //     console.log(`Image size: ${img.width} x ${img.height}`);
            
        //     // Draw the image
        //     ctx.drawImage(img, 0, 0, img.width, img.height);
            
            // Draw circles for each feature
            // features.forEach(feature => {
            //     ctx.beginPath();
            //     console.log(feature.x, feature.y);
            //     ctx.arc(feature.x, feature.y, 5, 0, 2*Math.PI);
            //     ctx.strokeStyle = 'red';
            //     ctx.stroke();
            //     ctx.closePath();
            // });
        // };