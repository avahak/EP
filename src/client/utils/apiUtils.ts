/**
* Apufunktio palvelimen osoitteen muodostamiseksi.
*/
const getApiUrl = () => {
    const port = window.location.hostname === 'localhost' ? ':3001' : '';
    return `${window.location.protocol}//${window.location.hostname}${port}/api`;
};

/**
 * Muuttaa esikatselukuvan nimen varsinaisen kuvan nimeksi poistamalle siitä
 * etu- ja jälkiliitteet.
 */
function thumbnailToImageName(thumbnailName: string) {
    // Regex, joka poistaa alusta "thumbnail_" ja lopusta viimeisen "." jälkeen tulevan osan.
    const regex = /^thumbnail_(.+)\.[a-zA-Z0-9]+$/;
    const match = thumbnailName.match(regex);
    
    if (match && match[1]) {
        return match[1];
    } else {
        // Regex ei osunut - palauta alkuperäinen nimi.
        return thumbnailName;
    }
}

export { getApiUrl, thumbnailToImageName };