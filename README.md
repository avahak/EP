Express.js ja React koodia biljardiliigan verkkosivuille.  
  
---  
  
Tiedostojen ja hakemistojen tarkoitukset:  
  
index.html - Reactin lataava html  
  
src/ - Lähdekoodin pääasiallinen hakemisto  
src/main.tsx - Reactin juurena oleva tiedosto, lisää src/router/AppRouter.tsx  
        dokumenttiin  

src/server/ - Palvelinpuolen koodin hakemisto  
src/server/server.ts - Express serverin koodi, toteuttaa api-rajapinnan Reactille   
        ja välittää tiedostoja   
src/server/imageTools.ts - Kuvankäsittelyyn liittyviä apufunktioita  
src/server/hough.ts - Hough-muunnoksen koodi  
src/server/homography.ts - Koodi kahden kuvan yhteisten piirteiden löytämiseen ja  
        vastaavan homografian löytämiseen  
src/server/test.ts - ei käytössä  
  
src/router/ - Hakemisto React App reittien määrittelyyn   
src/router/AppRouter.tsx - Määrittelee kaikki Reactin käytössä olevat reitit  
  
src/components/ - Hakemisto React komponenttien koodille  
src/components/App.tsx - Määrittelee näkymän reitille '/'.   
        Tämä on käytännössä verkkosivun etusivu.  
src/components/AddPlayerModal.tsx - Uuden pelaajan lisäys ikkuna (modaali), käytetään  
        komponentissa ScoreSheet.tsx  
src/components/DrawHomography.tsx - Homografian piirtämiseen käytettävä komponentti  
src/components/HomographyDemo.tsx - Yksinkertainen sivu homografian esittelemiseen  
src/components/DrawHough.tsx - ei käytössä  
src/components/HoughDemo.tsx - Sivu Hough-muunnoksen esittelemiseen esimerkkien avulla  
src/components/FileUpload.tsx - Yksinkertainen työkalu tiedostojen lataamiseen serverille    
src/components/Frontpage.tsx - ei käytössä  
src/components/ScoreTable.tsx - Piirtää tulostaulukon (taulu jokaisen peli  
        lopputuloksesta)  
src/components/ScoreTable.css - tyylitiedosto ScoreTable.tsx käyttöön  
src/components/Scoresheet.tsx - Lomake ottelun tulosten syöttämiseen  
src/components/Scoresheet.css - tyylitiedosto Scoresheet.tsx käyttöön  
src/components/ThumbnailSelector.tsx - Yksinkertainen valintalaatikko esikatselukuvien   
        esittämiseen  
src/components/VisionExample.tsx - Esimerkki Google Vision API tuloksesta  
  
src/utils/ - Hakemisto React App apufunktioille eri komponenttien käyttöön  
src/utils/apiUtils.ts - Apufunktio api rajapinnan osoitteelle  
  
src/types/ - TypeScript-tyyppien käytössä tarvittavia moduulilaajennuksia.  
        Nämä voi jättää huomioimatta ja tarvitaan vain teknisistä syistä.  