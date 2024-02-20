-- Herättimiä (trigger), jotka automaattisesti päivittävät seuraavia kenttiä kun 
-- erien tuloksia kirjataan tai muutetaan tai poistetaan:

-- ep_peli: ktulos, vtulos
-- ep_ottelu: ktulos, vtulos
-- ep_pelaaja: v_era, h_era, v_peli, h_peli, pelit
-- ep_sarjat: v_era, h_era, v_peli, h_peli, ottelu, voitto, tappio

-- Herättimiä laukea järjestyksessä: 
--      ep_erat -> ep_peli
--      ep_peli -> ep_ottelu,
--      ep_peli -> ep_pelaaja
--      ep_peli -> ep_sarjat
--      ep_ottelu -> ep_sarjat

-- NOTE herättimet voisi nimetä tyyliin "trigger_insert_on_peli_modify_ottelu".

DELIMITER //

-- ep_peli päivitys:

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
DROP TRIGGER IF EXISTS trigger_erat_to_peli_insert //
CREATE TRIGGER trigger_erat_to_peli_insert
BEFORE INSERT ON ep_erat
FOR EACH ROW
BEGIN
    CALL procedure_erat_to_peli(NEW.era1, NEW.era2, NEW.era3, NEW.era4, NEW.era5, NEW.peli);
END //

-- Jos ep_erat muutetaan riviä, päivitetään ep_peli taulun ktulos, vtulos:
DROP TRIGGER IF EXISTS trigger_erat_to_peli_update //
CREATE TRIGGER trigger_erat_to_peli_update
BEFORE UPDATE ON ep_erat
FOR EACH ROW
BEGIN
    CALL procedure_erat_to_peli(NEW.era1, NEW.era2, NEW.era3, NEW.era4, NEW.era5, NEW.peli);
END //

-- Jos ep_erat rivi poistetaan, nollaa vastaavan pelin tulokset
DROP TRIGGER IF EXISTS trigger_erat_to_peli_delete //
CREATE TRIGGER trigger_erat_to_peli_delete
BEFORE DELETE ON ep_erat
FOR EACH ROW
BEGIN
    UPDATE ep_peli 
    SET 
        ktulos = NULL, 
        vtulos = NULL
    WHERE id = OLD.peli;
END //


-- ep_ottelu päivitys:


-- Jos ep_peli lisätään rivi, päivitetään ep_ottelu taulun ktulos, vtulos:
DROP TRIGGER IF EXISTS trigger_peli_to_ottelu_insert //
CREATE TRIGGER trigger_peli_to_ottelu_insert
BEFORE INSERT ON ep_peli
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
BEFORE DELETE ON ep_peli
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
BEFORE UPDATE ON ep_peli
FOR EACH ROW
BEGIN
    DECLARE sub_ktulos INT DEFAULT IF(COALESCE(OLD.ktulos, 0) > COALESCE(OLD.vtulos, 0), 1, 0);
    DECLARE sub_vtulos INT DEFAULT IF(COALESCE(OLD.vtulos, 0) > COALESCE(OLD.ktulos, 0), 1, 0);
    DECLARE add_ktulos INT DEFAULT IF(COALESCE(NEW.ktulos, 0) > COALESCE(NEW.vtulos, 0), 1, 0);
    DECLARE add_vtulos INT DEFAULT IF(COALESCE(NEW.vtulos, 0) > COALESCE(NEW.ktulos, 0), 1, 0);

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


-- ep_pelaaja päivitys:


-- Toimenpide ep_pelaaja taulun muutoksille kun lisätään (operation_sign = +1) 
-- tai poistetaan (operation_sign = -1) ep_peli
DROP PROCEDURE IF EXISTS adjust_ep_pelaaja //
CREATE PROCEDURE adjust_ep_pelaaja(IN player_id INT, IN rounds_won INT, IN rounds_lost INT, IN operation_sign INT)
BEGIN
    DECLARE player_won INT DEFAULT IF(rounds_won > rounds_lost, 1, 0);
    DECLARE player_lost INT DEFAULT IF(rounds_lost > rounds_won, 1, 0);

    UPDATE ep_pelaaja
    SET 
        v_era = COALESCE(v_era, 0) + operation_sign*rounds_won,
        h_era = COALESCE(h_era, 0) + operation_sign*rounds_lost,
        v_peli = COALESCE(v_peli, 0) + operation_sign*player_won,
        h_peli = COALESCE(h_peli, 0) + operation_sign*player_lost,
        pelit = COALESCE(pelit, 0) + operation_sign
    WHERE id = player_id;
END //

-- Jos ep_peli rivi lisätään, päivitetään v_era ja h_era arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_pelaaja_insert //
CREATE TRIGGER trigger_peli_to_pelaaja_insert
BEFORE INSERT ON ep_peli
FOR EACH ROW
BEGIN
    CALL adjust_ep_pelaaja(NEW.kp, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_pelaaja(NEW.vp, NEW.vtulos, NEW.ktulos, +1);
END //

-- Jos ep_peli rivi poistetaan, päivitetään v_era ja h_era arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_pelaaja_delete //
CREATE TRIGGER trigger_peli_to_pelaaja_delete
BEFORE DELETE ON ep_peli
FOR EACH ROW
BEGIN
    CALL adjust_ep_pelaaja(OLD.kp, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_pelaaja(OLD.vp, OLD.vtulos, OLD.ktulos, -1);
END //

-- Jos ep_peli rivi päivitetään, päivitetään v_era ja h_era arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_pelaaja_update //
CREATE TRIGGER trigger_peli_to_pelaaja_update
BEFORE UPDATE ON ep_peli
FOR EACH ROW
BEGIN
    CALL adjust_ep_pelaaja(OLD.kp, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_pelaaja(OLD.vp, OLD.vtulos, OLD.ktulos, -1);
    CALL adjust_ep_pelaaja(NEW.kp, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_pelaaja(NEW.vp, NEW.vtulos, NEW.ktulos, +1);
END //


-- ep_sarjat päivitys:


-- Päivittää ep_sarjat taulua lisäten (operation_sign = +1) tai poistaen (operation_sign = -1)
-- yhden ep_peli rivin tulokset:
DROP PROCEDURE IF EXISTS adjust_ep_sarjat //
CREATE PROCEDURE adjust_ep_sarjat(IN sarjat_id INT, IN rounds_won INT, IN rounds_lost INT, IN operation_sign INT)
BEGIN
    DECLARE player_won INT DEFAULT IF(rounds_won > rounds_lost, 1, 0);
    DECLARE player_lost INT DEFAULT IF(rounds_lost > rounds_won, 1, 0);

    UPDATE ep_sarjat
    SET 
        v_era = COALESCE(v_era, 0) + operation_sign*rounds_won,
        h_era = COALESCE(h_era, 0) + operation_sign*rounds_lost,
        v_peli = COALESCE(v_peli, 0) + operation_sign*player_won,
        h_peli = COALESCE(h_peli, 0) + operation_sign*player_lost
    WHERE id = sarjat_id;
END //

-- Hakee ep_ottelu.koti ep_ottelu.id perusteella:
-- DROP PROCEDURE IF EXISTS get_ottelu_home //
-- CREATE PROCEDURE get_ottelu_home(IN ottelu_id INT, OUT ottelu_home INT)
-- BEGIN
--     SELECT koti INTO ottelu_home
--     FROM ep_ottelu
--     WHERE id = ottelu_id
--     LIMIT 1;
-- END //

-- Hakee ep_ottelu.vieras ep_ottelu.id perusteella:
-- DROP PROCEDURE IF EXISTS get_ottelu_away //
-- CREATE PROCEDURE get_ottelu_away(IN ottelu_id INT, OUT ottelu_away INT)
-- BEGIN
--     SELECT vieras INTO ottelu_away
--     FROM ep_ottelu
--     WHERE id = ottelu_id
--     LIMIT 1;
-- END //

-- Hakee ep_sarjat.id joka vastaa kotijoukkuetta ottelussa, missä id=ottelu_id:
DROP PROCEDURE IF EXISTS get_sarjat_home_id //
CREATE PROCEDURE get_sarjat_home_id(IN ottelu_id INT, OUT sarjat_home_id INT)
BEGIN
    DECLARE home_team_id INT;

    -- CALL get_ottelu_home(ottelu_id, home_team_id);

    SELECT koti INTO home_team_id
    FROM ep_ottelu
    WHERE id = ottelu_id
    LIMIT 1;

    SELECT id INTO sarjat_home_id 
    FROM ep_sarjat
    WHERE joukkue = home_team_id
    LIMIT 1;
END //

-- Hakee ep_sarjat.id joka vastaa vierasjoukkuetta ottelussa, missä id=ottelu_id:
DROP PROCEDURE IF EXISTS get_sarjat_away_id //
CREATE PROCEDURE get_sarjat_away_id(IN ottelu_id INT, OUT sarjat_away_id INT)
BEGIN
    DECLARE away_team_id INT;

    -- CALL get_ottelu_away(ottelu_id, away_team_id);

    SELECT vieras INTO away_team_id
    FROM ep_ottelu
    WHERE id = ottelu_id
    LIMIT 1;

    SELECT id INTO sarjat_away_id 
    FROM ep_sarjat
    WHERE joukkue = away_team_id
    LIMIT 1;
END //

-- Jos ep_peli rivi lisätään, päivitetään v_era, h_era, v_peli, h_peli arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_sarjat_insert //
CREATE TRIGGER trigger_peli_to_sarjat_insert
BEFORE INSERT ON ep_peli
FOR EACH ROW
BEGIN
    -- löydä sarjat id kotijoukkueelle ja vierasjoukkueelle:
    DECLARE sarjat_home_id INT;
    DECLARE sarjat_away_id INT;
    CALL get_sarjat_home_id(NEW.ottelu, sarjat_home_id);
    CALL get_sarjat_away_id(NEW.ottelu, sarjat_away_id);

    -- Päivitetään v_era, h_era, v_peli, h_peli:
    CALL adjust_ep_sarjat(sarjat_home_id, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_sarjat(sarjat_away_id, NEW.vtulos, NEW.ktulos, +1);
END //

-- Jos ep_peli rivi poistetaan, päivitetään v_era, h_era, v_peli, h_peli arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_sarjat_delete //
CREATE TRIGGER trigger_peli_to_sarjat_delete
BEFORE DELETE ON ep_peli
FOR EACH ROW
BEGIN
    -- löydä sarjat id kotijoukkueelle ja vierasjoukkueelle:
    DECLARE sarjat_home_id INT;
    DECLARE sarjat_away_id INT;
    CALL get_sarjat_home_id(OLD.ottelu, sarjat_home_id);
    CALL get_sarjat_away_id(OLD.ottelu, sarjat_away_id);

    -- Päivitetään v_era, h_era, v_peli, h_peli:
    CALL adjust_ep_sarjat(sarjat_home_id, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_sarjat(sarjat_away_id, OLD.vtulos, OLD.ktulos, -1);
END //

-- Jos ep_peli rivi poistetaan, päivitetään v_era, h_era, v_peli, h_peli arvoja:
DROP TRIGGER IF EXISTS trigger_peli_to_sarjat_update //
CREATE TRIGGER trigger_peli_to_sarjat_update
BEFORE UPDATE ON ep_peli
FOR EACH ROW
BEGIN
    -- löydä sarjat id kotijoukkueelle ja vierasjoukkueelle:
    DECLARE sarjat_old_home_id INT;
    DECLARE sarjat_old_away_id INT;
    DECLARE sarjat_new_home_id INT;
    DECLARE sarjat_new_away_id INT;
    CALL get_sarjat_home_id(OLD.ottelu, sarjat_old_home_id);
    CALL get_sarjat_away_id(OLD.ottelu, sarjat_old_away_id);
    CALL get_sarjat_home_id(NEW.ottelu, sarjat_new_home_id);
    CALL get_sarjat_away_id(NEW.ottelu, sarjat_new_away_id);

    -- Päivitetään v_era, h_era, v_peli, h_peli:
    CALL adjust_ep_sarjat(sarjat_old_home_id, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_sarjat(sarjat_old_away_id, OLD.vtulos, OLD.ktulos, -1);
    CALL adjust_ep_sarjat(sarjat_new_home_id, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_sarjat(sarjat_new_away_id, NEW.vtulos, NEW.ktulos, +1);
END //

-- TODO ottelu, voitto, tappio ottelu->sarjat triggerinä
-- vai voiko tämänkin tehdä peli->sarjat trigger mukana?

-- Päivittää ep_sarjat taulua lisäten (operation_sign = +1) tai poistaen (operation_sign = -1)
-- yhden ep_ottelu rivin tulokset:
DROP PROCEDURE IF EXISTS adjust_ep_sarjat2 //
CREATE PROCEDURE adjust_ep_sarjat2(IN sarjat_id INT, IN games_won INT, IN games_lost INT, IN operation_sign INT)
BEGIN
    DECLARE team_won INT DEFAULT IF(games_won > games_lost, 1, 0);
    DECLARE team_lost INT DEFAULT IF(games_lost > games_won, 1, 0);

    UPDATE ep_sarjat
    SET 
        voitto = COALESCE(voitto, 0) + operation_sign*team_won,
        tappio = COALESCE(tappio, 0) + operation_sign*team_lost,
        ottelu = COALESCE(ottelu, 0) + operation_sign
    WHERE id = sarjat_id;
END //

-- Jos ep_ottelu rivi lisätään, päivitetään ottelu, voitto, tappio arvoja:
DROP TRIGGER IF EXISTS trigger_ottelu_to_sarjat_insert //
CREATE TRIGGER trigger_ottelu_to_sarjat_insert
BEFORE INSERT ON ep_ottelu
FOR EACH ROW
BEGIN
    -- löydä sarjat id kotijoukkueelle ja vierasjoukkueelle:
    DECLARE sarjat_home_id INT;
    DECLARE sarjat_away_id INT;
    CALL get_sarjat_home_id(NEW.id, sarjat_home_id);    -- epäoptimaalinen
    CALL get_sarjat_away_id(NEW.id, sarjat_away_id);

    -- Päivitetään ottelu, voitto, tappio:
    CALL adjust_ep_sarjat2(sarjat_home_id, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_sarjat2(sarjat_away_id, NEW.vtulos, NEW.ktulos, +1);
END //

-- Jos ep_ottelu rivi poistetaan, päivitetään ottelu, voitto, tappio arvoja:
DROP TRIGGER IF EXISTS trigger_ottelu_to_sarjat_delete //
CREATE TRIGGER trigger_ottelu_to_sarjat_delete
BEFORE DELETE ON ep_ottelu
FOR EACH ROW
BEGIN
    -- löydä sarjat id kotijoukkueelle ja vierasjoukkueelle:
    DECLARE sarjat_home_id INT;
    DECLARE sarjat_away_id INT;
    CALL get_sarjat_home_id(OLD.id, sarjat_home_id);    -- epäoptimaalinen
    CALL get_sarjat_away_id(OLD.id, sarjat_away_id);

    -- Päivitetään ottelu, voitto, tappio:
    CALL adjust_ep_sarjat2(sarjat_home_id, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_sarjat2(sarjat_away_id, OLD.vtulos, OLD.ktulos, -1);
END //

-- Jos ep_ottelu rivi muutetaan, päivitetään ottelu, voitto, tappio arvoja:
DROP TRIGGER IF EXISTS trigger_ottelu_to_sarjat_update //
CREATE TRIGGER trigger_ottelu_to_sarjat_update
BEFORE UPDATE ON ep_ottelu
FOR EACH ROW
BEGIN
    -- löydä sarjat id kotijoukkueelle ja vierasjoukkueelle:
    DECLARE sarjat_old_home_id INT;
    DECLARE sarjat_old_away_id INT;
    DECLARE sarjat_new_home_id INT;
    DECLARE sarjat_new_away_id INT;
    CALL get_sarjat_home_id(OLD.id, sarjat_old_home_id);    -- epäoptimaalinen
    CALL get_sarjat_away_id(OLD.id, sarjat_old_away_id);
    CALL get_sarjat_home_id(NEW.id, sarjat_new_home_id);
    CALL get_sarjat_away_id(NEW.id, sarjat_new_away_id);

    -- Päivitetään ottelu, voitto, tappio:
    CALL adjust_ep_sarjat2(sarjat_old_home_id, OLD.ktulos, OLD.vtulos, -1);
    CALL adjust_ep_sarjat2(sarjat_old_away_id, OLD.vtulos, OLD.ktulos, -1);
    CALL adjust_ep_sarjat2(sarjat_new_home_id, NEW.ktulos, NEW.vtulos, +1);
    CALL adjust_ep_sarjat2(sarjat_new_away_id, NEW.vtulos, NEW.ktulos, +1);
END //

DELIMITER ;