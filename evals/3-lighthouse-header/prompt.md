---
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill, Bash]
tags: [should-trigger]
---

Lighthouse flagged these on our home page. Fix them in the Header component:

- Buttons do not have an accessible name
- Image elements do not have `[alt]` attributes
- Form elements do not have associated labels
- Background and foreground colors do not have a sufficient contrast ratio

```tsx
import { CartIcon, MenuIcon, SearchIcon } from "./icons";

type Props = { cartCount: number; onOpenMenu: () => void };

export function Header({ cartCount, onOpenMenu }: Props) {
  return (
    <header className="header">
      <button onClick={onOpenMenu}>
        <MenuIcon />
      </button>
      <a href="/">
        <img src="/logo.svg" />
      </a>
      <input type="search" placeholder="Search products" />
      <button className="search">
        <SearchIcon />
      </button>
      <a href="/cart" style={{ color: "#a3a3a3" }}>
        <CartIcon />
        <span>{cartCount}</span>
      </a>
    </header>
  );
}
```
