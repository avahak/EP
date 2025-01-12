/**
 * Apufunktioita palvelimelle tehtävien API-kutsujen tekemiseen.
 */

import { AuthenticationState } from '../contexts/AuthenticationContext';

/**
 * Apufunktio API-kutsujen tekemiseen palvelimelle. Käyttää annettua access tokenia.
 */
const serverFetchWithAccessToken = async (route: string, options: any = {}, accessToken: string|null) => {
    const headers = { ...(options.headers ?? {}), ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}) };
    return fetch(`${getBackendUrl()}${route}`, { ...options, headers });
}

/**
 * Apufunktio API-kutsujen tekemiseen palvelimelle. 
 * Hoitaa uuden access tokenin hakemisen jos se on tarpeen.
 */
const serverFetch = async (route: string, options: any = {}, authenticationState: AuthenticationState|null) => {
    let accessTokenRenewed = false;

    // If no authentication is provided, proceed with no access token
    if (!authenticationState || !authenticationState.isAuthenticated)
        return serverFetchWithAccessToken(route, options, null);

    let accessToken: string|null = window.localStorage.getItem('accessToken');
    // console.log("accessToken from localstorage:", accessToken);

    if (!accessToken) {
        // No access token in local storage, try to renew it
        accessToken = await authenticationState.renewAccessToken();
        accessTokenRenewed = true;
        if (!accessToken)
            accessToken = null;
        // console.log("accessToken was empty so try to renew it:", accessToken);
    }
    
    let response = await serverFetchWithAccessToken(route, options, accessToken);

    // console.log("response", response);
    // console.log("response.status", response.status);
    // console.log("accessTokenRenewed", accessTokenRenewed);
    // console.log("response.headers.get('X-Token-Expired')", response.headers.get('X-Token-Expired'));

    if (!accessTokenRenewed && response.status === 401 && response.headers.get('X-Token-Expired') === 'true') {
        // Access token was expired, and we didn't try to renew it yet - try to renew it
        accessToken = await authenticationState.renewAccessToken();
        accessTokenRenewed = true;
        // console.log("401 with X-Token-Expired so try to renew access token", accessToken);
        if (accessToken)
            response = await serverFetchWithAccessToken(route, options, accessToken);
    }
    
    return response;
};

/**
 * Apufunktio palvelimen osoitteen muodostamiseksi.
 */
const getBackendUrl = () => {
    const port = window.location.hostname === 'localhost' ? ':3001' : '';
    return `${window.location.protocol}//${window.location.hostname}${port}/node`;
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

export { getBackendUrl, thumbnailToImageName, serverFetch };