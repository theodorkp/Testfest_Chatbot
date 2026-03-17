import db from "./db.js";
import { addSuggestedPrompt } from "./suggestedPrompts.js";

const existing = db.prepare(`SELECT COUNT(*) as count FROM suggested_prompts`).get();

if (existing.count === 0) {
  addSuggestedPrompt({
    title: "Hva er forskjellen på WCAG og universell utforming?",
    answer:
      "WCAG er et sett med retningslinjer for tilgjengelig webinnhold, mens universell utforming er et bredere prinsipp som handler om at produkter og tjenester skal kunne brukes av flest mulig. WCAG kan derfor ses som et konkret verktøy eller rammeverk innen universell utforming av digitale løsninger.",
    sort_order: 1,
  });

  addSuggestedPrompt({
    title: "Hva er de vanligste feilene som blir funnet under en testfest?",
    answer:
      "Vanlige funn under en testfest er ofte lav kontrast, manglende ledetekster i skjemaer, dårlig tastaturnavigasjon, uklare lenketekster, feil bruk av overskrifter og utilstrekkelig støtte for skjermleser. Hvilke funn som er viktigst å prioritere avhenger av hvor mange brukere som påvirkes og hvor kritisk funksjonaliteten er.",
    sort_order: 2,
  });

  addSuggestedPrompt({
    title: "Hvordan kan vi forbedre tilgjengeligheten i et skjema?",
    answer:
      "Et godt utgangspunkt er å sørge for tydelige labels, gode feilmeldinger, korrekt kobling mellom label og input, logisk tab-rekkefølge, støtte for tastatur og tydelige instruksjoner. I tillegg bør skjemaet fungere godt med skjermleser og ha tilstrekkelig kontrast.",
    sort_order: 3,
  });

  addSuggestedPrompt({
    title: "Hva bør vi prioritere først hvis tjenesten vår har flere UU-feil?",
    answer:
      "Start med feil som blokkerer brukere fra å fullføre sentrale oppgaver. Det kan være problemer med innlogging, skjemaer, navigasjon, kontrast eller tastaturbruk. Prioriter først det som påvirker kritiske brukerreiser og mange brukere, og ta deretter mindre alvorlige forbedringer.",
    sort_order: 4,
  });

  console.log("Seedet suggested prompts.");
} else {
  console.log("Suggested prompts finnes allerede.");
}