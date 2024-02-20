DELIMITER //

-- Lisää kt yhdellä jos era on kotivoitto ja vastaavasti vt yhdellä jos vierasvoitto:
DROP PROCEDURE IF EXISTS count_round_win //
CREATE PROCEDURE count_round_win(IN era VARCHAR(2), INOUT kt INT, INOUT vt INT)
BEGIN
    IF era IS NOT NULL THEN
        IF era REGEXP 'K[1-6]$' THEN
            SET kt = kt + 1;
        ELSEIF era != 'V0' THEN
            SET vt = vt + 1;
        END IF;
    END IF;
END //

-- Kutsutaan kun ep_erat lisätään rivi tai muutetaan riviä. 
-- Tämä päivittää ep_peli taulun kenttiä ktulos, vtulos.
DROP PROCEDURE IF EXISTS procedure_erat_to_peli //
CREATE PROCEDURE procedure_erat_to_peli(
    IN era1 INT,
    IN era2 INT,
    IN era3 INT,
    IN era4 INT,
    IN era5 INT,
    IN peli INT
)
BEGIN
    DECLARE new_ktulos INT DEFAULT 0;
    DECLARE new_vtulos INT DEFAULT 0;

    CALL count_round_win(era1, new_ktulos, new_vtulos);
    CALL count_round_win(era2, new_ktulos, new_vtulos);
    CALL count_round_win(era3, new_ktulos, new_vtulos);
    CALL count_round_win(era4, new_ktulos, new_vtulos);
    CALL count_round_win(era5, new_ktulos, new_vtulos);

    UPDATE ep_peli 
    SET 
        ktulos = new_ktulos, 
        vtulos = new_vtulos
    WHERE id = peli;
END //

-- Jos ep_erat lisätään rivi, päivitetään ep_peli taulun ktulos, vtulos:
DROP TRIGGER IF EXISTS trigger_erat_to_peli_insert_or_insert //
CREATE TRIGGER trigger_erat_to_peli_insert_or_insert
AFTER INSERT ON ep_erat
FOR EACH ROW
BEGIN
    CALL procedure_erat_to_peli(NEW.era1, NEW.era2, NEW.era3, NEW.era4, NEW.era5, NEW.peli);
END //

-- Jos ep_erat muutetaan riviä, päivitetään ep_peli taulun ktulos, vtulos:
DROP TRIGGER IF EXISTS trigger_erat_to_peli_insert_or_update //
CREATE TRIGGER trigger_erat_to_peli_insert_or_update
AFTER UPDATE ON ep_erat
FOR EACH ROW
BEGIN
    CALL procedure_erat_to_peli(NEW.era1, NEW.era2, NEW.era3, NEW.era4, NEW.era5, NEW.peli);
END //

-- Jos ep_erat rivi poistetaan, nollaa vastaavan pelin tulokset
DROP TRIGGER IF EXISTS trigger_erat_to_peli_delete //
CREATE TRIGGER trigger_erat_to_peli_delete
AFTER DELETE ON ep_erat
FOR EACH ROW
BEGIN
    UPDATE ep_peli 
    SET 
        ktulos = NULL, 
        vtulos = NULL
    WHERE id = OLD.peli;
END //

-- Jos ep_peli lisätään rivi, päivitetään ep_ottelu taulun ktulos, vtulos:
DROP TRIGGER IF EXISTS trigger_peli_to_ottelu_insert //
CREATE TRIGGER trigger_peli_to_ottelu_insert
AFTER INSERT ON ep_peli
FOR EACH ROW
BEGIN
    DECLARE add_ktulos INT DEFAULT IF(COALESCE(NEW.ktulos, 0) > COALESCE(NEW.vtulos, 0), 1, 0);
    DECLARE add_vtulos INT DEFAULT IF(COALESCE(NEW.vtulos, 0) > COALESCE(NEW.ktulos, 0), 1, 0);

    UPDATE ep_ottelu
    SET 
        ktulos = COALESCE(ktulos, 0) + add_ktulos, 
        vtulos = COALESCE(vtulos, 0) + add_vtulos
    WHERE id = NEW.ottelu;
END //

-- Jos ep_peli rivi poistetaan, päivitetään ep_ottelu taulun ktulos, vtulos:
DROP TRIGGER IF EXISTS trigger_peli_to_ottelu_delete //
CREATE TRIGGER trigger_peli_to_ottelu_delete
AFTER DELETE ON ep_peli
FOR EACH ROW
BEGIN
    DECLARE sub_ktulos INT DEFAULT IF(COALESCE(OLD.ktulos, 0) > COALESCE(OLD.vtulos, 0), 1, 0);
    DECLARE sub_vtulos INT DEFAULT IF(COALESCE(OLD.vtulos, 0) > COALESCE(OLD.ktulos, 0), 1, 0);

    UPDATE ep_ottelu
    SET 
        ktulos = COALESCE(ktulos, 0) - sub_ktulos, 
        vtulos = COALESCE(vtulos, 0) - sub_vtulos
    WHERE id = OLD.ottelu;
END //

-- Jos ep_peli muutetaan riviä, päivitetään ep_ottelu taulun ktulos, vtulos:
DROP TRIGGER IF EXISTS trigger_peli_to_ottelu_update //
CREATE TRIGGER trigger_peli_to_ottelu_update
AFTER UPDATE ON ep_peli
FOR EACH ROW
BEGIN
    DECLARE add_ktulos INT DEFAULT IF(COALESCE(NEW.ktulos, 0) > COALESCE(NEW.vtulos, 0), 1, 0);
    DECLARE add_vtulos INT DEFAULT IF(COALESCE(NEW.vtulos, 0) > COALESCE(NEW.ktulos, 0), 1, 0);
    DECLARE sub_ktulos INT DEFAULT IF(COALESCE(OLD.ktulos, 0) > COALESCE(OLD.vtulos, 0), 1, 0);
    DECLARE sub_vtulos INT DEFAULT IF(COALESCE(OLD.vtulos, 0) > COALESCE(OLD.ktulos, 0), 1, 0);

    UPDATE ep_ottelu
    SET 
        ktulos = COALESCE(ktulos, 0) - sub_ktulos, 
        vtulos = COALESCE(vtulos, 0) - sub_vtulos
    WHERE id = OLD.ottelu;

    UPDATE ep_ottelu
    SET 
        ktulos = COALESCE(ktulos, 0) + add_ktulos, 
        vtulos = COALESCE(vtulos, 0) + add_vtulos
    WHERE id = NEW.ottelu;
END //

-- ep_pelaaja toimenpiteet:

-- Toimenpide ep_pelaaja taulun muutoksille kun lisätään (operation_sign = +1) 
-- tai poistetaan (operation_sign = -1) ep_peli
DROP PROCEDURE IF EXISTS adjust_ep_pelaaja //
CREATE PROCEDURE adjust_ep_pelaaja(IN player_id INT, IN games_won INT, IN games_lost INT, IN operation_sign INT)
BEGIN
    DECLARE player_won INT DEFAULT IF(games_won > games_lost, 1, 0);

    UPDATE ep_pelaaja
    SET 
        v_era = COALESCE(v_era, 0) + operation_sign*games_won,
        h_era = COALESCE(h_era, 0) + operation_sign*games_lost,
        v_peli = COALESCE(v_peli, 0) + operation_sign*player_won,
        h_peli = COALESCE(h_peli, 0) + operation_sign*(1 - player_won),
        pelit = COALESCE(pelit, 0) + operation_sign
    WHERE id = player_id;
END //

-- Jos ep_peli rivi lisätään, päivitetään v_era ja h_era arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_pelaaja_insert //
CREATE TRIGGER trigger_peli_to_pelaaja_insert
AFTER INSERT ON ep_peli
FOR EACH ROW
BEGIN
    CALL adjust_ep_pelaaja(NEW.kp, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_pelaaja(NEW.vp, NEW.vtulos, NEW.ktulos, +1);
END //

-- Jos ep_peli rivi poistetaan, päivitetään v_era ja h_era arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_pelaaja_delete //
CREATE TRIGGER trigger_peli_to_pelaaja_delete
AFTER DELETE ON ep_peli
FOR EACH ROW
BEGIN
    CALL adjust_ep_pelaaja(OLD.kp, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_pelaaja(OLD.vp, OLD.vtulos, OLD.ktulos, -1);
END //

-- Jos ep_peli rivi päivitetään, päivitetään v_era ja h_era arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_pelaaja_update //
CREATE TRIGGER trigger_peli_to_pelaaja_update
AFTER UPDATE ON ep_peli
FOR EACH ROW
BEGIN
    CALL adjust_ep_pelaaja(OLD.kp, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_pelaaja(OLD.vp, OLD.vtulos, OLD.ktulos, -1);
    CALL adjust_ep_pelaaja(NEW.kp, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_pelaaja(NEW.vp, NEW.vtulos, NEW.ktulos, +1);
END //

-- ep_sarjat:
--     `id` smallint(6) NOT NULL DEFAULT '0',
--     `nimi` varchar(15) CHARACTER SET utf8 COLLATE utf8_swedish_ci DEFAULT NULL COMMENT 'kaudella nimi',
--     `joukkue` smallint(6) unsigned NOT NULL,
--     `lyhenne` text NOT NULL,
--     `lohko` tinyint(3) DEFAULT NULL,
--     `ottelu` smallint(4) NOT NULL DEFAULT '0',
--     `voitto` tinyint(4) NOT NULL DEFAULT '0',
--     `tappio` tinyint(4) NOT NULL DEFAULT '0',
--     `v_era` smallint(6) NOT NULL DEFAULT '0',
--     `h_era` smallint(6) NOT NULL DEFAULT '0',
--     `h_peli` smallint(6) NOT NULL DEFAULT '0',
--     `v_peli` smallint(6) NOT NULL DEFAULT '0',
-- Idea: laske v_era, h_era, v_peli, h_peli peli->sarjat triggerinä
-- ja ottelu, voitto, tappio ottelu->sarjat triggerinä

-- 
DROP PROCEDURE IF EXISTS adjust_ep_sarjat //
CREATE PROCEDURE adjust_ep_sarjat(IN sarjat_id INT, IN games_won INT, IN games_lost INT, IN operation_sign INT)
BEGIN
    DECLARE player_won INT DEFAULT IF(games_won > games_lost, 1, 0);

    UPDATE ep_sarjat
    SET 
        v_era = COALESCE(v_era, 0) + operation_sign*games_won,
        h_era = COALESCE(h_era, 0) + operation_sign*games_lost,
        v_peli = COALESCE(v_peli, 0) + operation_sign*player_won,
        h_peli = COALESCE(h_peli, 0) + operation_sign*(1 - player_won)
    WHERE id = sarjat_id;
END //

-- Hakee ep_sarjat.id mikä vastaa kotijoukkuetta ottelussa, missä id=ottelu_id:
DROP PROCEDURE IF EXISTS get_sarjat_home_id //
CREATE PROCEDURE get_sarjat_home_id(IN ottelu_id INT, OUT sarjat_away_id INT)
BEGIN
    SELECT s.id INTO sarjat_away_id 
    FROM ep_sarjat s
    JOIN ep_ottelu o ON o.koti = s.joukkue
    WHERE o.id = ottelu_id 
    LIMIT 1;
END //

-- Hakee ep_sarjat.id mikä vastaa vierasjoukkuetta ottelussa, missä id=ottelu_id:
DROP PROCEDURE IF EXISTS get_sarjat_away_id //
CREATE PROCEDURE get_sarjat_away_id(IN ottelu_id INT, OUT sarjat_away_id INT)
BEGIN
    SELECT s.id INTO sarjat_away_id 
    FROM ep_sarjat s
    JOIN ep_ottelu o ON o.vieras = s.joukkue
    WHERE o.id = ottelu_id 
    LIMIT 1;
END //

-- Jos ep_peli rivi lisätään, päivitetään v_era, h_era, v_peli, h_peli arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_sarjat_insert //
CREATE TRIGGER trigger_peli_to_sarjat_insert
AFTER INSERT ON ep_peli
FOR EACH ROW
BEGIN
    -- löydä sarjat id kotijoukkueelle ja vierasjoukkueelle:
    DECLARE sarjat_home_id INT;
    DECLARE sarjat_away_id INT;
    CALL get_sarjat_home_id(NEW.ottelu, my_sarjat_home_id);
    CALL get_sarjat_away_id(NEW.ottelu, my_sarjat_away_id);

    -- Päivitetään v_era, h_era, v_peli, h_peli:
    CALL adjust_ep_sarjat(sarjat_home_id, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_sarjat(sarjat_away_id, NEW.vtulos, NEW.ktulos, +1);
END //

-- Jos ep_peli rivi poistetaan, päivitetään v_era, h_era, v_peli, h_peli arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_sarjat_delete //
CREATE TRIGGER trigger_peli_to_sarjat_delete
AFTER DELETE ON ep_peli
FOR EACH ROW
BEGIN
    -- löydä sarjat id kotijoukkueelle ja vierasjoukkueelle:
    DECLARE sarjat_home_id INT;
    DECLARE sarjat_away_id INT;
    CALL get_sarjat_home_id(OLD.ottelu, my_sarjat_home_id);
    CALL get_sarjat_away_id(OLD.ottelu, my_sarjat_away_id);

    -- Päivitetään v_era, h_era, v_peli, h_peli:
    CALL adjust_ep_sarjat(sarjat_home_id, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_sarjat(sarjat_away_id, OLD.vtulos, OLD.ktulos, -1);
END //

-- Jos ep_peli rivi poistetaan, päivitetään v_era, h_era, v_peli, h_peli arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_sarjat_update //
CREATE TRIGGER trigger_peli_to_sarjat_update
AFTER UPDATE ON ep_peli
FOR EACH ROW
BEGIN
    -- löydä sarjat id kotijoukkueelle ja vierasjoukkueelle:
    DECLARE sarjat_old_home_id INT;
    DECLARE sarjat_old_away_id INT;
    DECLARE sarjat_new_home_id INT;
    DECLARE sarjat_new_away_id INT;
    CALL get_sarjat_home_id(OLD.ottelu, my_sarjat_old_home_id);
    CALL get_sarjat_away_id(OLD.ottelu, my_sarjat_old_away_id);
    CALL get_sarjat_home_id(NEW.ottelu, my_sarjat_new_home_id);
    CALL get_sarjat_away_id(NEW.ottelu, my_sarjat_new_away_id);

    -- Päivitetään v_era, h_era, v_peli, h_peli:
    CALL adjust_ep_sarjat(sarjat_old_home_id, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_sarjat(sarjat_old_away_id, OLD.vtulos, OLD.ktulos, -1);
    CALL adjust_ep_sarjat(sarjat_new_home_id, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_sarjat(sarjat_new_away_id, NEW.vtulos, NEW.ktulos, +1);
END //

-- TODO ottelu, voitto, tappio ottelu->sarjat triggerinä
-- vai voiko tämänkin tehdä peli->sarjat trigger mukana?

DELIMITER ;