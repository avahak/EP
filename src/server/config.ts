/**
 * Serverin käyttämiä vakioita.
 */

// Aikoja millisekunteina
const SECOND_MS = 1000;
const MINUTE_MS = 60*SECOND_MS;
const HOUR_MS = 60*MINUTE_MS;

/**
 * Aikaväli, jolla lähetetään dataa jos siinä on muutoksia.
 */
const BROADCAST_INTERVAL_MS = 5*SECOND_MS;
/**
 * Aikaväli, jolla lähetetään "heartbeat" yhteyksille pitämään ne elossa.
 */
const HEARTBEAT_INTERVAL_MS = 25*SECOND_MS;
/**
 * Aikaväli, jolla ajetaan siivoustoimenpiteitä.
 */
const MAINTENANCE_INTERVAL_MS = 15*MINUTE_MS;
/**
 * Maksimiaika live-ottelun seuraamiseen ilman uuden datan lähettämistä ennen tuhoamista.
 */
const MAX_LIVE_CONNECTION_INACTIVITY_MS = 4*HOUR_MS;
/**
 * Maksimiaika live-ottelun ilmoittamiseen. 
 */
const MAX_LIVE_MATCH_DURATION_MS = 9*HOUR_MS;
/**
 * Maksimiaika live tulosten ilmoittamisessa oleville päivittämisväleille.
 * Jos mitään muutoksia ei tule tässä ajassa, ottelu siivotaan pois.
 */
const MAX_LIVE_MATCH_INACTIVITY_MS = 4*HOUR_MS;

/**
 * Aika ennen kun lähetetään timeout.
 */
const RESPONSE_TIMEOUT_MS = 120*1000;
/**
 * Pyynnön käsittelyaika, jota pidemmistä kirjoitetaan varoitus lokitiedostoon.
 */
const RESPONSE_DELAYED_MS = 1000;

/**
 * Aikaväli jolla lasketaan event loop viivettä.
 */
const EVENT_LOOP_LAG_CHECK_INTERVAL_MS = 1000;
/**
 * Jos event loop viive ylittää tämän, kirjoitaan siitä lokitiedostoon.
 */
const EVENT_LOOP_LAG_LOG_THRESHOLD_MS = 1000;

export { RESPONSE_TIMEOUT_MS, RESPONSE_DELAYED_MS, 
    BROADCAST_INTERVAL_MS, HEARTBEAT_INTERVAL_MS, MAINTENANCE_INTERVAL_MS, 
    MAX_LIVE_CONNECTION_INACTIVITY_MS, MAX_LIVE_MATCH_DURATION_MS, MAX_LIVE_MATCH_INACTIVITY_MS,
    EVENT_LOOP_LAG_CHECK_INTERVAL_MS, EVENT_LOOP_LAG_LOG_THRESHOLD_MS };