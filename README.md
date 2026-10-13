# react-a11y-audit

[Português](README.pt-BR.md)

A Claude Code skill that reviews React components for accessibility against WCAG 2.2 level AA. It finds problems with contrast, ARIA, focus, keyboard navigation, form labels and alt text, and writes the code fix for each one.

## Example

You ask: *"Audit the accessibility of this component before we ship it"*, with this component:

```tsx
export function ProductCard({ id, name, image, price, oldPrice, onFavorite }: Props) {
  const router = useRouter();

  return (
    <div className="card" onClick={() => router.push(`/product/${id}`)}>
      <img src={image} />
      <div className="title">{name}</div>
      {oldPrice && (
        <span style={{ color: "#9ca3af", textDecoration: "line-through" }}>${oldPrice}</span>
      )}
      <span style={{ color: "#16a34a", fontSize: 14 }}>${price}</span>
      <span className="favorite" onClick={(e) => { e.stopPropagation(); onFavorite(id); }}>
        <HeartIcon />
      </span>
    </div>
  );
}
```

The skill answers with a report. This excerpt is from a real run with Claude Sonnet 5.5:

> **3 critical, 3 serious, 2 moderate, 1 minor. 3 items to check in the browser.**
>
> **2. [Critical] Favorite control is a `span` with `onClick` and has no name**
> **WCAG 2.2:** 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A) · **Confirmed**
> **Problem:** The control can't be focused or used with the keyboard. A screen reader has nothing to announce, because the only content is an icon.
> **Fix:**
> ```tsx
> <button type="button" className="favorite" onClick={() => onFavorite(id)} aria-label={`Add ${name} to favorites`}>
>   <HeartIcon aria-hidden="true" />
> </button>
> ```
>
> **5. [Serious] Current price contrast is 3.30:1**
> **WCAG 2.2:** 1.4.3 Contrast (Minimum) (AA) · **Confirmed**, assuming a white background
> **Problem:** `#16a34a` on white is 3.30:1. At 14px it's normal-size text, so it needs 4.5:1.
> **Fix:** Use `#15803d` (5.02:1 on white).

The other findings: the clickable `div` (should be a link), the image without `alt`, the old price contrast (2.54:1), prices that a screen reader reads as two bare numbers, the name that isn't a heading, and the favorite button's target size. The report ends with what to check in the browser, because the card's CSS wasn't in the code.

## What it checks

- **Semantics:** clickable `div`s, links without `href`, headings, landmarks, lists and tables
- **Names:** icon-only buttons, `alt` text, SVGs, vague links, `aria-label` that doesn't match the visible text
- **Forms:** labels, errors linked to their field, groups, `autoComplete`, blocked paste
- **Keyboard and focus:** removed outlines, `tabIndex`, hover-only menus, modals, custom widgets
- **ARIA:** `aria-hidden` on focusable elements, missing or repeated ids, invalid values
- **Dynamic content:** status messages, live regions, loading states, route changes
- **Color:** text and UI contrast (computed with a script, never estimated), color as the only cue
- **Target size, motion and media:** 24×24 px targets, drag-only actions, autoplay, captions
- **Page level:** `lang`, page titles, skip links, blocked zoom

Each finding comes with a severity (critical, serious, moderate, minor), the WCAG criterion, and a fix.

## What it doesn't do

- **It reads code. It doesn't render the page.** Anything that depends on CSS it can't see, a theme, a third-party component or runtime state goes to a "Check in the browser" list instead of being guessed.
- **It never says a component "is accessible".** Code review and automated tools cover only part of WCAG. Test with the keyboard and a screen reader too.
- It works well with a runtime scanner: paste the axe or Lighthouse violations, and it finds and fixes them in the components that render them.

## Install

### Claude Code plugin

```
/plugin marketplace add petrecaLeo/react-a11y-audit
/plugin install react-a11y-audit@react-a11y-audit
```

### Copy the folder

Copy `skills/react-a11y-audit/` to one of these:

- `~/.claude/skills/` to use it in all your projects
- `.claude/skills/` inside a repository, and commit it, to share it with everyone who uses Claude Code there

### Other tools

The folder follows the open [Agent Skills](https://agentskills.io) format, so tools that read `SKILL.md` can use it too. On claude.ai, zip the folder and upload it as a custom skill.

## Usage

Claude uses the skill on its own when you ask about accessibility in a React project:

- "Check the accessibility of `src/components/Header.tsx`"
- "Can this modal be used with the keyboard only?"
- "Fix these axe violations in the code: ..."

You can also call it by name: `/react-a11y-audit` (or `/react-a11y-audit:react-a11y-audit` when installed as a plugin).

## Tests

A skill only helps if it runs when it should and stays out of the way when it shouldn't. The `evals/` folder has 5 requests, run with `claude plugin eval`: 3 that should trigger the skill and 2 React requests that shouldn't, even though their code has accessibility problems.

| # | Request | Should trigger | Triggered | Report |
|---|---|---|---|---|
| 1 | "Audit the accessibility of this component" (ProductCard) | yes | 2 of 2 | 2 of 2 passed |
| 2 | "Um cliente não consegue assinar a newsletter com leitor de tela" (in Portuguese, without the word "accessibility") | yes | 2 of 2 | 2 of 2 passed |
| 3 | Lighthouse violations pasted, "fix them in the Header" | yes | 2 of 2 | 2 of 2 passed |
| 4 | "This ProductCard re-renders too much, how do I stop that?" | no | 0 of 2 | – |
| 5 | "Convert this component to TypeScript" | no | 0 of 2 | – |

Final round, Claude Sonnet 5.5, 2 runs per request. Besides checking that the skill was called, each report is graded by an LLM judge (did it find the planted problems, does each fix work, did it avoid claiming the code "is accessible"), and cases 1 and 3 check that the contrast was computed with the script.

Triggering was right from the first round. The reports needed three fixes:

1. **Contrast estimated.** One answer suggested a color "about 7.9:1" when it was 7.81:1. Now every ratio, including suggested colors, is computed with the snippet in the checklist.
2. **Invented and inflated findings.** A "Critical" for a favorite state the component never receives, and a validation rule reported as an accessibility problem. Now the skill reports only problems in the code it read, and starts from the checklist's default severity.
3. **Half-translated labels.** Portuguese answers came with "Fix" and "Check in the browser" in English. The template now says to translate the labels, with the Portuguese terms as an example.

To run the tests:

```
claude plugin eval . --runs 2 --ablation none --model sonnet --allow-tools "Bash(node:*)"
```

## How it's organized

```
skills/react-a11y-audit/
├── SKILL.md                   rules, workflow and report format
└── references/checklist.md    the checks, with WCAG criteria and bad/good code
evals/                         the 5 test requests and their graders
.claude-plugin/                plugin and marketplace manifests
```

Claude only sees the skill's name and description until a request matches. Then it loads `SKILL.md`, and reads the checklist during the audit.

## License

[MIT](LICENSE)
