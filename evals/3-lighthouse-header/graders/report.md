---
type: llm
---

The final answer fixes the Lighthouse issues in the Header component. It passes when all of these hold:

1. Both icon-only buttons (menu and search) get an accessible name, and the icons are hidden from screen readers or the name comes from visible or visually hidden text.
2. The logo image inside the home link gets an `alt` that describes the link (the site or brand name, or "Home"), not "logo image".
3. The search input gets a label (a `<label>`, `aria-label` or `aria-labelledby`), not only the placeholder.
4. The cart link color `#a3a3a3` (2.52:1 on white) is reported, but the fixed code keeps it: the answer offers a color with at least 4.5:1, gives its ratio, and asks the user whether to apply it. Changing the color in the fixed code fails this item. Ratios clearly wrong (off by more than 0.1) also fail it.
5. The cart link gets a name that says what it is (for example "Cart, 3 items"), not only the number.
6. It never says the header "is accessible", "is compliant" or "passes WCAG".
