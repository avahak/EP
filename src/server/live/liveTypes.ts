/**
 * Typescript tyyppejä live-otteluille.
 */

import { ScoresheetFields } from "../../shared/scoresheetTypes";

/**
 * Nämä tiedot talletetaan kustakin seurattavasta live-ottelusta.
 */
type LiveMatch = {
    startTime: number;
    score: number[];
    lastUpdateTime: number;
    // lastAuthor: string;
    version: number;
    data: ScoresheetFields;
};

export type { LiveMatch };