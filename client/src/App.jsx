import { useState } from "react";

const API_URL = "http://localhost:3001/api/chat";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hei! Jeg kan hjelpe deg med spørsmål om WCAG, universell utforming og forslag til forbedringer.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const updatedMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const history = updatedMessages.slice(0, -1).map((msg) => ({
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
        { role: "assistant", content: data.answer || "Ingen respons mottatt." },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Beklager, noe gikk galt: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8">
        <header className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
            testfest.no
          </p>
          <h1 className="mt-2 text-3xl font-bold">Chatbot for WCAG og universell utforming</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            En enkel startversjon som kan utvides med testfest-data, vurderingslogikk og mer domenespesifikke svar.
          </p>
        </header>
<section className="flex flex-1 flex-col rounded-2xl bg-white shadow-sm">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-6 ${
                  msg.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
                  {msg.role === "user" ? "Du" : "Assistent"}
                </p>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}

            {loading && (
              <div className="max-w-3xl rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                Assistenten skriver …
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="border-t border-slate-200 p-4 md:p-6">
            <label htmlFor="chat-input" className="mb-2 block text-sm font-medium">
              Still et spørsmål
            </label>
            <div className="flex flex-col gap-3 md:flex-row">
              <textarea
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="For eksempel: Hva betyr WCAG 1.4.3 om kontrast?"
                rows={3}
                className="min-h-[88px] flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}