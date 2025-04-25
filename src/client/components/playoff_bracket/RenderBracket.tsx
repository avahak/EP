/**
 * Käytetään .css tyylitiedostoa CSS Module muodossa, jotta tyylit eivät tulisi voimaan 
 * globaalisti.
 * 
 * TODO siirrä desc Match laatikon ulkopuolelle, jotta se ei vaikuta laatikon kokoon
 */
import styles from './Bracket.module.css';
import { Box, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDebounce } from '../../../shared/generalUtils';
import { getWinnerAndLoser, MatchInfo } from './common';

/**
 * Tyyppi kaavion laatikoita yhdistäville viivoille.
 */
type Connector = {
    x0: number;         // x-coord vertikaaliselle linjalle
    y1Left: number;     // y-coord 1. vasemmalle piikille
    y2Left: number;     // y-coord 2. vasemmalle piikille
    yRight: number;     // y-coord oikealle piikille
};

/**
 * Palauttaa css-tyylimerkkijonon kyseiselle ottelun joukkueelle.
 */
function getOutcomeClass(matchInfo: MatchInfo, teamNumber: 0|1): string {
    const winnerAndLoser = getWinnerAndLoser(matchInfo);
    const team = teamNumber === 0 ? matchInfo.teamOne : matchInfo.teamTwo;
    if (team.name === winnerAndLoser.winner)
        return styles.winner;
    if (team.name === winnerAndLoser.loser)
        return styles.loser;
    return '';
}

const textColor = (s: string) => {
    return s === '_TBD_' ? 'text.secondary' : 'text.primary';
};

const textWeight = (s: string) => {
    return s === '_TBD_' ? 'light' : 'bold';
}

/**
 * Match vastaa yhtä ottelukaavion laatikkoa. Siinä on kaksi joukkuetta ja niiden tulokset.
 * Tilanteen mukaan lisätään otteluiden päivämäärät ja kuvaus (desc).
 */
const Match: React.FC<{ matchInfo: MatchInfo }> = ({ matchInfo }) => (
    <Box className={styles.matchOutside}>
        {(matchInfo.matchesPlayed !== 0 || matchInfo.desc) && 
        <Box className={styles.description}>
            <Typography variant='body2'>
                {matchInfo.desc === '_TBD_' ? '' : <>{matchInfo.desc}<br /></>}
                {matchInfo.dates}
                {/* ({matchInfo?.matchesPlayed}) */}
            </Typography>
        </Box>
        }
        <Box className={styles.match}>
            <Table size='small' className={styles.matchTable} sx={{borderCollapse: 'collapse'}}>
                <TableBody>
                    <TableRow className={`${styles.team} ${styles.bbottom} ${getOutcomeClass(matchInfo, 0)}`}>
                        <TableCell className={`${styles.cell}`}>
                            <Typography variant='body1' textAlign='center' color={textColor(matchInfo.teamOne.name)} fontWeight={textWeight(matchInfo.teamOne.name)}>
                                {matchInfo?.teamOne.name == '_TBD_' ? 'TBD' : matchInfo.teamOne.name}
                            </Typography>
                        </TableCell>
                        {((matchInfo.matchesPlayed ?? 0) > 0) &&
                        <TableCell className={`${styles.cell} ${styles.bleft}`}>
                            <Typography variant='body2' textAlign='center'>
                                {matchInfo?.teamOne.gameWins} ({matchInfo?.teamOne.roundWins})
                            </Typography>
                        </TableCell>}
                    </TableRow>
                    <TableRow className={`${styles.team} ${getOutcomeClass(matchInfo, 1)}`}>
                        <TableCell className={`${styles.cell}`}>
                            <Typography variant='body1' textAlign='center' color={textColor(matchInfo.teamTwo.name)} fontWeight={textWeight(matchInfo.teamTwo.name)}>
                                {matchInfo?.teamTwo.name == '_TBD_' ? 'TBD' : matchInfo.teamTwo.name}
                            </Typography>
                        </TableCell>
                        {((matchInfo.matchesPlayed ?? 0) > 0) &&
                        <TableCell className={`${styles.cell} ${styles.bleft}`}>
                            <Typography variant='body2' textAlign='center'>
                                {matchInfo?.teamTwo.gameWins} ({matchInfo?.teamTwo.roundWins})
                            </Typography>
                        </TableCell>}
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
    </Box>
);

/**
 * Laskee yhdysviivat (Connector[]) kaaviolle laatikoiden koordinaattien perusteella.
 */
function getConnectors(rounds: MatchInfo[][], rectMap: Map<string, DOMRect>) {
    const connectors: Connector[] = []
    const rect0 = rectMap.has(`0`) ? rectMap.get(`0`) : null;   // 0 on koko kaavion laatikko
    for (let rIdx = 1; rIdx < rounds.length; rIdx++) {
        const round = rounds[rIdx];
        for (let mIdx = 0; mIdx < round.length; mIdx++) {
            const m1 = 2*mIdx;
            const m2 = 2*mIdx + 1;
            const rect = rectMap.has(`${rIdx},${mIdx}`) ? rectMap.get(`${rIdx},${mIdx}`) : null;
            const rect1 = rectMap.has(`${rIdx-1},${m1}`) ? rectMap.get(`${rIdx-1},${m1}`) : null;
            const rect2 = rectMap.has(`${rIdx-1},${m2}`) ? rectMap.get(`${rIdx-1},${m2}`) : null;
            if (!rect0 || !rect || !rect1 || !rect2)
                continue;
            const connector = {
                x0: (Math.max(rect1.right, rect2.right) + rect.left) / 2 - rect0.left,
                y1Left: (rect1.top + rect1.bottom) / 2 - rect0.top,
                y2Left: (rect2.top + rect2.bottom) / 2 - rect0.top,
                yRight: (rect.top + rect.bottom) / 2 - rect0.top,
            };
            connectors.push(connector);
        }
    }
    return connectors;
}

/**
 * Komponentti pudotuspelikaaviolle. Kaavion laatikoita yhdistävät viivat (Connector)
 * pitää laskea dynaamisesti koska selain päättää laatikoiden sijainnit ja niitä ei tiedetä
 * etukäteen. Tämä monimutkaistaa logiikkaa. Yhdysviivat lasketaan viiveellä (debounce)
 * ja ne piirretään SVG elementteinä.
 */
const RenderPlayoffBracket: React.FC<{ rounds: MatchInfo[][] }> = ({ rounds }) => {
    const matchRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const bracketRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [connectors, setConnectors] = useState<Connector[]>([]);
    
    const getRectMap = () => {
        const rectMap = new Map<string, DOMRect>();

        // Tarkista että jokaisella ottelulla on ref
        const allRefsPresent = bracketRef.current && rounds.every((round, rIdx) => 
            round.every((_, mIdx) => matchRefs.current.has(`${rIdx},${mIdx}`))
        );
        if (!allRefsPresent) {
            console.warn('Not all refs are ready!');
            return rectMap;
        }

        rectMap.set('0', bracketRef.current.getBoundingClientRect());
        for (const [key, el] of matchRefs.current) {
            const rect = el.getBoundingClientRect();
            rectMap.set(key, rect);
        }

        return rectMap;
    };

    // Lasketaan yhdysviivojen paikat uudelleen viiveellä (debounce)
    const debouncedRecalculate = useDebounce(() => {
        setConnectors(getConnectors(rounds, getRectMap()));
    }, 200);

    useEffect(() => {
        console.log('useEffect');
        setIsMounted(true);
        return () => {
            setIsMounted(false);
            matchRefs.current.clear();
        };
    }, []);

    useLayoutEffect(() => {
        console.log('useLayoutEffect');
        if (!isMounted || !bracketRef.current) 
            return;

        // Verify all expected matches have refs
        const allRefsPresent = rounds.every((round, rIdx) => 
            round.every((_, mIdx) => 
                matchRefs.current.has(`${rIdx},${mIdx}`)
            )
        );

        if (!allRefsPresent) {
            console.warn('Not all refs are ready');
            return;
        }

        debouncedRecalculate();

        // Resize observer
        const observer = new ResizeObserver(debouncedRecalculate);
        observer.observe(bracketRef.current);
        return () => {
            debouncedRecalculate.cancel();
            observer.disconnect();
        }

    }, [rounds, isMounted]);

    useEffect(() => {
        const container = bracketRef.current;
        if (!container)
            return;
        container.addEventListener("scroll", debouncedRecalculate);
        return () => {
            container.removeEventListener("scroll", debouncedRecalculate);
        };
    }, [isMounted]);

    console.log('DEBUG: RenderPlayoffBracket render', Math.random());
    const XGAP = 0.8 * 50;        
    // HUOM! Tässä 2. numero pitäisi olla sama kuin ".bracket gap" .css tiedostossa.
    // TODO tässä voisi käyttää css muuttujaa `--gap: 50px;` ja sitten Reactin 
    // `const gap = getComputedStyle(ref.current!).getPropertyValue('--gap');`

    return (<>
        <Box className={styles.bracket} ref={bracketRef}>
            {rounds.map((round, roundIndex) => (
                <Box key={roundIndex} className={styles.roundColumn}>
                    {roundIndex === rounds.length-1 && <div></div>}   {/* Pronssiottelun takia */}
                    {round.map((matchInfo, matchIndex) => (
                        <div
                            key={`${roundIndex},${matchIndex}`}
                            ref={(el) => {
                                const key = `${roundIndex},${matchIndex}`;
                                if (el)
                                    matchRefs.current.set(key, el);
                                else
                                    matchRefs.current.delete(key);  // Ajetaan kun unmount!
                            }}
                        >
                            <Match 
                                key={matchIndex}
                                matchInfo={matchInfo}
                            />
                        </div>
                    ))}
                </Box>
            ))}

            <svg className="connectors" 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    transform: `translate(${(bracketRef.current?.scrollLeft ?? 0)}px, 0)`,
                    // willChange: 'transform',
                }}
            >
                {connectors.map((conn, i) => (
                    <g key={`conn-${i}`}>
                        <path
                            d={`
                                M${conn.x0} ${Math.min(conn.y1Left, conn.y2Left, conn.yRight)} 
                                L${conn.x0} ${Math.max(conn.y1Left, conn.y2Left, conn.yRight)}

                                M${conn.x0-XGAP/2} ${conn.y1Left} 
                                L${conn.x0} ${conn.y1Left}

                                M${conn.x0} ${conn.y2Left} 
                                L${conn.x0-XGAP/2} ${conn.y2Left}

                                M${conn.x0} ${conn.yRight} 
                                L${conn.x0+XGAP/2} ${conn.yRight} 
                            `}
                            stroke="black"
                            strokeWidth={2}
                        />
                    </g>
                ))}
            </svg>
        </Box>
        </>
    );
};

export { RenderPlayoffBracket };