DELIMITER //

-- Lisää kt yhdellä jos era on kotivoitto ja vastaavasti vt yhdellä jos vierasvoitto:
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
CREATE TRIGGER trigger_erat_to_peli_insert_or_insert
AFTER INSERT ON ep_erat
FOR EACH ROW
BEGIN
    CALL procedure_erat_to_peli(NEW.era1, NEW.era2, NEW.era3, NEW.era4, NEW.era5, NEW.peli);
END //

-- Jos ep_erat muutetaan riviä, päivitetään ep_peli taulun ktulos, vtulos:
CREATE TRIGGER trigger_erat_to_peli_insert_or_update
AFTER UPDATE ON ep_erat
FOR EACH ROW
BEGIN
    CALL procedure_erat_to_peli(NEW.era1, NEW.era2, NEW.era3, NEW.era4, NEW.era5, NEW.peli);
END //

-- Jos ep_erat rivi poistetaan, nollaa vastaavan pelin tulokset
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

-- Toimenpide ep_pelaaja taulun muutoksille kun lisätään (operation_type = 'insert') 
-- tai poistetaan (operation_type != 'insert') ep_peli
CREATE PROCEDURE adjust_ep_pelaaja(IN player_id INT, IN games_won INT, IN games_lost INT, IN operation_type VARCHAR(6))
BEGIN
    DECLARE player_won INT DEFAULT IF(games_won > games_lost, 1, 0);
    DECLARE operation_sign INT DEFAULT IF(operation_type = 'insert', 1, -1);

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
CREATE TRIGGER trigger_peli_to_pelaaja_insert
AFTER INSERT ON ep_peli
FOR EACH ROW
BEGIN
    CALL adjust_ep_pelaaja(NEW.kp, NEW.ktulos, NEW.vtulos, 'insert');
    CALL adjust_ep_pelaaja(NEW.vp, NEW.vtulos, NEW.ktulos, 'insert');
END //

-- Jos ep_peli rivi poistetaan, päivitetään v_era ja h_era arvoja:
CREATE TRIGGER trigger_peli_to_pelaaja_delete
AFTER DELETE ON ep_peli
FOR EACH ROW
BEGIN
    CALL adjust_ep_pelaaja(OLD.kp, OLD.ktulos, OLD.vtulos, 'delete');
    CALL adjust_ep_pelaaja(OLD.vp, OLD.vtulos, OLD.ktulos, 'delete');
END //

-- Jos ep_peli rivi päivitetään, päivitetään v_era ja h_era arvoja:
CREATE TRIGGER trigger_peli_to_pelaaja_update
AFTER UPDATE ON ep_peli
FOR EACH ROW
BEGIN
    CALL adjust_ep_pelaaja(OLD.kp, OLD.ktulos, OLD.vtulos, 'delete');
    CALL adjust_ep_pelaaja(OLD.vp, OLD.vtulos, OLD.ktulos, 'delete');
    CALL adjust_ep_pelaaja(NEW.kp, NEW.ktulos, NEW.vtulos, 'insert');
    CALL adjust_ep_pelaaja(NEW.vp, NEW.vtulos, NEW.ktulos, 'insert');
END //

DELIMITER ;