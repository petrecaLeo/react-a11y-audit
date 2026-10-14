---
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
tags: [should-not-trigger, focus-word]
---

My search input loses focus every time I type a letter. Why?

```tsx
import { useState } from "react";

export function ProductSearch({ products }: { products: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");

  function SearchBox() {
    return <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" />;
  }

  const results = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <SearchBox />
      <ul>
        {results.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
```
