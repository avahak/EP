/**
 * Apufunktioita palvelimelle tehtävien API-kutsujen tekemiseen.
 */

import { useCallback, useEffect, useState } from 'react';
import { AuthenticationState } from '../contexts/AuthenticationContext';

type Method = "GET" | "POST";

/**
 * Tyyppi funktion useInitialServerFetch palauttalle vastaukselle.
 */
type InitialServerFetchResponse = {
    status: {
        ok: boolean;
        message?: any;
    };
    data: any;
};

type UseInitialServerFetchProps = {
    route: string;
    method?: Method;
    params?: any;
    dataProcessor?: (data: any) => any;     // Jälkikäsittelee haettua dataa
    authenticationState: AuthenticationState | null;
};

/**
 * Hakee dataa palvelimelta vain sivun lataamisen yhteydessä. Tämän on tarkoitus
 * tehdä API-kutsun luomisen palvelimelle helpommaksi kun se tehdään vain kerran 
 * sivun alustamisen yhteydessä.
 * 
 * TODO! Tämä ei välttämättä toimisi etusivulla kun authenticationState ei ole alustettu,
 * pitäisi testata.
 */
const useInitialServerFetch = ({ route, method, params, dataProcessor, authenticationState }: UseInitialServerFetchProps) => {
    const [response, setResponse] = useState<InitialServerFetchResponse>({
        status: { ok: false, message: "Ladataan.." },
        data: null
    });

    const fetchData = useCallback(async () => {
        try {
            // Haetaan uusi access token jos tarpeen:
            let accessToken = "";
            if (authenticationState && authenticationState.isAuthenticated) {
                accessToken = (await authenticationState.getAccessToken()) ?? "";
                if (!accessToken)
                    throw new Error("No access token.");
            } 
            let apiUrl = `${getBackendUrl()}${route}`;
            let fetchResponse;
            if (method == "GET") {
                if (!!params) {
                    const searchParams = new URLSearchParams(params);
                    apiUrl = `${apiUrl}?${searchParams.toString()}`;
                }
                fetchResponse = await fetch(apiUrl, {
                    method: "GET",
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });
            } else {
                fetchResponse = await fetch(apiUrl, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
                    body: !!params ? JSON.stringify({ ...params }) : "",
                });
            }

            if (!fetchResponse.ok) 
                throw new Error(`HTTP error! Status: ${fetchResponse.status}`);

            const jsonData = await fetchResponse.json();
            const processedData = dataProcessor ? dataProcessor(jsonData) : jsonData;
            setResponse({ status: { ok: true }, data: processedData });
        } catch (error) {
            console.error("Error fetching data", error);
            setResponse({ status: { ok: false, message: "Error fetching data" }, data: null });
        }
    }, [authenticationState]);
    // [route, method, JSON.stringify(params)]);
    // HUOM! Tässä JSON.stringify(params) on tehoton mutta toimiva tapa selvittää 
    // onko muutoksia tapahtunut.

    useEffect(() => {
        fetchData();
    }, [fetchData, authenticationState]);

    return response;
};


/**
 * Apufunktio API-kutsujen tekemiseen palvelimelle. Hoitaa uuden access tokenin 
 * hakemisen jos se on tarpeen.
 */
const serverFetch = async (route: string, options: any = {}, authenticationState: AuthenticationState | null) => {
    let accessToken = "";
    if (authenticationState && authenticationState.isAuthenticated) {
        accessToken = (await authenticationState.getAccessToken()) ?? "";
        if (!accessToken)
            throw new Error("No access token.");
    } 
    const headers = { ...(options.headers ?? {}), 'Authorization': `Bearer ${accessToken}` };
    return fetch(`${getBackendUrl()}${route}`, { ...options, headers });
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

export { getBackendUrl, thumbnailToImageName, useInitialServerFetch, serverFetch };