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

> **2 critical, 2 serious, 2 moderate, 0 minor. 3 items to check in the browser.**
>
> **2. [Critical] The favorite control is not a button and has no name**
> **WCAG 2.2:** 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A)
> **Problem:** The `span` with `onClick` can't be focused or activated by keyboard. The icon-only content also gives it no accessible name.
> **Fix:**
> ```tsx
> <button
>   type="button"
>   className="favorite"
>   aria-label={`Add ${name} to favorites`}
>   onClick={(e) => { e.stopPropagation(); onFavorite(id); }}
> >
>   <HeartIcon aria-hidden="true" />
> </button>
> ```
>
> **Decisions for you**
> - **Old price color** `#9ca3af` on `#ffffff` is 2.54:1. The closest color that passes is `#727780` (4.50:1). Should I apply it, keep it and flag it to design, or change it in the theme token?
> - **Current price color** `#16a34a` on `#ffffff` is 3.30:1. The closest color that passes is `#12873d` (4.61:1). The same three options apply. Making the text 24px or larger (or 18.66px bold) would also drop the requirement to 3:1. I can't tell whether that suits the design.
>
> I can apply fixes 1, 2, 3, 5 and 6 to the file now, if you want. I'll leave the colors until you answer.

The other findings: the clickable `div` (should be a link), the image without `alt`, prices that a screen reader reads as two bare numbers, and the name that isn't a heading. The report also lists what to check in the browser, because the card's CSS wasn't in the code.

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
- **It doesn't change colors on its own.** A color is often a design decision the developer can't change alone. The skill computes the ratio and the closest color that passes, then asks: apply it, keep it and flag it to design, or change the theme token.
- **It doesn't guess the scope.** If you don't say what to audit, it asks first: the files changed on your branch, a pull request, a folder or component, or the whole repository. One component and a whole repository are very different jobs, in time and in tokens.
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

A skill only helps if it runs when it should and stays out of the way when it shouldn't. The `evals/` folder has 6 requests, run with `claude plugin eval`: 4 that should trigger the skill and 2 React requests that shouldn't, even though their code has accessibility problems.

| # | Request | Should trigger | Triggered | Graded on |
|---|---|---|---|---|
| 1 | "Audit the accessibility of this component" (ProductCard) | yes | 17 of 17 | planted problems found, contrast computed, asks before changing colors |
| 2 | "Um cliente não consegue assinar a newsletter com leitor de tela" (Portuguese, without the word "accessibility") | yes | 16 of 16 | planted problems found, labels in Portuguese, nothing off-topic |
| 3 | Lighthouse violations pasted, "fix them in the Header" | yes | 16 of 16 | every violation fixed, the color kept until the user decides |
| 4 | "This ProductCard re-renders too much, how do I stop that?" | no | 0 of 15 | – |
| 5 | "Convert this component to TypeScript" | no | 0 of 15 | – |
| 6 | "Can you check the accessibility of my app?" in a repository with several components | yes | 9 of 9 | asks what to audit before reading any component |

Triggering was right in all 88 runs, across 10 rounds with Claude Sonnet 5.5. Each report is also graded by an LLM judge, and cases 1 and 3 check that the contrast was computed with the script. The last version ran once per case (cases 4 and 5 were left out, because the description didn't change). The reports for cases 1, 3 and 6 passed. Case 2 failed on a criterion that was stricter than the rule it checked; after the criterion was fixed, the same report passed when graded again by hand.

What the tests caught along the way:

1. **Contrast estimated.** One answer suggested a color "about 7.9:1" when it was 7.81:1. Now every ratio, including suggested colors, is computed with the snippet in the checklist.
2. **Invented and off-topic findings.** A "Critical" for a favorite state the component never receives, and an e-mail validation rule reported as an accessibility problem. Now the skill reports only accessibility problems it can see in the code.
3. **Half-translated labels.** Portuguese answers came with "Fix" and "Check in the browser" in English. The fix was a list of the Portuguese terms above the template, a final check before sending, and fewer labels: findings no longer carry a "Confirmed" tag, because anything unconfirmed goes to "Check in the browser".
4. **Colors changed without asking** and **a vague request audited without asking**, both on purpose in the first version. They were changed to questions after feedback, and cases 3 and 6 now check them.

The judge also needed fixes: some criteria were stricter than the rule they were checking. When a report failed, the judge was re-run by hand with a request for the reason behind each item, so that each fix went to the right place (the skill or the test).

To run the tests:

```
claude plugin eval . --runs 2 --ablation none --model sonnet --judge-model sonnet --scaffold --allow-tools "Bash(node:*)" "Bash(git:*)"
```

`--scaffold` runs `evals/6-vague-scope/scaffold.sh`, which creates a small repository for case 6.

## How it's organized

```
skills/react-a11y-audit/
├── SKILL.md                   rules, workflow and report format
└── references/checklist.md    the checks, with WCAG criteria and bad/good code
evals/                         the 6 test requests and their graders
.claude-plugin/                plugin and marketplace manifests
```

Claude only sees the skill's name and description until a request matches. Then it loads `SKILL.md`, and reads the checklist during the audit.

## License

[MIT](LICENSE)
