import { useEffect, useState } from 'react';
import Draw from './DrawHomography.js';
import { getApiUrl } from "../utils/apiUtils";
import { Link } from 'react-router-dom';

function Homography() {
    const [homography, setHomography] = useState<any>(null);

    const imgName1 = "box_half.png";
    const imgName2 = "box_in_scene.png";
    
    useEffect(() => {
        const fetchHomography = async () => {
            try {
                const apiUrl = `${getApiUrl()}/homography`;
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        imgName1: imgName1,
                        imgName2: imgName2,
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
        <>
        <Link to="/">Back</Link>
        {!!homography ? 
        (<div><p>{<Draw data={homography.data} />}</p>
        {/* <p>Result: {JSON.stringify(homography.data.image1)}</p> */}
        </div>) 
        : (<>"Fetching.."</>)}
        </>
    );
}
    
export default Homography;
    