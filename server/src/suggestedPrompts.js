import db from "./db.js";

export function getSuggestedPrompts() {
  return db.prepare(`
    SELECT id, title
    FROM suggested_prompts
    ORDER BY sort_order ASC, id ASC
  `).all();
}

export function getSuggestedPromptById(id) {
  return db.prepare(`
    SELECT id, title, answer
    FROM suggested_prompts
    WHERE id = ?
  `).get(id);
}

export function addSuggestedPrompt({ title, answer, sort_order = 0 }) {
  const stmt = db.prepare(`
    INSERT INTO suggested_prompts (title, answer, sort_order)
    VALUES (?, ?, ?)
  `);

  return stmt.run(title, answer, sort_order);
}