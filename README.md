# react-a11y-audit

[Português](README.pt-BR.md)

A Claude Code skill that reviews React components for accessibility against WCAG 2.2 level AA. It finds problems with contrast, ARIA, focus, keyboard navigation, form labels and alt text, and writes the code fix for each one. Paste the results of a scanner like axe or Lighthouse, and it finds the component behind each problem.

![Claude Code running react-a11y-audit on a ProductCard component. The skill loads, reads the component and the global CSS, computes the contrast with its script, and lists five problems, each with its WCAG criterion and before and after code. It asks before changing the price color.](docs/demo-en.gif)

*A real session on version 1.1.3 with Claude Sonnet 5.5. The waiting is sped up 3×.*

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

> **3 critical or serious blockers below, 7 findings in all: 2 critical, 3 serious, 2 moderate. 4 items to check in the browser. I computed the contrast ratios with the checklist snippet and assumed a white background.**
>
> **2. [Critical] The whole card navigates only with a mouse click (`ProductCard:20`)**
> **WCAG 2.2:** 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A)
> **Problem:** The `div` can't be focused and has no role. Keyboard and screen reader users can't open the product.
> **How to fix:** Make the title a real link and drop the card's `onClick`. Wrapping the whole card in a link would nest the favorite button inside it, so use this instead:
> ```tsx
> // before
> <div className="card" onClick={() => router.push(`/product/${id}`)}>
>   <div className="title">{name}</div>
> // after
> <div className="card">
>   <h3 className="title"><Link href={`/product/${id}`}>{name}</Link></h3>
> ```
>
> **Decisions for you**
> - **Old price color** `#9ca3af` on `#ffffff` is 2.54:1. The closest color that passes is `#727780` (4.50:1).
> - **Current price color** `#16a34a` on `#ffffff` is 3.30:1. The closest color that passes is `#12873d` (4.61:1).
>
> For each, should I apply the closest color, keep the current one and write a message for design, or change it in the theme token? If these colors come from a token, the fix belongs there. I left both unchanged in the code above.
>
> I haven't edited any files. Want me to apply fixes 1, 2, 3, 6 and 7 now, and leave the colors until you decide?

The other findings: the favorite button (a `span` with no name), the image without `alt`, prices that a screen reader reads as two bare numbers, and the name that isn't a heading. The report also lists what to check in the browser, because the card's CSS wasn't in the code.

## From scanner results to code

Scanners test the finished page, so they report HTML like `.grid > li:nth-child(3) > .card > .favorite`. You still have to find which component renders it. Paste the scanner results and the skill does that part: it follows the page to its components, searches ids, texts (translation files included), class names (CSS Modules included) and structure, and groups repeated elements into one fix. This table is from a real run, with axe results for a products page:

> | Rule | Elements | Source | How I found it |
> |---|---|---|---|
> | `button-name` | 24 | `src/components/ProductCard.tsx:12` | class `favorite` and the heart icon. `.grid > li > .card` is the `<li>` from `app/produtos/page.tsx:10` and the `<article className="card">`. |
> | `image-alt` | 24 | `src/components/ProductCard.tsx:9` | class `thumb` and `src={image}` |
> | `label` | 1 | `src/components/Header.tsx:9` | `type="search"` and the placeholder from `locales/pt-BR.json` (`search.placeholder`) |
> | `color-contrast` | 1 | `src/components/Footer.module.css:2` | CSS Module class `Footer_note__k3Lm9` is `.note` in `Footer.module.css`, used at `Footer.tsx:7` |
> | `frame-title` | 1 | Third-party chat widget, loaded at `app/layout.tsx:13` | `#chatbox-root` is the empty div at `app/layout.tsx:12` |

Five rules and 51 elements came down to three files in the project, plus a chat widget that isn't the project's code. For problems like that one, or content that comes from a CMS, the skill says so and where the fix belongs.

## What it checks

- **Semantics:** clickable `div`s, links without `href`, headings, landmarks, lists and tables
- **Names:** icon-only buttons, `alt` text, SVGs, vague links, dialogs, `aria-label` that doesn't match the visible text
- **Forms:** labels, errors linked to their field, groups, `autoComplete`, blocked paste
- **Keyboard and focus:** removed outlines, `tabIndex`, hover-only menus, modals, custom widgets, scrollable boxes like code blocks
- **ARIA:** `aria-hidden` on focusable elements, missing or repeated ids, invalid values
- **Dynamic content:** status messages, live regions, loading states, route changes
- **Color:** text and UI contrast (computed with a script, never estimated), color as the only cue. Tailwind classes are turned into real colors first, for v3 and v4, including the project's own colors from `@theme` or `tailwind.config.js` and CSS variables in `:root` and `.dark` (as in shadcn/ui), with a result for each mode. Colors set in the project's CSS count too (`.prose` links, inline code). To fix, it offers a shade the project already has before a new hex
- **Target size, motion and media:** 24×24 px targets, drag-only actions, autoplay, captions
- **Page level:** `lang`, page titles, skip links, blocked zoom

Each finding comes with a severity (critical, serious, moderate, minor), the WCAG criterion, and a fix.

## What it doesn't do

- **It's for the web.** React Native is out: its checks are about HTML, ARIA and the browser.
- **It reads code. It doesn't render the page.** Anything that depends on CSS it can't see, a theme, a third-party component whose code it can't read or runtime state goes to a "Check in the browser" list instead of being guessed. The same goes for Tailwind colors the script can't resolve: CSS variables outside `:root` and `.dark`, a transparent background when the color behind it is unknown, and `tailwind.config.ts`.
- **It never says a component "is accessible".** Code review and automated tools cover only part of WCAG. Test with the keyboard and a screen reader too.
- **It doesn't change colors on its own.** A color is often a design decision the developer can't change alone. The skill computes the ratio and a color that passes, preferring a shade the project already has (`text-gray-500` instead of a new hex), then asks: apply it, keep it and flag it to design, or change the theme token. If colors belong to the design team, it writes a short message you can paste to them.
- **It doesn't guess the scope.** If you don't say what to audit, it asks first: the files changed on your branch, a pull request, a folder or component, or the whole repository. One component and a whole repository are very different jobs, in time and in tokens.

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

A skill only helps if it runs when it should, stays out of the way when it shouldn't, and does better than Claude without it. The `evals/` folder has 13 requests, run with `claude plugin eval` and Claude Sonnet 5.5.

### Does it trigger at the right time?

| # | Request | Should trigger | Triggered |
|---|---|---|---|
| 1 | "Audit the accessibility of this component" (ProductCard) | yes | 50 of 50 |
| 2 | "Um cliente não consegue assinar a newsletter com leitor de tela" (Portuguese, without the word "accessibility") | yes | 57 of 57 |
| 3 | Lighthouse violations pasted, "fix them in the Header" | yes | 43 of 43 |
| 4 | "This ProductCard re-renders too much, how do I stop that?" | no | 0 of 35 |
| 5 | "Convert this component to TypeScript" | no | 1 of 41 |
| 6 | "Can you check the accessibility of my app?" in a repository with several components | yes | 29 of 29 |
| 7 | axe results for a page: "where does each problem come from in our code?" | yes | 37 of 37 |
| 8 | "Revisa esse banner? As cores são do time de design" | yes | 48 of 48 |
| 9 | "Check the accessibility of src/components/PlanCard.tsx" (Tailwind v4, with a project color) | yes | 30 of 30 |
| 10 | "Check the accessibility of src/components/DeleteAccount.tsx" (shadcn/ui dialog, a color that fails only in dark mode) | yes | 26 of 26 |
| 11 | "Can you check the accessibility of this React Native component?" | no | 0 of 16 |
| 12 | "My search input loses focus every time I type a letter. Why?" | no | 0 of 16 |
| 13 | "Audit the accessibility of this form" (a form with no real problem) | yes | 18 of 18 |

Right in 445 of 446 runs. Cases 4, 5 and 12 have accessibility problems in their code, so the skill had a reason to fire, and case 12 also uses the word "focus". It stayed out every time, except once in case 5's 41 runs.

### Is it better than Claude without it?

Same requests and the same LLM judge (Claude Sonnet 5.5) on both sides. The "with" column is the last round of each case, on version 1.1.3 (see item 16). The "without" column is from the last round run without the skill (twice per case, case 9 four times), graded against the criteria of that time.

| # | With the skill | Without | What made the difference |
|---|---|---|---|
| 1 | 2 of 2 | 0 of 2 | Without the skill, Claude changed the colors in its fix without asking, estimated the contrast ("about 3.3:1") and added findings the code doesn't have. |
| 2 | 2 of 2 | 0 of 2 | Without the skill, it reported the e-mail validation rule as an accessibility finding. |
| 3 | 2 of 2 | 0 of 2 | Without the skill, it changed the cart color in the fixed code without asking. |
| 6 | 2 of 2 | 0 of 2 | Without the skill, it started reading the whole repository instead of asking what to audit. |
| 7 | 2 of 2 | 0 of 2 | Both found the source of each problem. Without the skill, Claude proposed patching the chat vendor's iframe from the project's code. |
| 8 | 2 of 2 | 0 of 2 | Without the skill, there was no message ready to send to the design team. |
| 9 | 2 of 2 | 0 of 4 | Without the skill, Claude used Tailwind v3 colors (`#9ca3af`) in a v4 project and estimated the ratios ("about 2.5:1"). One answer didn't find the project color in `@theme`. |

In earlier versions, some reports failed. Each failure was graded again with the reason for each item, so the fix went to the right place: the skill or the test. "What testing changed" below lists them.

Claude alone already finds most problems. What the skill adds is how it handles them: contrast computed instead of estimated, colors left to whoever decides them, the scope question, the map from scanner results to files, and the message for design.

### On a real project

The cases above were written for the skill, so they can't show everything. To check it on code nobody wrote for it, the skill audited [shadcn-admin](https://github.com/satnaing/shadcn-admin) (15.7k stars; React 19, Vite, shadcn/ui, Tailwind v4; commit `e16c87f`). axe 4.11 ran on the same pages in light and dark mode, with the WCAG A and AA rules, and found 2 problems: the "rows per page" select has no name (tasks and users pages), and the "suspended" badge is 4.0:1. The skill read the code of 4 pages: tasks, users, settings and sign-in.

| | First run | After the fixes in items 10 and 12 |
|---|---|---|
| axe's problems found | 0 of 2 | 2 of 2, with axe's severity: Critical for the select, Serious for the badge (4.01:1) |
| Pages with contrast computed | 3 of 4 | 4 of 4 |
| False findings | 4 | none of the 4 came back; the 4 new findings checked by hand were real |
| Best practices (a table without a name, the same name in every row) | Serious | Minor |

The skill also found what axe can't see on a loaded page: radio groups with no name in a closed drawer, the settings menu on mobile, input borders at 1.23:1 (1.4.11), focus that disappears in Windows high contrast mode, a skipped heading level, a link with no visual cue and a card title that isn't a heading.

**A Next.js blog.** The second project is [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) (10.5k stars; Next.js 15 App Router, Tailwind v4, Headless UI and the pliny package; commit `b45bef6`). axe ran on 7 pages in light and dark mode, on mobile with the menu open, and with the theme menu open. The skill audited three parts from the code (the home page, the header with the mobile menu, and a post page) and mapped axe's results for a tag page. In those three parts, axe found 6 problems, counting each rule once per part: pink links and tags at 3.58:1, tags under 24px (2.5.8) on the home page and on the post page, code blocks that can't be scrolled with the keyboard, and, only with the theme menu open, radio roles inside a menu. On the post page, the contrast failures include inline code at 4.40:1 in dark mode.

| | First run | After the fixes in item 13 (2 runs) |
|---|---|---|
| axe's problems found from the code | 3 of 6 | 5 of 6 and 6 of 6 |
| Colors set in the CSS (`.prose` links, inline code) | sent to the browser list | computed: 3.58:1 and 4.40:1, as axe measured |
| Package components (pliny's newsletter form and code block) | not read | read: the button at 3.58:1, errors that aren't announced, a copy button that only appears on mouse hover |
| Skip link when the page has a `<main>` | Moderate | Minor (best practice) |
| axe's results mapped to the code (tag page) | 2 of 2, with 15 elements counted out of 16 | 2 of 2, with the right count |

From the code, it also found what axe doesn't flag on a loaded page: links in the mobile menu with a 0px focus outline (`outline outline-0` beats the global focus style), the mobile menu's dialog with no name, and a menu button with no `aria-expanded`.

### What testing changed

1. **Contrast estimated.** One answer suggested a color "about 7.9:1" when it was 7.81:1. Now every ratio, including suggested colors, is computed with the skill's `scripts/contrast.mjs`.
2. **Invented and off-topic findings.** A "Critical" for a favorite state the component never receives, an e-mail validation rule reported as an accessibility problem, and "the cards aren't a list" when the list lives in a parent that wasn't in the code. Now the skill reports only accessibility problems it can see in the code.
3. **Half-translated labels.** Portuguese answers came with "Fix" and "Check in the browser" in English. The template now lists the Portuguese terms, the report is checked before sending, and the label became a phrase ("How to fix"), which gets translated more reliably than the single word.
4. **Colors changed without asking** and **a vague request audited without asking.** Early versions did both. Both are now questions, and cases 3 and 6 check them.
5. **Patching a vendor's widget.** For the chat iframe, one answer offered a `MutationObserver` that edits the vendor's iframe. Now the skill points to the vendor's settings and says why a patch breaks.
6. **Answering in the page's language.** In case 7 the request was in English, but 3 of 4 answers came in Portuguese, the language of the page. A first rule ("the language of the user's own words") didn't help: 2 of 2 still in Portuguese. An explicit one, with the example "a request written in English gets an English report, even when the page is in Portuguese", did: 2 of 2 in English. In later rounds, 7 of 9 came in English. Asking Claude to note the request's language as the very first step, before reading any file, brought it to 6 of 6.
7. **Script blocked, colors guessed.** In case 9, 3 of 8 answers built the command with something before `node` (`ls; …` or a variable). The tests allow only commands that start with `node`, so it was blocked, and Claude used Tailwind v3 colors from memory in a v4 project. Many people allow only `node` in their own setup too. Now one script, `contrast.mjs`, takes the classes and gives the ratio, and the skill says to run it as a command of its own, starting with `node`: 4 of 4 after the change.
8. **Colors inside wrappers skipped.** In case 10, the description color comes from `components/ui/dialog.tsx`. Claude read that file but computed only the colors written in `DeleteAccount.tsx`, so it missed the dark mode failure in 2 of 2. With a rule to include the wrappers' colors, 1 of 2 still left the pair under "Check in the browser" without computing it. A last check before sending (a color pair left there goes through the script first) brought it to 3 of 3.
9. **A scanner note that hid a finding.** A new line said to read only the scanner's failures, and one answer in case 3 then called the cart link's missing name "optional" because Lighthouse didn't flag it. The line now says a problem seen in the code is still a finding: 3 of 3.
10. **The real project.** On shadcn-admin, the first run missed both of axe's problems: it didn't read the shared pagination, and it sent the badge on a transparent background to the browser list. On one page it read files with `cat`, which was blocked, and gave up on the script too. It also had 4 false findings: `autoComplete` asked for in a form where an admin edits other people, a label that the form wrapper already links, and two lucide icons that are already hidden. Now the script takes `--behind` for transparent backgrounds and reads theme colors with alpha, and the skill reads every shared component a page renders, reads files with the file tools, and moves anything it would hedge ("may", "check first") to the browser list.
11. **The judge misread its own criteria.** With every item in one criterion, the judge failed 20 to 30% of correct reports in cases 1, 2 and 8, without saying why. With one judge per item, the failures named the item, and the criteria turned out open to another reading: the favorite state, given as an example of an invented finding, also caught an optional suggestion; "no code block" for the message to design was read as a rule for the whole answer; and a question inside that message looked like asking the user. With clearer criteria, the last round passed 26 of 26.
12. **Severity, and a label beside the select.** On the real project, best practices came as "Serious" (a table without a name, the same name in every row). The checklist now lists them as Minor at most. In one run the skill read the pagination but missed the select: the text "Rows per page" sits beside it without labelling it, and a Radix select doesn't take its name from the value it shows. The checklist now says so, and both pages found it again, as Critical, like axe.
13. **The Next.js blog.** The first run sent the colors set in CSS (`.prose` links, inline code) to the browser list, didn't open the package components the page renders (pliny's newsletter form and code block), and didn't see that tags 20px tall in a wrapping row fail 2.5.8. It also missed the name of a Headless UI dialog, because the checklist only covered local copies like shadcn/ui, and it rated a missing skip link as Moderate on pages with a `<main>`, which already meets 2.4.1. Now the skill reads the global CSS and the package components it can read, `contrast.mjs` takes `var(--x)` as written in a stylesheet, and the checklist covers text links as targets, dialogs and nested widgets from headless libraries, scrollable boxes with nothing to focus, and skip links as best practice when there's a `<main>`. In the last round, the header case missed the mobile menu's `outline-0` in 2 of 2 runs, and one run reported an icon inside a button that already has a name. The checklist now names both.
14. **The 13 cases on 1.1.0.** The first round passed 22 of 26. Case 8 failed both runs on the message for design, but a judge re-run by hand passed it, and it passed 2 of 2 when run again. In case 3, the criterion asked for hidden icons even when the button has an `aria-label`, which the checklist says isn't needed, so the test was fixed. In case 9, one report gave the ratio for `text-gray-400` without its hex, so the skill now writes each class with its hex. On the blog's header, the two new rules worked in one run of 2. The other run sent the `outline-0` to the browser list after reading the global CSS, reported a button of exactly 24px as too small, and took back items in the same report ("I'm removing this item from the count"). Now the checklist says the outline is a finding once the global CSS is read and that 24px passes, and the skill settles the list before writing it. On 1.1.1, cases 3 and 9 passed 2 of 2, and the header case found the outline in 2 of 2, with no false target and no item taken back.
15. **The 13 cases on 1.1.1.** The round passed 23 of 26, and every case triggered right. The judge in `claude plugin eval` answers with one word, under a system prompt that asks it to be strict. The same prompt, re-run by hand with a request for the reason, showed what failed in case 8: `// before` and `// after` comments in a Portuguese report, and a message for design that gave the minimum once for both colors. Now the skill translates the code comments and gives each color the minimum for its text size. The judge also counted "Ver ofertas" called a button (it's a link styled as one) and the "WCAG 2.2:" line as mistakes, so case 8's criteria now say both are fine. Case 1's failure passed when judged again with the same prompt. On 1.1.2, cases 1, 2 and 8 passed 2 of 2.
16. **The 13 cases on 1.1.2.** The round passed 25 of 26. In case 3, one answer didn't read the checklist and sent the cart link's name (only an icon and a number) to "Check in the browser", because it couldn't read `CartIcon`. Now the checklist covers a link with an icon and only a number, and the skill says that a component it can't read makes only its own part uncertain, and that the checklist is read also when the request lists scanner failures. The first round with this change passed 22 of 26, with case 3 at 2 of 2. In case 10, Claude put `--min 3` in the same command as the text pairs, so the color it suggested for text reached only 3:1: now `--min 3` goes in a command of its own. In case 2, one report listed a border that passes and then asked the reader to disregard it: now a check that passes isn't a finding, and goes in one line after the findings. Case 13 passed when judged again. In case 8, the message for design gave the minimum once, because both colors share it, and the criterion now accepts that. On the final 1.1.3, the 13 cases passed 25 of 26. The failure was in case 2: the judge read a finding about an error with no text message (3.3.1) as a validation rule, because its title mentioned validation. The criterion now says that finding is accessibility, and the case passed 2 of 2.

The judge also needed fixes: some criteria were stricter than the rule they were checking. When a report failed, the judge was re-run by hand with a request for the reason behind each item, so that each fix went to the right place: the skill or the test. Cases 1, 2, 3, 8 and 13 now grade each criterion with its own judge, so a failure says which item failed.

To run the tests:

```
claude plugin eval . --runs 2 --ablation none --model sonnet --judge-model sonnet --scaffold --allow-tools "Bash(node:*)" "Bash(git:*)"
```

`--scaffold` runs the `scaffold.sh` of cases 6, 7, 9 and 10, which create small repositories. Use `--ablation with-without` to also run every case without the skill.

## How it's organized

```
skills/react-a11y-audit/
├── SKILL.md                   rules, workflow and report format
├── references/checklist.md    the checks, with WCAG criteria and bad/good code
├── references/scanner-to-source.md   how to find the component behind each scanner result
├── scripts/contrast.mjs       computes contrast ratios and the closest colors that pass
└── scripts/tw-color.mjs       turns Tailwind classes into colors (palettes in tw-colors.json)
evals/                         the 13 test requests and their graders
docs/                          the demo GIFs and the GitHub preview image
.claude-plugin/                plugin and marketplace manifests
```

Claude only sees the skill's name and description until a request matches. Then it loads `SKILL.md`, reads the checklist during the audit, and reads `scanner-to-source.md` only when you paste scanner results.

## Next steps

Version 1.1.3 is what this README describes. What could come next:

- **Test the parts of the checklist that no case covers yet:** keyboard in custom widgets (menus, tabs), status messages, page level (`lang`, title) and motion.
- **A real project with Tailwind v3.** Both real projects use v4, so the `tailwind.config.js` path hasn't run on real code yet.
- **More runs per case.** The last changes ran twice per case.
- **Read `tailwind.config.ts`.** Today the script reads only `.js`, `.cjs` and `.mjs` configs.
- **PR mode:** report what a pull request introduced apart from what was already there.
- **Check after fixing:** run what the project already has (eslint-plugin-jsx-a11y, Playwright or Storybook with axe) to close the audit, fix, check loop.
- **Say what a screen reader should announce** for each fix ("Add to favorites, button"), plus the keyboard steps, so anyone can check it.

## License

[MIT](LICENSE). The color palettes in `scripts/tw-colors.json` come from [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) (MIT License, Tailwind Labs).
