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

_node -v_

_npm -v_

## 2. Opprett .env i server

Lag en fil som heter .env inne i server-mappen.

Eksempel:

PORT=3001

GEMINI_API_KEY=DIN_API_NOKKEL

**Endre "DIN_API_NOKKEL" med egen API nøkkel.**

## 3. Installer avhengigheter

Fra rotmappen i prosjektet:

_npm install_

Installer deretter avhengigheter for backend og frontend:

_cd server_

_npm install_

_cd ../client_

_npm install_

## 4. Start prosjektet

Fra rotmappen:

_npm run dev_

**Backend starter på localhost:3001**

**Frontend starter på localhost:5173**

## 5. Åpne chatbot i nettleser

Gå til:
http://localhost:5173
