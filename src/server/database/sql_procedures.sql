-- Manuaalisesti kutsuttavia proseduureja päivittämään varsinaisten taulujen
-- tuloskenttiä.

-- Tässä tiedostossa luodaan proseduuri "procedure_update_all_from_erat",
-- joka muuttaa varsinaisten taulujen tuloskenttiä ottaen huomioon uudet erätulokset. 
-- Erätulokset aiheuttavat muutoksia seuraaviin tauluihin ja kenttiin:
--     ep_peli: ktulos, vtulos
--     ep_ottelu: ktulos, vtulos
--     ep_pelaaja: v_era, h_era, e_era, v_peli, h_peli, e_peli, pelit
--     ep_sarjat: v_era, h_era, v_peli, h_peli, ottelu, voitto, tappio.
-- HUOM! _tulokset tauluja ei tässä tiedostossa muuteta tai käytetä.
-- 
-- Proseduuria ei kutsuta automaattisesti vaan sitä käytetään kutsumalla
-- manuaalisesti tulosten hyväksymisen yhteydessä.

DELIMITER //

-- Ottaa vastaan pelin uuden tuloksen ja päivittää tauluja
-- ep_peli, ep_ottelu, ep_pelaaja, ep_sarjat 
-- kumoamalla vanhan tuloksen vaikutukset ja ottamalla uusi tulos huomioon.
DROP PROCEDURE IF EXISTS procedure_update_all_old_from_peli //
CREATE PROCEDURE procedure_update_all_old_from_peli(
    IN peli_id INT,
    IN new_peli_ktulos INT,
    IN new_peli_vtulos INT
)
BEGIN
    -- Muuttujia säilyttämään id-kenttiä:
    DECLARE ottelu_id INT;
    DECLARE koti_pelaaja_id INT;
    DECLARE vieras_pelaaja_id INT;
    DECLARE koti_joukkue_id INT;
    DECLARE vieras_joukkue_id INT;

    -- Vanha ktulos, vtulos ep_peli taulussa:
    DECLARE old_peli_ktulos INT;
    DECLARE old_peli_vtulos INT;

    -- Vanha ja uusi ktulos, vtulos ep_ottelu taulussa:
    DECLARE old_ottelu_ktulos INT;
    DECLARE old_ottelu_vtulos INT;
    DECLARE new_ottelu_ktulos INT;
    DECLARE new_ottelu_vtulos INT;

    -- Vanha ja uusi tieto pelin voittajasta, kukin näistä on 0/1:
    -- HUOM. molemmat x_home_win, x_away_win voivat olla nollia jos tuloksia ei vielä ole.
    -- Tämän takia tarvitaan erillisit muuttujat.
    DECLARE old_is_peli_home_win INT;
    DECLARE old_is_peli_away_win INT;
    DECLARE new_is_peli_home_win INT;
    DECLARE new_is_peli_away_win INT;

    -- Vanha ja uusi tieto ottelun voittajasta, kukin näistä on 0/1:
    DECLARE old_is_ottelu_home_win INT;
    DECLARE old_is_ottelu_away_win INT;
    DECLARE new_is_ottelu_home_win INT;
    DECLARE new_is_ottelu_away_win INT;

    -- Alustetaan ottelu_id, koti_pelaaja_id, vieras_pelaaja_id:
    SELECT ottelu, kp, vp INTO ottelu_id, koti_pelaaja_id, vieras_pelaaja_id
        FROM ep_peli
        WHERE id = peli_id;

    -- Alustetaan koti_joukkue_id, vieras_joukkue_id:
    SELECT koti, vieras INTO koti_joukkue_id, vieras_joukkue_id
        FROM ep_ottelu
        WHERE id = ottelu_id;

    -- Alustetaan old_peli_ktulos, old_peli_vtulos:
    SELECT COALESCE(ktulos, 0), COALESCE(vtulos, 0) 
        INTO old_peli_ktulos, old_peli_vtulos
        FROM ep_peli
        WHERE id = peli_id;

    -- Alustetaan old_ottelu_ktulos, old_ottelu_vtulos:
    SELECT COALESCE(ktulos, 0), COALESCE(vtulos, 0) 
        INTO old_ottelu_ktulos, old_ottelu_vtulos
        FROM ep_ottelu
        WHERE id = ottelu_id;

    -- Asetetaan pelin koti- ja vierasvoitosta kertovat muttujat:
    SET old_is_peli_home_win = IF(old_peli_ktulos > old_peli_vtulos, 1, 0);
    SET old_is_peli_away_win = IF(old_peli_vtulos > old_peli_ktulos, 1, 0);
    SET new_is_peli_home_win = IF(new_peli_ktulos > new_peli_vtulos, 1, 0);
    SET new_is_peli_away_win = IF(new_peli_vtulos > new_peli_ktulos, 1, 0);

    -- Lasketaan ottelun uusi tulos:
    SET new_ottelu_ktulos = old_ottelu_ktulos + new_is_peli_home_win - old_is_peli_home_win;
    SET new_ottelu_vtulos = old_ottelu_vtulos + new_is_peli_away_win - old_is_peli_away_win;

    -- Asetetaan ottelun koti- ja vierasvoitosta kertovat muttujat:
    SET old_is_ottelu_home_win = IF(old_ottelu_ktulos > old_ottelu_vtulos, 1, 0);
    SET old_is_ottelu_away_win = IF(old_ottelu_vtulos > old_ottelu_ktulos, 1, 0);
    SET new_is_ottelu_home_win = IF(new_ottelu_ktulos > new_ottelu_vtulos, 1, 0);
    SET new_is_ottelu_away_win = IF(new_ottelu_vtulos > new_ottelu_ktulos, 1, 0);

    -- Päivitetään ep_peli:
    UPDATE ep_peli
        SET ktulos = new_peli_ktulos, vtulos = new_peli_vtulos
        WHERE id = peli_id;

    -- Päivitetään ep_ottelu:
    UPDATE ep_ottelu 
        SET ktulos = new_ottelu_ktulos, vtulos = new_ottelu_vtulos
        WHERE id = ottelu_id;
            
    -- Päivitetään ep_pelaaja kotipelaajalle:
    UPDATE ep_pelaaja
        SET v_era = v_era + new_peli_ktulos - old_peli_ktulos,
            h_era = h_era + new_peli_vtulos - old_peli_vtulos,
            e_era = v_era + new_peli_ktulos - old_peli_ktulos - (h_era + new_peli_vtulos - old_peli_vtulos),
            v_peli = v_peli + new_is_peli_home_win - old_is_peli_home_win,
            h_peli = h_peli + new_is_peli_away_win - old_is_peli_away_win,
            e_peli = v_peli + new_is_peli_home_win - old_is_peli_home_win - (h_peli + new_is_peli_away_win - old_is_peli_away_win),
            pelit = pelit + new_is_peli_away_win - old_is_peli_away_win + new_is_peli_home_win - old_is_peli_home_win
        WHERE id = koti_pelaaja_id;
    
    -- Päivitetään ep_pelaaja vieraspelaajalle:
    UPDATE ep_pelaaja
        SET v_era = v_era + new_peli_vtulos - old_peli_vtulos,
            h_era = h_era + new_peli_ktulos - old_peli_ktulos,
            e_era = v_era + new_peli_vtulos - old_peli_vtulos - (h_era + new_peli_ktulos - old_peli_ktulos),
            v_peli = v_peli + new_is_peli_away_win - old_is_peli_away_win,
            h_peli = h_peli + new_is_peli_home_win - old_is_peli_home_win,
            e_peli = v_peli + new_is_peli_away_win - old_is_peli_away_win - (h_peli + new_is_peli_home_win - old_is_peli_home_win),
            pelit = pelit + new_is_peli_away_win - old_is_peli_away_win + new_is_peli_home_win - old_is_peli_home_win
        WHERE id = vieras_pelaaja_id;

    -- Päivitetään ep_sarjat kotijoukkueelle:
    UPDATE ep_sarjat
        SET v_era = v_era + new_peli_ktulos - old_peli_ktulos,
            h_era = h_era + new_peli_vtulos - old_peli_vtulos,
            v_peli = v_peli + new_is_peli_home_win - old_is_peli_home_win,
            h_peli = h_peli + new_is_peli_away_win - old_is_peli_away_win,
            voitto = voitto + new_is_ottelu_home_win - old_is_ottelu_home_win,
            tappio = tappio + new_is_ottelu_away_win - old_is_ottelu_away_win,
            ottelu = ottelu + new_is_ottelu_home_win - old_is_ottelu_home_win + new_is_ottelu_away_win - old_is_ottelu_away_win
        WHERE joukkue = koti_joukkue_id;

    -- Päivitetään ep_sarjat vierasjoukkueelle:
    UPDATE ep_sarjat
        SET v_era = v_era + new_peli_vtulos - old_peli_vtulos,
            h_era = h_era + new_peli_ktulos - old_peli_ktulos,
            v_peli = v_peli + new_is_peli_away_win - old_is_peli_away_win,
            h_peli = h_peli + new_is_peli_home_win - old_is_peli_home_win,
            voitto = voitto + new_is_ottelu_away_win - old_is_ottelu_away_win,
            tappio = tappio + new_is_ottelu_home_win - old_is_ottelu_home_win,
            ottelu = ottelu + new_is_ottelu_home_win - old_is_ottelu_home_win + new_is_ottelu_away_win - old_is_ottelu_away_win
        WHERE joukkue = vieras_joukkue_id;
END //

-- Ottaa vastaan ep_peli id ja päivittää tauluja
-- ep_peli, ep_ottelu, ep_pelaaja, ep_sarjat 
-- kumoamalla vanhat pelin vaikutukset ja ottamalla pelin erätulokset huomioon.
DROP PROCEDURE IF EXISTS procedure_update_all_old_from_erat //
CREATE PROCEDURE procedure_update_all_old_from_erat(
    IN peli_id INT
)
BEGIN
    -- Muuttujat ep_erat rivin kentille:
    DECLARE era1_value VARCHAR(2);
    DECLARE era2_value VARCHAR(2);
    DECLARE era3_value VARCHAR(2);
    DECLARE era4_value VARCHAR(2);
    DECLARE era5_value VARCHAR(2);

    -- Muuttujat uudelle pelin tulokselle:
    DECLARE ktulos INT DEFAULT 0;
    DECLARE vtulos INT DEFAULT 0;

    -- Alustetaan muttujia:
    SELECT era1, era2, era3, era4, era5
        INTO era1_value, era2_value, era3_value, era4_value, era5_value
        FROM ep_erat
        WHERE peli = peli_id;

    -- Lasketaan uusi pelin tulos (ktulos, vtulos):
    CALL procedure_calculate_peli_result(era1_value, era2_value, era3_value, era4_value, era5_value, ktulos, vtulos);

    -- Päivitetään tuloksia useassa taulussa ottaen huomioon uuden pelin tuloksen:
    CALL procedure_update_all_old_from_peli(peli_id, ktulos, vtulos);
END //

-- Kutsuu procedure_update_all_old_from_erat jokaiselle ep_erat riville,
-- joka liittyy syötettyyn otteluun.
-- HUOM! Hidas, käytä vain testaukseen.
DROP PROCEDURE IF EXISTS procedure_update_all_old_from_all_erat_slow //
CREATE PROCEDURE procedure_update_all_old_from_all_erat_slow()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE id_val INT;
    
    -- Määritellään kursori hakemaan rivejä:
    DECLARE id_cursor CURSOR FOR
        SELECT ep_erat.peli FROM ep_erat
            JOIN ep_peli ON ep_peli.id = ep_erat.peli
            JOIN ep_ottelu ON ep_ottelu.id = ep_peli.ottelu
            WHERE ep_ottelu.status <> 'T';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN id_cursor;

    -- Looppi käymään kaikki ep_erat rivit läpi:
    read_loop: LOOP
        FETCH id_cursor INTO id_val;

        -- Lopeta jos ei enää rivejä:
        IF done THEN
            LEAVE read_loop;
        END IF;

        CALL procedure_update_all_old_from_erat(id_val);
    END LOOP;

    CLOSE id_cursor;
END //

DELIMITER ;