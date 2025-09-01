-- Tietokantaan ajetut muutokset 28.4.2025

-- Kopioidaan pudotuspelikauden joukkueet
INSERT INTO ep_joukkue (lyhenne, nimi, kausi, lohko, ravintola, yhdhenk, yhdpuh, kapt, kpuh, varakapt, vkpuh)
SELECT lyhenne, nimi, 38, 118, ravintola, yhdhenk, yhdpuh, kapt, kpuh, varakapt, vkpuh
FROM ep_joukkue 
WHERE id IN (736, 740, 746, 741, 744, 739, 738, 733);

-- Kopioidaan pudotuspelikauden pelaajat
INSERT INTO ep_pelaaja (nimi, joukkue, jasen, pelit, v_era, h_era, e_era, h_peli, e_peli, v_peli, sukupuoli)
SELECT p.nimi, j_uusi.id, p.jasen, 0, 0, 0, 0, 0, 0, 0, p.sukupuoli
FROM ep_pelaaja AS p
    JOIN ep_joukkue AS j_vanha ON j_vanha.id = p.joukkue
    JOIN ep_joukkue AS j_uusi ON j_uusi.lyhenne = j_vanha.lyhenne AND j_uusi.kausi = 38
WHERE j_vanha.id IN (736, 740, 746, 741, 744, 739, 738, 733);

-- Päivitetään otteluiden joukkueet viittaamaan pudotuspelikauden joukkueita
UPDATE ep_ottelu AS o
    JOIN ep_joukkue AS vanha_koti ON vanha_koti.id = o.koti
    JOIN ep_joukkue AS vanha_vieras ON vanha_vieras.id = o.vieras
    JOIN ep_joukkue AS uusi_koti ON uusi_koti.lyhenne = vanha_koti.lyhenne AND uusi_koti.lohko = 118
    JOIN ep_joukkue AS uusi_vieras ON uusi_vieras.lyhenne = vanha_vieras.lyhenne AND uusi_vieras.lohko = 118
SET o.koti = uusi_koti.id, o.vieras = uusi_vieras.id
WHERE o.lohko = 118;