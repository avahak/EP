import { useEffect, useState } from 'react';
import Draw from './DrawHomography.js';
import { getApiUrl } from "../utils/apiUtils";
import { Link } from 'react-router-dom';

/**
 * Sivu homografian esittelemiseen. Palvelin laskee homografian kahden kuvan 
 * välille ja esittää sen graafisesti. Tässä käytetään OpenCV esimerkkikuvia
 * https://docs.opencv.org/3.4/d1/de0/tutorial_py_feature_homography.html
 * mutta ei OpenCV:tä.
 */
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
        <br />
        Tyypillisesti kuvien sovittaminen toisiinsa (kuten täytetyn
        pöytäkirjan sovittaminen pöytäkirjan malliin) tehdään
        löytämällä niistä <Link to="https://en.wikipedia.org/wiki/Feature_(computer_vision)">piirteitä</Link> ja
        yhdistämällä kahden kuvan toisiansa vastaavat piirteet. Kun vastaavat
        piirteet (tai todennäköiset sellaiset) on löydetty, kuvat voi 
        palauttaa toisiinsa <Link to="https://en.wikipedia.org/wiki/Homography_(computer_vision)">homografialla</Link>.
        Alla on esimerkki tästä (kuvat on OpenCV vastaavasta esimerkistä).
        Parhaiten toisiansa vastaavat piirteet on ympyröity ja yhdistetty viivalla.
        Alimmainen kuva on "suoristettu" oikealla olevasta vastaamaan vasemmalla
        olevaa mallia.
        <br />
        Tarkoitukseni oli käyttää tätä tekniikkaa "suoristamaan" täytetty pöytäkirja niin,
        että sen kenttien sijainnit voidaan laskea homografian avulla. Suoristettu kuva
        on parempi tekstin tunnistusta varten ja sen teksti voidaan tulkita kun 
        tiedetään missä kentässä se sijaitsee pöytäkirjassa. Tässä lähestymistavassa
        on se heikkous, että pöytäkirjassa tärkeimmät piirteet ovat 
        viivojen leikkaukset ja teknisistä syistä (piirteet pohjautuvat osittain
        gradienttien vertaamiseen ja viivoilla gradientit ovat liian vahvat) nämä eivät sovi kovin hyvin
        tähän tarkoitukseen mutta en ole ihan varma tästä. 
        <br />
        {!!homography ? 
        (<div><p>{<Draw data={homography.data} />}</p>
        {/* <p>Result: {JSON.stringify(homography.data.image1)}</p> */}
        </div>) 
        : (<>"Fetching.."</>)}
        </>
    );
}
    
export default Homography;
    