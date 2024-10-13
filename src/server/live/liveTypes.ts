/**
 * Typescript tyyppejä live-otteluille.
 */

import { Response } from 'express';
import { ScoresheetFields } from "../../shared/scoresheetTypes";

/**
 * Tyyppi ottelun seuraamiseen käytettävälle yhteydelle.
 */
type LiveConnection = {
    lastActivity: number;
    matchId: number | undefined;
    res: Response;           // yhteys clientiin, tähän kirjoitetaan päivityksiä
};

/**
 * Nämä tiedot talletetaan kustakin seurattavasta live-ottelusta.
 */
type LiveMatch = {
    startTime: number;
    score: number[];
    lastUpdate: number;
    // lastAuthor: string;
    version: number;
    data: ScoresheetFields;
};

export type { LiveConnection, LiveMatch };