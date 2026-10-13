---
type: llm
---

The final answer is an accessibility report for the ProductCard component. It passes when all of these hold:

1. It flags the clickable `div` that navigates (should be a link) and the clickable `span` with only an icon (should be a `button` with an accessible name).
2. It flags the `img` without `alt`.
3. It flags the contrast of the prices: `#16a34a` on white is 3.30:1 and `#9ca3af` is 2.54:1, both below 4.5:1 for 14px text. Either the exact ratios are given or they are marked to check in the browser; ratios that are clearly wrong (off by more than 0.1) fail this item. For these colors it offers a passing color with its ratio and asks the user to decide (for example: apply it, keep it and flag it to design, or change a theme token), instead of presenting a new color as the fix.
4. Every Critical or Serious finding names a WCAG criterion and shows a concrete fix. For a color, pointing to the question in item 3 counts as the fix. Lower-severity findings may skip the fix.
5. No finding is about a problem the pasted code doesn't have (for example, a favorite state the component never receives), and no finding is a bug unrelated to accessibility. Suggestions for later are fine inside a fix.
6. It never says the component "is accessible", "is compliant" or "passes WCAG".
