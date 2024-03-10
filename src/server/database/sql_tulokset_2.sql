-- Triggereitä laukaisemaan muutoksia _tulokset tauluissa.

-- Lisätään ja poistetaan _tulokset tauluista rivejä aina kun varsinaiseen
-- (ep_peli, ep_ottelu, ep_pelaaja, ep_joukkue) tauluun lisätään tai poistetaan.
-- Näin _tulokset taulujen rivit pysyvät vastaamaan varsinaisten taulujen 
-- rivejä yksi yhteen.

-- Kun varsinaiseen tauluun (esim. ep_ottelu) lisätään rivi, niin
-- vastaavaan _tulokset tauluun (ep_ottelu_tulokset) lisätään sitä vastaava rivi,
-- missä tulokset ovat nollia. 

-- Kun varsinaisesta taulusta poistetaan rivi, niin vastaavan _tulokset taulun rivi 
-- poistetaan mutta ennen sitä kumotaan kaikkien erätulosten vaikutukset, 
-- jotka liittyvät riviin.

-- Kun varsinaiseen tauluun tehdään muutoksia (esim. muutetaan ottelun status),
-- niin kumotaan ensin (BEFORE UPDATE) kaikki siihen liittyvät erätulosten vaikutukset 
-- vanhoilla arvoilla ja sen jälkeen (AFTER UPDATE) lasketaan uudelleen erätulosten 
-- vaikutukset uusilla arvoilla.

-- HUOM! Tarvitsee enemmän testausta!

DELIMITER //

-- Kumoaa tai laskee uudelleen ep_erat riveistä ottelun vaikutukset _tulokset tauluihin.
-- operation_type on 0=kumoaa, 1=uudelleenlaskee:
DROP PROCEDURE IF EXISTS procedure_nullify_or_recompute_tulokset_in_ottelu //
CREATE PROCEDURE procedure_nullify_or_recompute_tulokset_in_ottelu(IN ottelu_id INT, IN operation_type INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE current_id INT;

    DECLARE id_cursor CURSOR FOR
        SELECT id FROM ep_peli WHERE ottelu = ottelu_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    OPEN id_cursor;
    id_loop: LOOP
        FETCH id_cursor INTO current_id;
        IF done THEN
            LEAVE id_loop;
        END IF;
        IF operation_type = 1 THEN
            CALL procedure_update_all_tulokset_from_erat(current_id);
        ELSE
            CALL procedure_update_all_tulokset_from_peli(current_id, 0, 0);
        END IF;
    END LOOP;
    CLOSE id_cursor;
END //

-- Kumoaa tai laskee uudelleen ep_erat riveistä pelaajan vaikutukset _tulokset tauluihin.
-- operation_type on 0=kumoaa, 1=uudelleenlaskee:
DROP PROCEDURE IF EXISTS procedure_nullify_or_recompute_tulokset_in_pelaaja //
CREATE PROCEDURE procedure_nullify_or_recompute_tulokset_in_pelaaja(IN pelaaja_id INT, IN operation_type INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE current_id INT;

    DECLARE id_cursor CURSOR FOR
        SELECT id FROM ep_peli WHERE kp = pelaaja_id OR vp = pelaaja_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    OPEN id_cursor;
    id_loop: LOOP
        FETCH id_cursor INTO current_id;
        IF done THEN
            LEAVE id_loop;
        END IF;
        IF operation_type = 1 THEN
            CALL procedure_update_all_tulokset_from_erat(current_id);
        ELSE
            CALL procedure_update_all_tulokset_from_peli(current_id, 0, 0);
        END IF;
    END LOOP;
    CLOSE id_cursor;
END //

-- Ei käytössä: ei tarpeellinen.
-- Kumoaa tai laskee uudelleen ep_erat riveistä joukkueen vaikutukset _tulokset tauluihin.
-- operation_type on 0=kumoaa, 1=uudelleenlaskee:
-- DROP PROCEDURE IF EXISTS procedure_nullify_or_recompute_tulokset_in_joukkue //
-- CREATE PROCEDURE procedure_nullify_or_recompute_tulokset_in_joukkue(IN joukkue_id INT, IN operation_type INT)
-- BEGIN
--     DECLARE done INT DEFAULT FALSE;
--     DECLARE current_id INT;

--     DECLARE id_cursor CURSOR FOR
--         SELECT id FROM ep_peli 
--             JOIN ep_pelaaja ON kp = ep_pelaaja.id OR vp = ep_pelaaja.id
--             WHERE ep_pelaaja.joukkue = joukkue_id;

--     DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
--     OPEN id_cursor;
--     id_loop: LOOP
--         FETCH id_cursor INTO current_id;
--         IF done THEN
--             LEAVE id_loop;
--         END IF;
--         IF operation_type = 1 THEN
--             CALL procedure_update_all_tulokset_from_erat(current_id);
--         ELSE
--             CALL procedure_update_all_tulokset_from_peli(current_id, 0, 0);
--         END IF;
--     END LOOP;
--     CLOSE id_cursor;
-- END //

--
-- ep_erat triggers:
--

-- Otetaan huomioon ep_erat tulokset kun uusi rivi lisätään.
DROP TRIGGER IF EXISTS trigger_update_tulokset_on_erat_insert //
CREATE TRIGGER trigger_update_tulokset_on_erat_insert
AFTER INSERT ON ep_erat
FOR EACH ROW
BEGIN
    CALL procedure_update_all_tulokset_from_erat(NEW.peli);
END //

-- Otetaan huomioon ep_erat tulokset kun rivi muutetaan.
DROP TRIGGER IF EXISTS trigger_update_tulokset_on_erat_update //
CREATE TRIGGER trigger_update_tulokset_on_erat_update
AFTER UPDATE ON ep_erat
FOR EACH ROW
BEGIN
    CALL procedure_update_all_tulokset_from_erat(NEW.peli);
END //

-- Kumotaan ep_erat rivin vaikutus _tulokset tauluihin kun rivi poistetaan:
DROP TRIGGER IF EXISTS trigger_update_tulokset_on_erat_delete //
CREATE TRIGGER trigger_update_tulokset_on_erat_delete
BEFORE DELETE ON ep_erat
FOR EACH ROW
BEGIN
    CALL procedure_update_all_tulokset_from_peli(OLD.peli, 0, 0);
END //

--
-- ep_peli triggers:
--

-- Lisätään ep_peli_tulokset rivi aina kun lisätään ep_peli rivi:
DROP TRIGGER IF EXISTS trigger_insert_peli_tulokset_on_peli_insert //
CREATE TRIGGER trigger_insert_peli_tulokset_on_peli_insert 
AFTER INSERT ON ep_peli
FOR EACH ROW
BEGIN
    INSERT INTO ep_peli_tulokset (peli, ktulos, vtulos)
        VALUES (NEW.id, 0, 0);
END //

-- Poistetaan ep_peli_tulokset rivi ja kumotaan sen vaikutukset 
-- kun poistetaan ep_peli rivi:
DROP TRIGGER IF EXISTS trigger_delete_peli_tulokset_on_peli_delete //
CREATE TRIGGER trigger_delete_peli_tulokset_on_peli_delete
BEFORE DELETE ON ep_peli
FOR EACH ROW
BEGIN
    CALL procedure_update_all_tulokset_from_peli(OLD.id, 0, 0);
    DELETE FROM ep_peli_tulokset
        WHERE peli = OLD.id;
END //

-- Kumotaan ep_peli_tulokset vaikutukset kun muutetaan ep_peli riviä:
DROP TRIGGER IF EXISTS trigger_update_peli_tulokset_before_peli_update //
CREATE TRIGGER trigger_update_peli_tulokset_before_peli_update
BEFORE UPDATE ON ep_peli
FOR EACH ROW
BEGIN
    IF NOT(OLD.ottelu = NEW.ottelu AND OLD.kp = NEW.kp AND OLD.vp = NEW.vp) THEN
        CALL procedure_update_all_tulokset_from_peli(OLD.id, 0, 0);
    END IF;
END //

-- Lasketaan ep_peli_tulokset vaikutukset uudelleen kun muutetaan ep_peli riviä:
DROP TRIGGER IF EXISTS trigger_update_peli_tulokset_after_peli_update //
CREATE TRIGGER trigger_update_peli_tulokset_after_peli_update
AFTER UPDATE ON ep_peli
FOR EACH ROW
BEGIN
    IF NOT(OLD.ottelu = NEW.ottelu AND OLD.kp = NEW.kp AND OLD.vp = NEW.vp) THEN
        CALL procedure_update_all_tulokset_from_erat(NEW.id);
    END IF;
END //

--
-- ep_ottelu triggers:
--

-- Lisätään ep_ottelu_tulokset rivi aina kun lisätään ep_ottelu rivi:
DROP TRIGGER IF EXISTS trigger_insert_ottelu_tulokset_on_ottelu_insert //
CREATE TRIGGER trigger_insert_ottelu_tulokset_on_ottelu_insert 
AFTER INSERT ON ep_ottelu
FOR EACH ROW
BEGIN
    INSERT INTO ep_ottelu_tulokset (ottelu, ktulos, vtulos)
        VALUES (NEW.id, 0, 0);
END //

-- Poistetaan ep_ottelu_tulokset rivi ja kumotaan sen vaikutukset 
-- kun poistetaan ep_ottelu rivi:
DROP TRIGGER IF EXISTS trigger_delete_ottelu_tulokset_on_ottelu_delete //
CREATE TRIGGER trigger_delete_ottelu_tulokset_on_ottelu_delete
BEFORE DELETE ON ep_ottelu
FOR EACH ROW
BEGIN
    CALL procedure_nullify_or_recompute_tulokset_in_ottelu(OLD.id, 0);
    DELETE FROM ep_ottelu_tulokset
        WHERE ottelu = OLD.id;
END //

-- Kumotaan ep_ottelu_tulokset vaikutukset kun muutetaan ep_ottelu riviä:
DROP TRIGGER IF EXISTS trigger_update_ottelu_tulokset_before_ottelu_update //
CREATE TRIGGER trigger_update_ottelu_tulokset_before_ottelu_update
BEFORE UPDATE ON ep_ottelu
FOR EACH ROW
BEGIN
    IF NOT(OLD.status = NEW.status AND OLD.koti = NEW.koti AND OLD.vieras = NEW.vieras) THEN
        CALL procedure_nullify_or_recompute_tulokset_in_ottelu(OLD.id, 0);
    END IF;
END //

-- Lasketaan uuden ottelun vaikutukset kun muutetaan ep_ottelu riviä:
DROP TRIGGER IF EXISTS trigger_update_ottelu_tulokset_after_ottelu_update //
CREATE TRIGGER trigger_update_ottelu_tulokset_after_ottelu_update
AFTER UPDATE ON ep_ottelu
FOR EACH ROW
BEGIN
    IF NOT(OLD.status = NEW.status AND OLD.koti = NEW.koti AND OLD.vieras = NEW.vieras) THEN
        CALL procedure_nullify_or_recompute_tulokset_in_ottelu(NEW.id, 1);
    END IF;
END //

--
-- ep_pelaaja triggers:
--

-- Lisätään ep_pelaaja_tulokset rivi aina kun lisätään ep_pelaaja rivi:
DROP TRIGGER IF EXISTS trigger_insert_pelaaja_tulokset_on_pelaaja_insert //
CREATE TRIGGER trigger_insert_pelaaja_tulokset_on_pelaaja_insert 
AFTER INSERT ON ep_pelaaja
FOR EACH ROW
BEGIN
    INSERT INTO ep_pelaaja_tulokset (pelaaja, v_era, h_era, v_peli, h_peli)
        VALUES (NEW.id, 0, 0, 0, 0);
END //

-- Poistetaan ep_pelaaja_tulokset rivi ja kumotaan sen vaikutukset 
-- kun poistetaan ep_pelaaja rivi:
DROP TRIGGER IF EXISTS trigger_delete_pelaaja_tulokset_on_pelaaja_delete //
CREATE TRIGGER trigger_delete_pelaaja_tulokset_on_pelaaja_delete
BEFORE DELETE ON ep_pelaaja
FOR EACH ROW
BEGIN
    CALL procedure_nullify_or_recompute_tulokset_in_pelaaja(OLD.id, 0);
    DELETE FROM ep_pelaaja_tulokset
        WHERE pelaaja = OLD.id;
END //

-- Kumotaan ep_pelaaja_tulokset vaikutukset kun muutetaan ep_pelaaja riviä:
DROP TRIGGER IF EXISTS trigger_update_pelaaja_tulokset_before_pelaaja_update //
CREATE TRIGGER trigger_update_pelaaja_tulokset_before_pelaaja_update
BEFORE UPDATE ON ep_pelaaja
FOR EACH ROW
BEGIN
    IF NOT(OLD.joukkue = NEW.joukkue) THEN
        CALL procedure_nullify_or_recompute_tulokset_in_pelaaja(OLD.id, 0);
    END IF;
END //

-- Lasketaan ep_pelaaja_tulokset vaikutukset uudelleen kun muutetaan ep_pelaaja riviä:
DROP TRIGGER IF EXISTS trigger_update_pelaaja_tulokset_after_pelaaja_update //
CREATE TRIGGER trigger_update_pelaaja_tulokset_after_pelaaja_update
AFTER UPDATE ON ep_pelaaja
FOR EACH ROW
BEGIN
    IF NOT(OLD.joukkue = NEW.joukkue) THEN
        CALL procedure_nullify_or_recompute_tulokset_in_pelaaja(NEW.id, 1);
    END IF;
END //

--
-- ep_joukkue triggers:
--

-- Lisätään ep_joukkue_tulokset rivi aina kun lisätään ep_joukkue rivi:
DROP TRIGGER IF EXISTS trigger_insert_joukkue_tulokset_on_joukkue_insert //
CREATE TRIGGER trigger_insert_joukkue_tulokset_on_joukkue_insert 
AFTER INSERT ON ep_joukkue
FOR EACH ROW
BEGIN
    INSERT INTO ep_joukkue_tulokset (joukkue, v_era, h_era, v_peli, h_peli, voitto, tappio)
        VALUES (NEW.id, 0, 0, 0, 0, 0, 0);
END //

-- Poistetaan ep_joukkue_tulokset rivi ja kumotaan sen vaikutukset 
-- kun poistetaan ep_joukkue rivi:
DROP TRIGGER IF EXISTS trigger_delete_joukkue_tulokset_on_joukkue_delete //
CREATE TRIGGER trigger_delete_joukkue_tulokset_on_joukkue_delete
BEFORE DELETE ON ep_joukkue
FOR EACH ROW
BEGIN
    CALL procedure_nullify_or_recompute_tulokset_in_joukkue(OLD.id, 0);
    DELETE FROM ep_joukkue_tulokset
        WHERE joukkue = OLD.id;
END //

-- Ei käytössä: ei tarpeellinen.
-- Kumotaan ep_joukkue_tulokset vaikutukset kun muutetaan ep_joukkue riviä:
-- DROP TRIGGER IF EXISTS trigger_update_joukkue_tulokset_before_joukkue_update //
-- CREATE TRIGGER trigger_update_joukkue_tulokset_before_joukkue_update
-- BEFORE UPDATE ON ep_joukkue
-- FOR EACH ROW
-- BEGIN
--     -- Ei vaikutuksia
--     -- IF NOT(?) THEN
--     --     CALL procedure_nullify_or_recompute_tulokset_in_joukkue(OLD.id, 0);
--     -- END IF;
-- END //

-- Ei käytössä: ei tarpeellinen.
-- Lasketaan ep_joukkue_tulokset vaikutukset uudelleen kun muutetaan ep_joukkue riviä:
-- DROP TRIGGER IF EXISTS trigger_update_joukkue_tulokset_after_joukkue_update //
-- CREATE TRIGGER trigger_update_joukkue_tulokset_after_joukkue_update
-- AFTER UPDATE ON ep_joukkue
-- FOR EACH ROW
-- BEGIN
--     -- Ei vaikutuksia
--     -- IF NOT(?) THEN
--     --     CALL procedure_nullify_or_recompute_tulokset_in_joukkue(NEW.id, 1);
--     -- END IF;
-- END //

DELIMITER ;