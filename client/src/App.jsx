import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:3001/api/chat";
const SUGGESTED_URL = "http://localhost:3001/api/suggested-prompts";
const UPLOAD_URL = "http://localhost:3001/api/upload";
const ACTIVE_FILE_URL = "http://localhost:3001/api/active-file";

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hei! Jeg kan hjelpe deg med spørsmål om WCAG, universell utforming og forslag til forbedringer.",
};

const PDF_SUGGESTED_PROMPTS = [
  "Kan du oppsummere rapporten?",
  "Hva er de viktigste funnene i rapporten?",
  "Hvilke tiltak bør prioriteres først?",
  "Hvilke WCAG-relaterte utfordringer peker rapporten på?",
];

export default function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("testfest-darkmode");
    return saved === "true";
  });

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const settingsRef = useRef(null);
  const fileInputRef = useRef(null);

  const showSuggestedPrompts =
    messages.length === 1 && messages[0].role === "assistant";

  useEffect(() => {
    async function fetchSuggestedPrompts() {
      try {
        const response = await fetch(SUGGESTED_URL);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Kunne ikke hente foreslåtte spørsmål");
        }

        setSuggestedPrompts(data.items || []);
      } catch (error) {
        console.error("Kunne ikke hente foreslåtte spørsmål:", error);
      }
    }

    async function fetchActiveFile() {
      try {
        const response = await fetch(ACTIVE_FILE_URL);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Kunne ikke hente aktiv fil");
        }

        setActiveFile(data.file || null);
      } catch (error) {
        console.error("Kunne ikke hente aktiv fil:", error);
      }
    }

    fetchSuggestedPrompts();
    fetchActiveFile();
  }, []);

  useEffect(() => {
    localStorage.setItem("testfest-darkmode", String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    }

    if (showSettingsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettingsMenu]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowPrivacyModal(false);
      }
    }

    if (showPrivacyModal) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showPrivacyModal]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleNewConversation() {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setSelectedFile(null);
    setShowSettingsMenu(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      await fetch(ACTIVE_FILE_URL, { method: "DELETE" });
    } catch (error) {
      console.error("Kunne ikke fjerne aktiv PDF:", error);
    }

    setActiveFile(null);
  }

  async function sendChatMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const updatedMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const history = updatedMessages
        .slice(0, -1)
        .filter((msg) => !(msg.role === "assistant" && msg.source === "database"))
        .map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }));

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ukjent feil");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "Ingen respons mottatt.",
          source: data.source || "llm",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Beklager, noe gikk galt: ${error.message}`,
          source: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await sendChatMessage(input);
  }

  async function handleSuggestedPrompt(prompt) {
    if (loading) return;

    setMessages((prev) => [...prev, { role: "user", content: prompt.title }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${SUGGESTED_URL}/${prompt.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke hente foreslått svar");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "Ingen respons mottatt.",
          source: "database",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Beklager, noe gikk galt: ${error.message}`,
          source: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePdfSuggestedPrompt(prompt) {
    await sendChatMessage(prompt);
  }

  async function handleUpload() {
    if (!selectedFile || uploading) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);

    try {
      const response = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke laste opp fil");
      }

      setActiveFile(data.file || null);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `PDF lastet opp: ${data.file?.name}. Du kan nå stille spørsmål om dokumentet.`,
          source: "system",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Kunne ikke laste opp PDF: ${error.message}`,
          source: "error",
        },
      ]);
    } finally {
      setUploading(false);
    }
  }

  async function handleClearActiveFile() {
    try {
      const response = await fetch(ACTIVE_FILE_URL, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke fjerne aktiv fil");
      }

      setActiveFile(null);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Den aktive PDF-en er fjernet fra denne chatten.",
          source: "system",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Kunne ikke fjerne PDF: ${error.message}`,
          source: "error",
        },
      ]);
    }
  }

  const theme = {
    pageBg:
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900",
    headerBg: isDarkMode ? "bg-slate-900" : "bg-white",
    panelBg: isDarkMode ? "bg-slate-900" : "bg-white",
    mutedCard:
      isDarkMode
        ? "bg-slate-800 text-slate-100"
        : "bg-slate-100 text-slate-900",
    userCard: "bg-blue-600 text-white",
    subText: isDarkMode ? "text-slate-300" : "text-slate-600",
    border: isDarkMode ? "border-slate-700" : "border-slate-200",
    inputBg: isDarkMode
      ? "bg-slate-900 text-slate-100 border-slate-700"
      : "bg-white text-slate-900 border-slate-300",
    suggestionCard: isDarkMode
      ? "border-slate-700 bg-slate-800 text-slate-100 hover:border-blue-400 hover:bg-slate-700"
      : "border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-400 hover:bg-blue-50",
    settingsButton: isDarkMode
      ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
    menuBg: isDarkMode
      ? "border-slate-700 bg-slate-900 text-slate-100"
      : "border-slate-200 bg-white text-slate-900",
    toggleBg: isDarkMode ? "bg-slate-700" : "bg-slate-200",
    toggleKnob: isDarkMode
      ? "translate-x-5 bg-blue-500"
      : "translate-x-0 bg-white",
    badgeBg: isDarkMode
      ? "bg-slate-700 text-slate-200"
      : "bg-slate-200 text-slate-700",
    secondaryButton: isDarkMode
      ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
    modalOverlay: "bg-black/50",
    modalBg: isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900",
  };

  return (
    <main className={`min-h-screen transition-colors ${theme.pageBg}`}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleNewConversation}
            className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition ${theme.secondaryButton}`}
          >
            Ny samtale
          </button>

          <div ref={settingsRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettingsMenu((prev) => !prev)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition ${theme.settingsButton}`}
                aria-haspopup="menu"
                aria-expanded={showSettingsMenu}
                aria-label="Åpne innstillinger"
                title="Innstillinger"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {showSettingsMenu && (
                <div
                  className={`absolute right-0 z-20 mt-2 w-72 rounded-2xl border p-4 shadow-lg ${theme.menuBg}`}
                  role="menu"
                >
                  <h2 className="mb-3 text-sm font-semibold">Innstillinger</h2>

                  <div className="flex items-center justify-between gap-4 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">Dark mode</p>
                      <p className={`text-xs ${theme.subText}`}>
                        Bytt mellom lyst og mørkt tema
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsDarkMode((prev) => !prev)}
                      className={`relative h-7 w-12 rounded-full transition ${theme.toggleBg}`}
                      aria-pressed={isDarkMode}
                      aria-label="Bytt dark mode"
                    >
                      <span
                        className={`absolute left-1 top-1 h-5 w-5 rounded-full transition-transform ${theme.toggleKnob}`}
                      />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPrivacyModal(true);
                      setShowSettingsMenu(false);
                    }}
                    className={`mt-4 w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${theme.secondaryButton}`}
                  >
                    Personvern
                  </button>

                  <div
                    className={`mt-4 border-t pt-3 text-xs ${theme.border} ${theme.subText}`}
                  >
                    Flere innstillinger kommer her.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <header className={`mb-6 rounded-2xl p-6 shadow-sm ${theme.headerBg}`}>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
            Testfest-Chatbot
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Chatbot for WCAG og universell utforming
          </h1>
        </header>

        <section
          className={`flex flex-1 flex-col rounded-2xl shadow-sm ${theme.panelBg}`}
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
            {messages.map((msg, index) => (
              <div key={index}>
                <div
                  className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-6 ${
                    msg.role === "user"
                      ? `ml-auto ${theme.userCard}`
                      : theme.mutedCard
                  }`}
                >
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
                    {msg.role === "user" ? "Du" : "Assistent"}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {msg.role === "assistant" && msg.source === "database" && (
                  <div className="mt-2 max-w-3xl">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs ${theme.badgeBg}`}
                    >
                      Forhåndsskrevet svar
                    </span>
                  </div>
                )}

                {msg.role === "assistant" && msg.source === "llm+file" && (
                  <div className="mt-2 max-w-3xl">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs ${theme.badgeBg}`}
                    >
                      Svar basert på opplastet PDF
                    </span>
                  </div>
                )}
              </div>
            ))}

            {showSuggestedPrompts && !activeFile && suggestedPrompts.length > 0 && (
              <div className="mt-6">
                <p className={`mb-3 text-sm font-semibold ${theme.subText}`}>
                  Forslag til spørsmål du kan stille:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => handleSuggestedPrompt(prompt)}
                      disabled={loading}
                      className={`rounded-2xl border p-4 text-left text-sm shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${theme.suggestionCard}`}
                    >
                      {prompt.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeFile && messages.length <= 2 && (
              <div className="mt-6">
                <p className={`mb-3 text-sm font-semibold ${theme.subText}`}>
                  Forslag til spørsmål om rapporten:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {PDF_SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handlePdfSuggestedPrompt(prompt)}
                      disabled={loading}
                      className={`rounded-2xl border p-4 text-left text-sm shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${theme.suggestionCard}`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div
                className={`max-w-3xl rounded-2xl px-4 py-3 text-sm ${theme.mutedCard}`}
              >
                Tenker …
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className={`border-t p-4 md:p-6 ${theme.border}`}
          >
            <label
              htmlFor="chat-input"
              className="mb-2 block text-sm font-medium"
            >
              Still et spørsmål:
            </label>

            {activeFile && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${theme.badgeBg}`}
                >
                  <span className="font-medium">PDF:</span>
                  <span>{activeFile.name}</span>
                </div>

                <button
                  type="button"
                  onClick={handleClearActiveFile}
                  className={`rounded-full border px-3 py-2 text-xs transition ${theme.secondaryButton}`}
                >
                  Fjern
                </button>
              </div>
            )}

            {selectedFile && !activeFile && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${theme.badgeBg}`}
                >
                  <span className="font-medium">Valgt:</span>
                  <span>{selectedFile.name}</span>
                </div>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="rounded-full bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? "Laster opp …" : "Last opp"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className={`rounded-full border px-3 py-2 text-xs transition ${theme.secondaryButton}`}
                >
                  Fjern valgt fil
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={openFilePicker}
                disabled={loading || uploading}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-sm transition ${theme.settingsButton} disabled:cursor-not-allowed disabled:opacity-60`}
                aria-label="Last opp PDF"
                title="Last opp PDF"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 5v14"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14"
                  />
                </svg>
              </button>

              <textarea
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeFile
                    ? "For eksempel: Hva er de viktigste funnene i denne rapporten?"
                    : "For eksempel: Hva er WCAG?"
                }
                rows={3}
                className={`min-h-[88px] flex-1 rounded-2xl border px-4 py-3 outline-none transition focus:border-blue-500 ${theme.inputBg}`}
              />

              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-2xl bg-blue-600 px-5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      </div>

      {showPrivacyModal && (
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${theme.modalOverlay}`}
          onClick={() => setShowPrivacyModal(false)}
        >
          <div
            className={`max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl ${theme.modalBg}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id="privacy-title" className="text-xl font-bold">
                  Personvern
                </h2>
                <p className={`mt-1 text-sm ${theme.subText}`}>
                  Informasjon om hvordan data behandles i chatboten.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className={`rounded-xl border px-3 py-2 text-sm transition ${theme.secondaryButton}`}
              >
                Lukk
              </button>
            </div>

            <div className="space-y-5 text-sm leading-6">
              <section>
                <h3 className="font-semibold">Hva som sendes til språkmodellen</h3>
                <p className={`mt-1 ${theme.subText}`}>
                  Når du skriver i chatten, sendes meldingen din og relevant
                  samtalehistorikk til Google Gemini API for å generere svar.
                </p>
              </section>

              <section>
                <h3 className="font-semibold">Opplastede PDF-filer</h3>
                <p className={`mt-1 ${theme.subText}`}>
                  Hvis du laster opp en PDF, mottas filen først av backend-tjenesten
                  og lastes deretter opp til Gemini Files API for dokumentforståelse.
                  Den lokale kopien slettes etter opplasting.
                </p>
              </section>

              <section>
                <h3 className="font-semibold">Lagringstid</h3>
                <p className={`mt-1 ${theme.subText}`}>
                  Opplastede filer lagres ikke permanent i denne prototypen. Filer
                  som lastes opp til Gemini Files API kan lagres midlertidig hos
                  Google i opptil 48 timer.
                </p>
              </section>

              <section>
                <h3 className="font-semibold">Viktig å være oppmerksom på</h3>
                <p className={`mt-1 ${theme.subText}`}>
                  Unngå å laste opp sensitiv, fortrolig eller personidentifiserbar
                  informasjon uten at dette er særskilt vurdert. Løsningen er en
                  prototype og bør vurderes nærmere før bruk med reelle rapporter
                  eller andre sensitive dokumenter.
                </p>
              </section>

              <section>
                <h3 className="font-semibold">Formål</h3>
                <p className={`mt-1 ${theme.subText}`}>
                  Chatboten er laget for å hjelpe med spørsmål om WCAG,
                  universell utforming og tolkning av testfest-relaterte funn.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}