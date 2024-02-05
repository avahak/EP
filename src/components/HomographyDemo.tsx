import { useEffect, useState } from 'react';
import Draw from './DrawHomography.js';

function Homography() {
    const [homography, setHomography] = useState<any>(null);

    const imgUrl1 = "./box_half.png";
    const imgUrl2 = "./box_in_scene.png";
    
    useEffect(() => {
        const fetchHomography = async () => {
            try {
                const response = await fetch('http://localhost:3001/homography', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        imgUrl1: imgUrl1,
                        imgUrl2: imgUrl2,
                    }),
                }); 
                const data = await response.json();
                setHomography(data);
                console.log("obtained data", data);
            } catch (error) {
                console.error('Error fetching homography:', error);
            }
        };      
        fetchHomography();
    }, []);

    return (
        !!homography ? 
        (<div><p>{<Draw data={homography.data} />}</p>
        <p>Result: {JSON.stringify(homography.data.image1)}</p>
        </div>) 
        : (<>"Nothing here"</>)
    );
}
    
export default Homography;
    