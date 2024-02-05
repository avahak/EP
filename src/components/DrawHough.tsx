import { useRef, useEffect } from 'react';

// Not used atm.

// function rgbaFromGrayscale(imgData: any): ImageData {
//     // Create an array for RGBA data
//     const grayscaleData = new Uint8Array(Object.values(imgData.data));
//     const rgbaData = new Uint8ClampedArray(imgData.cols*imgData.rows * 4);
//     console.log(imgData.cols, imgData.rows);

//     // Replicate grayscale values into RGBA
//     for (let i = 0; i < imgData.cols*imgData.rows; i++) {
//         const value = grayscaleData[i];

//         rgbaData[i*4 + 0] = value; // Red channel
//         rgbaData[i*4 + 1] = value; // Green channel
//         rgbaData[i*4 + 2] = value; // Blue channel
//         rgbaData[i*4 + 3] = 255;   // Alpha channel (fully opaque)
//     }
//     return new ImageData(rgbaData, imgData.cols);
// }

const Draw: React.FC<{ data: any }> = ({ data }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
    useEffect(() => {
        // const canvas = canvasRef.current!;
        // const ctx = canvas.getContext('2d')!;
        
        // const rgbaImageData = rgbaFromGrayscale(data.image);
        // ctx.putImageData(rgbaImageData, 0, 0);

    }, [data]);
    
    return <canvas ref={canvasRef} />;
};

export default Draw;
