Express.js, React, ja MySQL koodia biljardiliigan verkkosivuille.  
  
---  
```
Tiedostojen ja hakemistojen tarkoitukset:  
  
index.html - Reactin lataava html  
  
src/ - Lähdekoodin hakemisto  
        main.tsx - Reactin juurena oleva tiedosto, lisää 
                src/client/router/AppRouter.tsx dokumenttiin  

src/server/ - Palvelinpuolen koodin hakemisto  
        server.ts - Express serverin koodi, toteuttaa api-rajapinnan Reactille   
                ja välittää tiedostoja   
        imageTools.ts - Kuvankäsittelyyn liittyviä apufunktioita  
        hough.ts - Hough-muunnoksen koodi  
        homography.ts - Koodi kahden kuvan yhteisten piirteiden löytämiseen ja  
                vastaavan homografian löytämiseen  

src/server/database/ - Hakemisto SQL-tietokantaan liittyvälle koodille
        dbGeneral.ts - Kokoelma yleisiä tietokantaa käsitteleviä funktioita
        dbSpecific.ts - Kokoelma tätä tiettyä tietokantaa käsitteleviä funktioita
        dbFakeData.ts - Tietokannan testidatan generointia
        testaus_ep_tables.sql - Testaustietokannan taulut määrittelevä kaavio
        testaus_ep_triggers.sql - Idea tulosten automaattiselle laskulle
                käyttäen pelkästään ep_erat dataa ja johtaen/laskien muut näistä.

src/shared/ - Yhteinen kansio Express.js ja Reactille
        dbTypes.ts - Typescript tyypit tietokannan tauluille
        generalUtils.ts - Yleisiä apufunktioita (esimerkiksi päivämäärien muunnoksia)
        parseMatch.ts - Funktioita lomakkeen tietojen muuttamiseksi tietokannan 
                käsittelemään muotoon
        types/ - TypeScript-tyyppien käytössä tarvittavia moduulilaajennuksia.  
                Nämä voi jättää huomioimatta ja tarvitaan vain teknisistä syistä.  
  
src/client/ - Hakemisto React koodille

src/client/router/ - Hakemisto React App reittien määrittelyyn   
        AppRouter.tsx - Määrittelee kaikki Reactin käytössä olevat reitit  
  
src/client/components/ - Hakemisto React komponenttien koodille  
        App.tsx - Määrittelee näkymän reitille '/'. 
                Tämä on käytännössä verkkosivun etusivu.  
        DBTest.tsx - Sivu tietokannan uudelleen luomiselle
        FileUpload.tsx - Yksinkertainen työkalu tiedostojen lataamiseen serverille    
        ResultTable.tsx - Yleinen komponentti taulumuotoisen datan esittämiseen
        ThumbnailSelector.tsx - Yksinkertainen valintalaatikko 
                esikatselukuvien esittämiseen  

src/client/scoresheet/ - Hakemisto Scoresheet komponentille ja sen osille
        ScoreTable.tsx - Piirtää tulostaulukon (taulu jokaisen peli lopputuloksesta)  
        ScoreTable.css - tyylitiedosto ScoreTable.tsx käyttöön  
        Scoresheet.tsx - Lomake ottelun tulosten syöttämiseen tai esittämiseen
        Scoresheet.css - tyylitiedosto Scoresheet.tsx käyttöön  
        AddPlayerModal.tsx - Uuden pelaajan lisäys ikkuna (modaali), 
                käytetään komponentissa ScoreSheet.tsx  

src/client/result_submit/ - Hakemisto tulosten ilmoittamisen sivulle
        ResultSubmission.tsx - Sivu tulosten ilmoittamiselle, käyttää 
                MatchChooser ja Scoresheet komponentteja.
        MatchChooser.tsx - Komponentti ottelun valintaan (koti/vieras) 
                tulosten ilmoittamista varten.
        MatchChooser.css - Tyylitiedosto MatchChooser.tsx käyttöön.

src/client/machine_vision/ - Hakemisto konenäköön liittyville sivuille
        DrawHomography.tsx - Homografian piirtämiseen käytettävä komponentti  
        HomographyDemo.tsx - Yksinkertainen sivu homografian esittelemiseen  
        DrawHough.tsx - ei käytössä  
        HoughDemo.tsx - Sivu Hough-muunnoksen esittelemiseen esimerkkien avulla  
        VisionExample.tsx - Esimerkki Google Vision API tuloksesta  

src/client/sandbox/ - Sekalaista koodia testausta varten

src/client/result_tables/ - Muutama tulostaulu
        DisplayResultsTeams.tsx - Sivu joukkueiden tulostaululle.
        DisplayResultsPlayers.tsx - Sivu pelaajien tulostaululle.
  
src/client/utils/ - Hakemisto React App apufunktioille eri komponenttien käyttöön  
        apiUtils.ts - Apufunktio api rajapinnan osoitteelle
        matchLoader.ts - Hakee yhden ottelun tiedot (mukaanlukien pelaajat, tulokset)
``` 