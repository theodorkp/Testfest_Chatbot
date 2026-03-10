# Chatbot for Testfest

Dette prosjektet er en chatbot laget for **Testfest**, med mål om å hjelpe **tjenesteeiere** med informasjon om **WCAG** og **universell utforming**.

## Teknologi

Prosjektet består av:

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **LLM/API:** Gemini 2.5 Flash

## Formål

Chatboten skal kunne:

- svare på spørsmål om WCAG og universell utforming
- forklare krav og begreper på en enkel og nyttig måte
- hjelpe tjenesteeiere med å forstå tilgjengelighetsutfordringer
- senere kunne gi forslag til forbedringer basert på testfest-data

---

## Kom i gang

Følg stegene under etter at du har klonet repoet.

## 1. Installer Node.js

Prosjektet krever at Node.js og npm er installert.
Du kan sjekke om dette er installert ved å kjøre:
node -v
npm -v

## 2. Opprett .env i server

Lag en fil som heter .env inne i server-mappen.

Eksempel:

PORT=3001

GEMINI_API_KEY=DIN_API_NOKKEL

Legg inn egen API nøkkel.

## 3. Intstaller avhengigheter

Fra rotmappen i prosjektet:
npm install

Installer deretter avhengigheter for backend og frontend:
cd server
npm install
cd client
npm install

## 4. Start prosjektet

Fra rotmappen:
npm run dev

Backend starter på localhost:3001
Frontend starter på localhost:5173

## 5. Åpne chatbot i nettleser

Gå til:
http://localhost:5173