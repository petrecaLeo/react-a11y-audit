---
type: llm
---

The final answer is an accessibility report for the ProductCard component. It passes when this holds: It flags the contrast of the prices: `#16a34a` on white is 3.30:1 and `#9ca3af` is 2.54:1, both below 4.5:1 for 14px text. Either the exact ratios are given or they are marked to check in the browser; ratios that are clearly wrong (off by more than 0.1) fail this item. For these colors it offers a passing color with its ratio and asks the user to decide (for example: apply it, keep it and flag it to design, or change a theme token), instead of presenting a new color as the fix.
