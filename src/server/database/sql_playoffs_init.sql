DROP TRIGGER IF EXISTS trigger_update_tulokset_on_erat_insert;
DROP TRIGGER IF EXISTS trigger_update_tulokset_on_erat_update;
DROP TRIGGER IF EXISTS trigger_update_tulokset_on_erat_delete;
DROP TRIGGER IF EXISTS trigger_insert_peli_tulokset_on_peli_insert;
DROP TRIGGER IF EXISTS trigger_delete_peli_tulokset_on_peli_delete;
DROP TRIGGER IF EXISTS trigger_update_peli_tulokset_before_peli_update;
DROP TRIGGER IF EXISTS trigger_update_peli_tulokset_after_peli_update;
DROP TRIGGER IF EXISTS trigger_insert_ottelu_tulokset_on_ottelu_insert;
DROP TRIGGER IF EXISTS trigger_delete_ottelu_tulokset_on_ottelu_delete;
DROP TRIGGER IF EXISTS trigger_update_ottelu_tulokset_before_ottelu_update;
DROP TRIGGER IF EXISTS trigger_update_ottelu_tulokset_after_ottelu_update;
DROP TRIGGER IF EXISTS trigger_insert_pelaaja_tulokset_on_pelaaja_insert;
DROP TRIGGER IF EXISTS trigger_delete_pelaaja_tulokset_on_pelaaja_delete;
DROP TRIGGER IF EXISTS trigger_update_pelaaja_tulokset_before_pelaaja_update;
DROP TRIGGER IF EXISTS trigger_update_pelaaja_tulokset_after_pelaaja_update;
DROP TRIGGER IF EXISTS trigger_insert_joukkue_tulokset_on_joukkue_insert;
DROP TRIGGER IF EXISTS trigger_delete_joukkue_tulokset_on_joukkue_delete;
DROP TRIGGER IF EXISTS trigger_update_joukkue_tulokset_before_joukkue_update;
DROP TRIGGER IF EXISTS trigger_update_joukkue_tulokset_after_joukkue_update;

-- Create temporary table containing ids of teams advancing to playoffs
DROP TEMPORARY TABLE IF EXISTS playoff_teams;
CREATE TEMPORARY TABLE playoff_teams (team INT);
INSERT INTO playoff_teams VALUES (744),(733),(736),(738),(740),(741),(743),(735);

-- Create new ep_kausi for playoffs
INSERT INTO ep_kausi (vuosi, kausi, Laji)
VALUES (20, '2024-2025', 'p');

SET @new_kausi = LAST_INSERT_ID();

-- Create new ep_lohko for playoffs
INSERT INTO ep_lohko (kausi, tunnus, selite)
VALUES (@new_kausi, 'PP', 'Pudotuspelit 2024-2025');

SET @new_lohko = LAST_INSERT_ID();

-- Copy teams to playoff season
INSERT INTO ep_joukkue (lyhenne, nimi, kausi, lohko, ravintola, yhdhenk, yhdpuh, kapt, kpuh, varakapt, vkpuh)
SELECT lyhenne, nimi, @new_kausi, @new_lohko, ravintola, yhdhenk, yhdpuh, kapt, kpuh, varakapt, vkpuh
FROM ep_joukkue AS j
    JOIN playoff_teams AS t ON t.team = j.id;

-- Copy players to playoff season
INSERT INTO ep_pelaaja (nimi, joukkue, jasen, pelit, v_era, h_era, e_era, h_peli, e_peli, v_peli, sukupuoli)
SELECT p.nimi, j_new.id, p.jasen, 0, 0, 0, 0, 0, 0, 0, p.sukupuoli
FROM ep_pelaaja p
    JOIN ep_joukkue AS j_old ON p.joukkue = j_old.id
    JOIN ep_joukkue AS j_new ON j_old.lyhenne = j_new.lyhenne AND j_new.kausi = @new_kausi
    JOIN playoff_teams AS t ON t.team = j_old.id;

------------
-- ep_cup25
------------

-- Otteluparit ensimmäisellä kierroksella pudotuspeleissä
DROP TEMPORARY TABLE IF EXISTS playoff_team_pairs;
CREATE TEMPORARY TABLE playoff_team_pairs (koti INT, vieras INT);
INSERT INTO playoff_team_pairs
SELECT 
    MAX(CASE WHEN mod_row = 1 THEN team END) AS koti,
    MAX(CASE WHEN mod_row = 0 THEN team END) AS vieras
FROM (
    SELECT 
        team,
        @rownum := @rownum + 1 AS row_num,
        (@rownum % 2) AS mod_row
    FROM 
        playoff_teams, 
        (SELECT @rownum := 0) r
) numbered
GROUP BY FLOOR((row_num+1)/2);


DROP TABLE IF EXISTS `ep_cup25`;
CREATE TABLE `ep_cup25` (
    `id` INT(10) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    `puoli` VARCHAR(1) NOT NULL,
    `koti` VARCHAR(4) DEFAULT NULL,
    `vier` VARCHAR(4) DEFAULT NULL
) ENGINE=InnoDB;

INSERT INTO ep_cup25 (puoli, koti, vier)
SELECT 
    'A',
    j1.lyhenne, 
    j2.lyhenne
FROM playoff_team_pairs AS pairs
    JOIN ep_joukkue AS j1 ON j1.id = pairs.koti
    JOIN ep_joukkue AS j2 ON j2.id = pairs.vieras;

------------
-- ep_ottelu
------------

INSERT INTO ep_ottelu (lohko, paiva, koti, vieras, ktulos, vtulos, status)
SELECT @new_lohko, CURDATE(), j1.id, j2.id, 0, 0, 'T'
FROM ep_cup25 AS pp
    JOIN ep_joukkue AS j1 ON j1.kausi = @new_kausi AND j1.lyhenne = pp.koti
    JOIN ep_joukkue AS j2 ON j2.kausi = @new_kausi AND j2.lyhenne = pp.vier
WHERE pp.puoli = 'A';

INSERT INTO ep_ottelu (lohko, paiva, koti, vieras, ktulos, vtulos, status)
SELECT @new_lohko, CURDATE(), j2.id, j1.id, 0, 0, 'T'
FROM ep_cup25 AS pp
    JOIN ep_joukkue AS j1 ON j1.kausi = @new_kausi AND j1.lyhenne = pp.koti
    JOIN ep_joukkue AS j2 ON j2.kausi = @new_kausi AND j2.lyhenne = pp.vier
WHERE pp.puoli = 'A';