---
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill, Bash]
tags: [should-trigger]
---

Um cliente reclamou que não consegue assinar a newsletter usando leitor de tela. O que tem de errado nesse formulário?

```tsx
import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError(true);
      return;
    }
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h4>Receba ofertas</h4>
      <input
        type="email"
        placeholder="Seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ borderColor: error ? "red" : "#ccc" }}
      />
      <div className="submit" onClick={handleSubmit}>
        Assinar
      </div>
      {sent && <p className="toast">Pronto! Você vai receber nossas ofertas.</p>}
    </form>
  );
}
```
