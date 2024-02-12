import { useRef, useEffect } from 'react';

/**
 * Ei käytössä
 */
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
