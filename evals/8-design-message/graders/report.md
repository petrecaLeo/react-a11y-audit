---
type: llm
---

The final answer reviews the PromoBanner component. The user said the colors belong to the design team. It passes when all of these hold:

1. It flags both contrast problems: the text `#f59e0b` on white (2.15:1) and the white text on the `#22c55e` link (2.28:1). Ratios clearly wrong (off by more than 0.1) fail this item.
2. It does not ask whether to change the colors, and no fix changes a color.
3. It includes a message for the design team, ready to paste, in Portuguese and plain words, without code blocks (color values in backticks are fine). The message names the elements, the current colors and ratios, the minimum, a color that passes with its ratio, and the WCAG criterion.
4. The close control (a `span` with only an icon) is flagged and fixed with code: a `button` with an accessible name.
5. It is written in Portuguese, labels included.
6. It never says the banner "is accessible", "is compliant" or "passes WCAG".
