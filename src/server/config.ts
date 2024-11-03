/**
 * Serverin käyttämiä vakioita.
 */

// Aikoja millisekunteina
const SECOND_MS = 1000;
const MINUTE_MS = 60*SECOND_MS;
const HOUR_MS = 60*MINUTE_MS;

/**
 * Aikaväli, jolla lähetetään live-ottelu dataa jos siinä on muutoksia.
 */
const BROADCAST_INTERVAL_MS = 5*SECOND_MS;
/**
 * Aikaväli, jolla lähetetään "heartbeat" live-yhteyksille pitämään ne elossa.
 */
const HEARTBEAT_INTERVAL_MS = 25*SECOND_MS;
/**
 * Aikaväli, jolla ajetaan siivoustoimenpiteitä live-otteluille ja yhteyksille.
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
 * Maksimiaika live-tulosten ilmoittamisessa oleville päivittämisväleille.
 * Jos mitään muutoksia ei tule tässä ajassa, ottelu siivotaan pois.
 */
const MAX_LIVE_MATCH_INACTIVITY_MS = 4*HOUR_MS;

/**
 * Pyynnön käsittelyaika ennen kun lähetetään timeout.
 */
const RESPONSE_TIMEOUT_MS = 120*SECOND_MS;
/**
 * Pyynnön käsittelyaika, jota pidemmistä kirjoitetaan varoitus lokitiedostoon.
 */
const RESPONSE_DELAYED_MS = 1*SECOND_MS;

/**
 * Aikaväli jolla lasketaan event loop viivettä.
 */
const EVENT_LOOP_LAG_CHECK_INTERVAL_MS = 1*SECOND_MS;
/**
 * Jos event loop viive ylittää tämän, kirjoitaan siitä lokitiedostoon.
 */
const EVENT_LOOP_LAG_LOG_THRESHOLD_MS = 1*SECOND_MS;

export { RESPONSE_TIMEOUT_MS, RESPONSE_DELAYED_MS, 
    BROADCAST_INTERVAL_MS, HEARTBEAT_INTERVAL_MS, MAINTENANCE_INTERVAL_MS, 
    MAX_LIVE_CONNECTION_INACTIVITY_MS, MAX_LIVE_MATCH_DURATION_MS, MAX_LIVE_MATCH_INACTIVITY_MS,
    EVENT_LOOP_LAG_CHECK_INTERVAL_MS, EVENT_LOOP_LAG_LOG_THRESHOLD_MS };