/**
 * Voi käyttää ErrorMap arvojen tyyppinä.
 */
type ErrorDetails = {
    clientMessage: string;
    level: ErrorLevel;
    status: number;
};

/**
 * Virhekoodeja serverin ja clientin väliseen kommunikaatioon.
 */
const ErrorMap = {
    DEBUG_ERROR: {
        clientMessage: 'Debug virhe.',
        level: "error",
        status: 500
    },
    INVALID_INPUT: {
        clientMessage: 'Syöte ei kelpaa.',
        level: "info",
        status: 400
    },
    NOT_FOUND: {
        clientMessage: 'Resurssia ei löytynyt.',
        level: "info",
        status: 404
    },
    UNAUTHORIZED: {
        clientMessage: "Toiminto kielletty.",
        level: "error",
        status: 401
    },
    INTERNAL_SERVER_ERROR: {
        clientMessage: 'Serveri törmäsi virheeseen.',
        level: "error",
        status: 500
    },
    MATCH_SUBMIT_LOCKED: {
        clientMessage: "Ottelun ilmoitusta käsitellään.",
        level: "error",
        status: 500
    },
    DATA_MISMATCH: {
        clientMessage: "Syötteesi ei vastaa palvelimen odotuksia.",
        level: "warn",
        status: 409
    },
} as const;

/**
 * Virhekoodi tyyppinä.
 */
type ErrorCode = keyof typeof ErrorMap;

/**
 * Logger leveli virheelle.
 */
type ErrorLevel = "info" | "warn" | "error";

/**
 * Error, missä ErrorDetail lisäksi on mahdollista lisätietoa clientille
 * ja lokitiedostoon.
 */
class CustomError extends Error {
    code: ErrorCode;
    details: ErrorDetails;
    info?: Record<string, any>;                 // Välitetään clientille
    logAdditionalInfo?: Record<string, any>;    // lokiin kirjoitetaan info ja tämä

    constructor(
        code: ErrorCode,
        info?: Record<string, any>,
        logAdditionalInfo?: Record<string, any>,
    ) {
        super(ErrorMap[code].clientMessage);
        this.code = code;
        this.details = ErrorMap[code];
        this.info = info;
        this.logAdditionalInfo = logAdditionalInfo;
        Object.setPrototypeOf(this, new.target.prototype); // Required for extending built-in Error
    }
}

export type { ErrorLevel, ErrorDetails, ErrorCode };
export { ErrorMap, CustomError };