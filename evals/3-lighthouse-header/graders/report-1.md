---
type: llm
---

The final answer fixes the Lighthouse issues in the Header component. It passes when this holds: Both icon-only buttons (menu and search) get an accessible name, from an `aria-label` on the button or from visible or visually hidden text. Hiding the icons with `aria-hidden` is optional when the button has an `aria-label`, because the label replaces the button's content.
