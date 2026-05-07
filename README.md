# Bloemenveld Frankendael

Voor het Bloemenveld Frankendael ontwikkel ik een webapplicatie die bezoekers helpt de bloemen en planten in het park te ontdekken. De focus ligt op planten die op dit moment in bloei staan. De app gaat verder dan alleen informatie via interactieve opdrachten leren gebruikers de specifieke kenmerken van planten herkennen, wat zorgt voor een actieve en educatieve ervaring in het veld.

De focus lag hierbij op het implementeren van robuuste GET- en POST-methoden om een goede gebruikerservaring te creëren.

POST-methode
In plaats van statische informatie, heb ik een interactieve flow ontwikkeld waarbij de POST-methode drie acties tegelijkertijd afhandelt zodra een gebruiker een opdracht voltooit:

Registratie: De voltooiing van de specifieke opdracht wordt direct vastgelegd in de database.

Plant naar de collectie: De betreffende plant wordt toegevoegd aan de persoonlijke collectie van de gebruiker (gamification).

Veldverkenner Update: De status van de betreffende zone op de veldverkenner wordt bijgewerkt, waardoor de voortgang van de bezoeker visueel zichtbaar wordt op de kaart.

Data-ophaling (GET)
Middels GET-verzoeken zorg ik ervoor dat de app altijd de meest actuele plantkenmerken en zonestatussen toont, zodat de informatie in het veld synchroon loopt met de database omgeving.

Ook heb ik mij deze script gefocussed op 2 PATCH functies, het selecteren van een memoji en zelf de accent kleur van de app instellen. Dat werkt als volgt:

<img width="394" height="742" alt="Screenshot 2026-05-06 at 11 33 59" src="https://github.com/user-attachments/assets/014267b1-7a0f-46f0-8b48-bf10845f3e7f" />
<img width="402" height="735" alt="Screenshot 2026-05-06 at 11 34 04" src="https://github.com/user-attachments/assets/9489a4f7-fabe-442d-b4b6-8a03a78f31e8" />
<img width="415" height="751" alt="Screenshot 2026-05-06 at 11 34 07" src="https://github.com/user-attachments/assets/5d686195-b61c-4f52-8944-a20365f9b9e3" />
<img width="372" height="65" alt="Screenshot 2026-05-06 at 11 34 18" src="https://github.com/user-attachments/assets/9e467bf4-5231-412d-bd08-cb4c5eac9d37" />
<img width="383" height="117" alt="Screenshot 2026-05-06 at 11 34 29" src="https://github.com/user-attachments/assets/9ed769b1-0d43-46ad-b267-c2352ab76346" />
<img width="366" height="70" alt="Screenshot 2026-05-06 at 11 34 34" src="https://github.com/user-attachments/assets/40db5075-7d72-4506-bbd7-1cee56647c25" />


Developer

@GijsNagtegaal

## Inhoudsopgave

## Beschrijving

Hieronder is een video te zien hoe de opdrachten flow werkt:

https://github.com/user-attachments/assets/101e9597-13df-40ca-96e8-2285e6c9f39d

De live site is hier te vinden: https://user-experience-enhanced-website-hiu8.onrender.com

## Gebruik
<!-- Bij Gebruik staat de user story, hoe het werkt en wat je er mee kan. -->

Het uiteindelijke doel van de webapp is dat gebruikers van de app opdrachten kunnen doen, zones afvinken en hierdoor badges verdienen. 
Ook is het belangrijk dat je je collectie kan zien en meer info over een bloem / plant kan vinden.

## Licentie

This project is licensed under the terms of the [MIT license](./LICENSE).
