# React accessibility checklist (WCAG 2.2 AA)

Each item lists what to look for in the code, the WCAG 2.2 criterion and level, and the default severity. Raise or lower the severity when the context calls for it.

## Contents

1. Semantics and interactive elements
2. Accessible names
3. Forms
4. Keyboard and focus
5. ARIA
6. Dynamic content
7. Color and contrast
8. Target size, motion and media
9. Page level
10. Don't report
11. Best practice, not a failure

## 1. Semantics and interactive elements

- **`div` or `span` with `onClick`.** Use `<button type="button">` for actions and `<a href>` (or the router's `Link`) for navigation. A `div` can't be reached with Tab and has no role. 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A). Critical.

  ```tsx
  // bad
  <div className="card" onClick={() => router.push(`/product/${id}`)}>{name}</div>
  // good
  <Link href={`/product/${id}`} className="card">{name}</Link>
  ```

- **`<a>` without `href`, or `href="#"` with `onClick`.** It's an action, so use `<button type="button">`. 4.1.2 (A). Serious.
- **Interactive element inside another** (a button inside a link, a link inside a button). Screen readers and keyboards handle it unpredictably. 4.1.2 (A). Serious.
- **Headings.** Use `h1` to `h6` for structure, not for font size, and don't skip levels (`h2` straight to `h4`). Text styled as a title must be a heading. 1.3.1 Info and Relationships (A), 2.4.6 Headings and Labels (AA). Moderate.
- **Landmarks.** The page has `<main>`, and navigation sits in `<nav>`, instead of `div`s. 1.3.1 (A). Moderate.
- **Lists.** Groups of similar items (product cards, menu links) use `<ul>`/`<li>`, so a screen reader announces "list, 8 items". 1.3.1 (A). Minor. For a component that renders one item (a card), the list lives in the parent: put it under "Check in the browser", not in the findings.
- **Data tables.** Use `<table>` with `<th scope="col">` (or `scope="row"`) and a `<caption>`. Never use a table for layout. 1.3.1 (A). Serious.

## 2. Accessible names

- **Icon-only button or link.** It needs a name: `aria-label` or visually hidden text. Hide the icon itself. Some icon libraries already do: lucide-react renders `aria-hidden="true"` by default in recent versions, so check the installed version before reporting one of its icons. 4.1.2 (A). Critical.

  ```tsx
  // bad
  <button onClick={onDelete}><TrashIcon /></button>
  // good
  <button type="button" onClick={onDelete} aria-label="Delete item">
    <TrashIcon aria-hidden="true" />
  </button>
  ```

- **Icon with only a number** (a cart or notification count). The link is read as just the number, or the number after an icon name you can't see, so it doesn't say what the number counts. That's a finding even when you can't read the icon's code. Name it with what it counts and hide the icon: `` aria-label={`Cart, ${count} items`} ``. 2.4.4 (A), 4.1.2 (A). Serious.

- **`aria-label` different from the visible text.** The accessible name must contain the visible text, or voice control users can't say it. 2.5.3 Label in Name (A). Moderate.

  ```tsx
  // bad: the screen shows "Send", voice users say "click Send" and nothing happens
  <button aria-label="Submit form">Send</button>
  ```

- **Images (`<img>` and `next/image`).** An informative image has an `alt` that says what it shows or does. A decorative one has `alt=""`. A missing `alt` makes the screen reader read the file name. Inside a link, `alt` describes where the link goes. Don't start with "image of". 1.1.1 Non-text Content (A). Serious.
- **Inline SVG.** Informative: `role="img"` and `aria-label` (or a `<title>`). Decorative: `aria-hidden="true"`. 1.1.1 (A). Serious when informative. A decorative icon next to visible text with no `aria-hidden` is Minor: an SVG with no name is usually skipped, though some browser and screen reader pairs announce it as "image".
- **Vague link text** repeated on the page ("click here", "read more", "see details"). Add context to the text or with visually hidden text. 2.4.4 Link Purpose (In Context) (A). Moderate.
- **`aria-label` on a `div` or `span` with no role.** Many screen readers ignore it. Give it a role or use visible text. 4.1.2 (A). Moderate.

## 3. Forms

- **Field without a label.** A placeholder is not a label: it disappears when the user types. Use `<label htmlFor>` with an id from `useId()`, or wrap the field in the label. 1.3.1 (A), 3.3.2 Labels or Instructions (A), 4.1.2 (A). Critical.

  ```tsx
  // bad
  <input placeholder="Email" />
  // good
  const id = useId()
  <label htmlFor={id}>Email</label>
  <input id={id} type="email" autoComplete="email" />
  ```

- **Text next to a control isn't its label.** A `<p>Rows per page</p>` beside a `Select` doesn't name it, and a shadcn/Radix `SelectTrigger` (a combobox) doesn't take its name from the value it shows. Link the text with `aria-labelledby`, or add `aria-label`. 4.1.2 (A). Critical.
- **Error shown only with color** (red border), or not linked to the field. Show the error as text, link it with `aria-describedby` and set `aria-invalid`. 3.3.1 Error Identification (A), 1.4.1 Use of Color (A). Serious.

  ```tsx
  <input
    id={id}
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? `${id}-error` : undefined}
  />
  {error && <p id={`${id}-error`}>{error}</p>}
  ```

- **Required field marked only with a colored `*`.** Use `required` (or `aria-required="true"`) and say what `*` means. 3.3.2 (A). Moderate.
- **Radio or checkbox group without a group name.** Use `<fieldset>` and `<legend>`. 1.3.1 (A). Serious.
- **Personal data fields** (name, email, phone, address, postal code) without `autoComplete`. It applies only to data about the person filling in the form: a form where an admin edits other people's data is exempt. 1.3.5 Identify Input Purpose (AA). Moderate.
- **Paste blocked** in password or code fields (`onPaste={e => e.preventDefault()}`). It breaks password managers. 3.3.8 Accessible Authentication (Minimum) (AA). Serious.
- **Submit with errors and the focus stays on the button.** Move focus to the first invalid field or to an error summary. 3.3.1 (A). Moderate.

## 4. Keyboard and focus

- **`tabIndex` greater than 0.** It breaks the natural Tab order. Remove it and fix the DOM order. 2.4.3 Focus Order (A). Serious.
- **Focus outline removed** (`outline: none`, `outline-none`, `focus:outline-none`, `outline-0`) with no `focus-visible` style in its place. 2.4.7 Focus Visible (AA). Serious. A global `:focus-visible` rule in `@layer base` doesn't save it: utility classes win over the base layer, so `outline outline-0` on a link leaves it with a 0px outline. Once you've read the global CSS, this is a finding, not a browser check. If the focus style may come from CSS you can't see, mark it "Check in the browser".
- **Focus shown only with `ring` in Tailwind v4.** A `ring` is a `box-shadow`, and Windows high contrast mode (forced colors) removes it. In v4, `outline-none` removes the outline for real (v3's `outline-none`, a transparent outline that forced colors still shows, is now `outline-hidden`). So `focus-visible:outline-none focus-visible:ring-2` leaves no focus in that mode. Use `outline-hidden` with the ring, or an `outline` style. 2.4.7 (AA). Moderate.
- **Focus ring with low contrast.** It needs 3:1 against the colors next to it. 1.4.11 Non-text Contrast (AA). Serious.
- **Sticky header, footer or cookie banner** that can cover the focused element. Check in the browser. The usual fix is `scroll-padding-top` on `html`. 2.4.11 Focus Not Obscured (Minimum) (AA). Moderate.
- **Opens only on hover** (`onMouseEnter` with no keyboard path). Menus and tooltips must open on focus too. Tooltip content must close with Escape and stay open while the pointer is over it. 2.1.1 (A), 1.4.13 Content on Hover or Focus (AA). Serious.
- **Modal or dialog.** When it opens, focus moves inside. Tab stays inside, Escape closes, and focus returns to the button that opened it. The page behind is inert. The native `<dialog>` with `showModal()` does most of this. Otherwise use `role="dialog"`, `aria-modal="true"`, `aria-labelledby` and manage focus by hand. 2.4.3 (A), 2.1.2 No Keyboard Trap (A). Critical when focus stays behind the modal or can't leave it.

  ```tsx
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (open) ref.current?.showModal()
    else ref.current?.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={titleId}>
      <h2 id={titleId}>{title}</h2>
      {children}
      <button type="button" onClick={onClose}>Close</button>
    </dialog>
  )
  ```

- **Custom widgets** (tabs, dropdown, combobox, accordion, menu). Follow the keyboard model of the ARIA Authoring Practices Guide (APG) and keep the states in sync: `aria-expanded`, `aria-selected`, `aria-controls`. A tested headless library is often safer than a hand-made widget. 2.1.1 (A), 4.1.2 (A). Serious.
- **Headless libraries** (Radix, Headless UI, React Aria), from the package or as local copies like shadcn/ui in `components/ui/` (it wraps Radix). The library already moves and traps focus, closes on Escape and sets the roles: don't report those. Check what it can't do for you: the props passed. A dialog needs a name: Radix `DialogContent` and Headless UI `Dialog` take it from a `DialogTitle` (hide it with `VisuallyHidden` or `className="sr-only"` if there's no visible title), or from `aria-label` on the dialog. Icon buttons still need an `aria-label`. 4.1.2 (A). Serious. Putting one widget inside another (a `RadioGroup` inside a `Menu`) mixes the roles each one sets (radio inside menu, menuitem inside radio), and screen readers can't follow it: use the library's own pattern for it, or `role="menuitemradio"` with `aria-checked`. 4.1.2 (A). Serious.
- **Scrollable box with nothing to focus inside.** A box with `overflow-auto`, `overflow-x-auto` or `overflow-scroll` and only text in it can't be scrolled with the keyboard in some browsers. Code blocks are the usual case: `prose` from `@tailwindcss/typography` makes `pre` scroll. Add `tabIndex={0}` to the box (and an `aria-label` when it isn't a `pre`). In MDX, set it in the component the `pre` entry of the MDX components renders; when that one comes from a package and drops extra props, use your own `pre`. 2.1.1 Keyboard (A). Serious.
- **`autoFocus` on page load.** It skips the content before the field for screen reader users. Fine inside a dialog. Minor.

## 5. ARIA

- **`aria-hidden="true"` on something focusable** or on a container with buttons or links. The keyboard reaches it and the screen reader says nothing. Remove it, or use `inert`. 4.1.2 (A). Critical.
- **`role="button"` on a `div`.** It also needs `tabIndex={0}` and Enter and Space handlers. Use `<button>` instead. 2.1.1 (A), 4.1.2 (A). Serious.
- **References to ids that don't exist or repeat** (`aria-labelledby`, `aria-describedby`, `aria-controls`, `htmlFor`). A hardcoded id in a reused component repeats on the page. Use `useId()`. 1.3.1 (A), 4.1.2 (A). Serious.
- **Invalid ARIA** (misspelled attribute, `aria-expanded="yes"`). In JSX, `aria-expanded={isOpen}` is correct; React renders `"true"`/`"false"`. 4.1.2 (A). Serious.
- **Role that doesn't match the behavior.** `role="menu"` for site navigation promises app-menu keys (arrows) that aren't there; use `<nav>` with a list. `role="link"` on something that runs an action. 4.1.2 (A). Moderate.
- **Redundant role** (`<button role="button">`, `<nav role="navigation">`). Minor.

## 6. Dynamic content

- **Status messages** (saved, added to cart, "12 results", loading finished) not announced. Use `role="status"` for these, and `role="alert"` only for errors that need attention now. 4.1.3 Status Messages (AA). Serious.
- **Live region created together with the message.** Screen readers often miss it. Render the region empty first and change only its content.

  ```tsx
  // bad: the region and the text appear at the same time
  {saved && <p role="status">Saved</p>}
  // good: the region is always there
  <p role="status">{saved ? "Saved" : ""}</p>
  ```

- **Loading state.** A spinner needs an accessible name (visually hidden "Loading…" inside a `role="status"`), and the region being updated can take `aria-busy="true"`. 4.1.3 (AA). Moderate.
- **Route change in a single-page app.** Move focus to the new page's `h1` (with `tabIndex={-1}`) or announce the new title. Next.js already announces route changes; check custom routers. Moderate.

## 7. Color and contrast

- **Text contrast.** At least 4.5:1. Large text (24px and up, or 18.66px and up in bold) needs 3:1. 1.4.3 Contrast (Minimum) (AA). Serious.
- **Non-text contrast.** Parts needed to see or use a control (input borders, focus ring, an icon button with no text, chart lines) need 3:1 against the colors next to them. 1.4.11 (AA). Serious.
- **Exempt:** disabled controls, logos and pure decoration.
- **Color as the only cue.** Status shown only by a red or green dot, or links in a paragraph that differ only by color. Add text, an icon or an underline. 1.4.1 Use of Color (A). Serious.

**How to compute.** Only with two known colors: a hex or rgb in the code, a color in a theme file you read, or a Tailwind class. Run the script in this skill's `scripts/` folder instead of estimating. It takes pairs, the foreground (text, border, icon) first and then the background:

```
node <this skill's directory>/scripts/contrast.mjs --project <repository root> text-gray-400 bg-white text-white "#0ea5e9"
```

Run it as a command of its own, starting with `node` and the script's full path: no `cd`, no variables, nothing before it with `;` or `&&`. Some setups only allow commands that start with `node` and block the rest. Quote values with spaces or parentheses (`"rgb(0, 0, 0)"`). Each color can be a hex, `rgb()`, `hsl()`, `oklch()`, a basic name (`white`), a Tailwind class or a CSS variable (`var(--color-primary-500)`). Put all the pairs of a component in one command. List every text with its background, including colors set inside the local wrappers you read: a `CardDescription` from `components/ui/card.tsx` brings its own text color, and its background is the nearest parent with a `bg-` class, which may be in another wrapper.

For each pair, it prints the ratio, whether it passes 4.5:1 and 3:1, and what passes: a shade from the same palette when there is one (`text-gray-500`), and the closest new color. Use `--min 3` for large text and UI parts, in a command of its own: it applies to every pair in the command, so a text pair in the same command gets colors that reach only 3:1. When the foreground is lighter than the background (white text on a button), the background is usually what should change, so the script suggests it first. Offer the palette shade first: the project already has it, so it's an easy change to accept. In the report, write each class with the hex the script gave, as in `text-gray-400` (`#99a1af`), so the reader can check it and pass it to design.

**Tailwind classes.** The script reads the Tailwind version from `package.json`, uses that version's default palette, and reads the project's own colors (`@theme` in v4 CSS files, `tailwind.config.js` in v3). It follows `var(--x)` to `:root` and `.dark`, as in shadcn/ui; when a color changes in `.dark`, it gives one result for each mode, and both go in the report. It blends text opacity like `text-white/70` with the background. For a background with opacity (`bg-red-500/10`, or a theme color like `oklch(1 0 0 / 15%)`), add `--behind` with the color behind it, usually the nearest parent background (`--behind bg-background`); pairs with different colors behind them go in separate commands. Check each state as its own pair, with matching variants: `dark:text-gray-300` goes with `dark:bg-gray-900`, not with `bg-white`. With variants (`cva`, a `variant` prop), check each variant and `hover:` state that has its own colors; a short table (variant, state, colors, ratio) keeps it readable. What it can't resolve (variables set outside `:root` and `.dark`, a background with opacity and no `--behind`, `tailwind.config.ts`) goes to "Check in the browser". Some v4 colors are outside sRGB; the script says so, and their ratios are close but not exact.

**Colors in the project's CSS** count too. Rules like `.prose a { color: var(--color-primary-500) }`, inline `code` in posts, a syntax-highlighting theme (`prism.css`) or `a { color }` in a base layer set colors you won't see as classes. Put those pairs in the command as well, written as in the CSS: the script reads `var(--color-primary-500)` and `var(--muted-foreground)`. The background is the page's or the block's own (a code block sets its `background`), in each mode: `dark:prose-invert` and `.dark` rules change both.

Gradients and text over images also go to "Check in the browser".

**Don't change the color on your own.** Contrast is often a design decision. Put the options under "Decisions for you" and ask: apply the closest color, keep it and flag it to design, or change the theme token (when the color comes from one, the fix belongs there, not in each component).

## 8. Target size, motion and media

- **Small click target.** At least 24×24 CSS px, or enough space so a 24px circle around it doesn't touch another target. Links inside a sentence are exempt. An icon button with `w-4 h-4 p-0` is 16px. Exactly 24px passes: an `h-6 w-6` icon in a button with no padding is a 24×24 target. Text links that aren't in a sentence (tags, chips, filters, lists of links) are only as tall as their line: `text-xs` is 16px and `text-sm` is 20px, unless padding or `min-h-6` adds height. In a `flex-wrap` row with no `gap-y`, or with `mr-1` between them, they fail. The classes show this, so it's a finding, not a browser check. Fix it with `inline-flex min-h-6 items-center`, padding or a bigger gap. 2.5.8 Target Size (Minimum) (AA). Serious.
- **Drag only** (sortable list, slider, kanban). Offer a single-click alternative, like move up/down buttons. 2.5.7 Dragging Movements (AA). Serious.
- **Carousel or animation that plays by itself** for more than 5 seconds. It needs a pause button. 2.2.2 Pause, Stop, Hide (A). Serious.
- **Large motion** (parallax, zoom, big slides) ignoring `prefers-reduced-motion`. 2.3.3 is AAA, so report it as Minor.
- **Video with speech** without captions (`<track kind="captions">`). 1.2.2 Captions (Prerecorded) (A). Serious.
- **Audio that plays by itself** for more than 3 seconds with no way to pause or mute it. 1.4.2 Audio Control (A). Serious.

## 9. Page level

- **`<html>` without `lang`** (in Next.js, in `app/layout.tsx`). 3.1.1 Language of Page (A). Serious.
- **Same title on every route** (`<title>` or `metadata.title`). 2.4.2 Page Titled (A). Moderate.
- **Long header or menu with no skip link and no `<main>`.** 2.4.1 Bypass Blocks (A). Moderate. A `<main>` landmark (in Next.js, often in `app/layout.tsx`) or headings already meet 2.4.1, so with one of them a skip link is best practice (section 11).
- **Zoom blocked** by `maximum-scale=1` or `user-scalable=no` in the viewport meta. 1.4.4 Resize Text (AA). Serious.

## 10. Don't report

- 4.1.1 Parsing. It was removed in WCAG 2.2.
- Contrast of disabled controls.
- AAA criteria as failures. Mention them as Minor suggestions at most.
- An icon inside a button or link that already has an `aria-label`: the label replaces the content, so the icon isn't read even without `aria-hidden`.
- A `button` with no `type` outside a form.

## 11. Best practice, not a failure

Report these as Minor at most, and say they are best practice rather than a WCAG failure:

- A data table without a name (`<caption>` or `aria-label`).
- Sorting shown without `aria-sort`.
- The same name on a control in every row ("Open menu", "Select row") when the row has a name or header that gives context. With no context at all, Moderate (2.4.6).
- A `nav` or another landmark without a name when it's the only one of its kind on the page. With two or more of the same kind, Moderate.
- Pagination without `aria-current="page"` on the current page.
- No skip link when the page has a `<main>` landmark.
- The same words repeated in `aria-label`, `title` and hidden text.
