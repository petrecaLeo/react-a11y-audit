---
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill, Bash]
tags: [should-trigger, design]
---

Revisa a acessibilidade desse banner? As cores aqui são do time de design, eu não posso mudar. Os problemas de cor eu repasso pra eles.

```tsx
import { CloseIcon } from "./icons";

export function PromoBanner({ onClose }: { onClose: () => void }) {
  return (
    <section className="promo" style={{ background: "#ffffff" }}>
      <p style={{ color: "#f59e0b", fontSize: 16 }}>Frete grátis acima de R$ 199</p>
      <a href="/ofertas" style={{ background: "#22c55e", color: "#ffffff", fontSize: 14, padding: "8px 16px" }}>
        Ver ofertas
      </a>
      <span className="close" onClick={onClose}>
        <CloseIcon />
      </span>
    </section>
  );
}
```
