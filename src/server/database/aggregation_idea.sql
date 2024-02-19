-- KESKEN
-- Idea mahdolliselle tulosten laskun automatisoinnille (koodi on vain suuntaa-antava).
-- Askeleet: 
-- 1) Määritellään taulut tuloksille (nämä voisivat olla myös vain sarakkeita olemassaolevissa tauluissa kuten nyt onkin)
-- 2) Luodaan herätin (trigger), joka laukaistaan kun eriä muutetaan. 
--      Tämä päivittää vastaavia kohtia tulostauluissa.
-- 3) Luodaan "event", joka laskee tulostaulut kokonaan uusiksi. Tämä varmistaa, että
--      tulostaulut ovat oikein vaikka erien tuloksiin olisi tullut muutoksia, jotka
--      eivät laukaisseet herätintä.

-- Luo uudet taulut peli- ja turnaustuloksille:
CREATE TABLE game_results (
    game_id INT PRIMARY KEY,
    player1_total INT,
    player2_total INT,
    winner INT
);

CREATE TABLE tournament_results (
    tournament_id INT PRIMARY KEY,
    player1_wins INT,
    player2_wins INT
);

-- Luo triggerit pelikierrosten taululle päivittämään game_results taulua:
CREATE TRIGGER update_game_results
AFTER INSERT OR UPDATE ON rounds
FOR EACH ROW
BEGIN
    DECLARE game_id INT;
    SET game_id = NEW.game_id;

    -- Laske uudet pisteet ja voittaja
    DECLARE player1_total, player2_total, winner INT;
    SET player1_total = 
        IF NEW.winner = 1 THEN NEW.player1_score ELSE NEW.player2_score END;
    SET player2_total = 
        IF NEW.winner = 2 THEN NEW.player1_score ELSE NEW.player2_score END;
    SET winner =
        IF player1_total > player2_total THEN 1
        ELSE 2
        END;

    -- Päivitä vastaava rivi game_results taulusta
    UPDATE game_results
    SET player1_total = player1_total,
        player2_total = player2_total,
        winner = winner
    WHERE game_id = NEW.game_id;
END;

-- Luo triggerit peleihin päivittämään tournament_results-taulua:
CREATE TRIGGER update_tournament_results
AFTER UPDATE ON games
FOR EACH ROW
BEGIN
    DECLARE tournament_id INT;
    SET tournament_id = NEW.tournament_id;

    -- Laske uudet voitot turnauksille
    DECLARE player1_wins, player2_wins INT;
    SET player1_wins = 
        (SELECT COUNT(*) FROM rounds WHERE game_id = NEW.game_id AND winner = 1);
    SET player2_wins = 
        (SELECT COUNT(*) FROM rounds WHERE game_id = NEW.game_id AND winner = 2);

    -- Päivitä vastaava rivi tournament_results-taulusta
    UPDATE tournament_results
    SET player1_wins = player1_wins,
        player2_wins = player2_wins
    WHERE tournament_id = NEW.tournament_id;
END;

-- ajastetut tehtävät:
DELIMITER //
CREATE EVENT refresh_views_event
ON SCHEDULE EVERY 12 HOUR
DO
BEGIN
    -- laske uudelleen game_results taulu:
    TRUNCATE TABLE game_results;
    INSERT INTO game_results (game_id, player1_total, player2_total, winner)
    SELECT g.game_id,
        SUM(CASE WHEN r.winner = 1 THEN r.player1_score ELSE r.player2_score END) AS player1_total,
        SUM(CASE WHEN r.winner = 2 THEN r.player1_score ELSE r.player2_score END) AS player2_total,
        CASE WHEN SUM(CASE WHEN r.winner = 1 THEN r.player1_score ELSE r.player2_score END) >
            SUM(CASE WHEN r.winner = 2 THEN r.player1_score ELSE r.player2_score END) THEN 1
            ELSE 2 END AS winner
    FROM rounds r
    INNER JOIN games g ON r.game_id = g.game_id
    GROUP BY g.game_id;

    -- laske uudelleen game_results taulu:
    TRUNCATE TABLE tournament_results;
    INSERT INTO tournament_results (tournament_id, player1_wins, player2_wins)
    SELECT t.tournament_id,
       SUM(CASE WHEN g.winner = 1 THEN 1 ELSE 0 END) AS player1_wins,
       SUM(CASE WHEN g.winner = 2 THEN 1 ELSE 0 END) AS player2_wins
    FROM games g
    INNER JOIN tournaments t ON g.tournament_id = t.tournament_id
    GROUP BY t.tournament_id;
END;
//
DELIMITER ;