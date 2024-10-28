/**
 * Seuraa viivettä event loopissa.
 * Mukautettu kirjastosta https://www.npmjs.com/package/event-loop-lag
 */

import { EVENT_LOOP_LAG_CHECK_INTERVAL_MS, EVENT_LOOP_LAG_LOG_THRESHOLD_MS } from "./config";
import { logger } from "./logger";

let lastCallTime: number | undefined = undefined;

function check() {
    const now = Date.now();
    if (lastCallTime) {
        const diff = now - lastCallTime;
        const lag = diff - EVENT_LOOP_LAG_CHECK_INTERVAL_MS;

        if (lag > EVENT_LOOP_LAG_LOG_THRESHOLD_MS)
            logger.warn("High event loop lag", { lag: `${(lag/1000).toFixed(1)}s` });
    }

    lastCallTime = now;
    setTimeout(check, EVENT_LOOP_LAG_CHECK_INTERVAL_MS).unref();
}

setTimeout(check, EVENT_LOOP_LAG_CHECK_INTERVAL_MS).unref();