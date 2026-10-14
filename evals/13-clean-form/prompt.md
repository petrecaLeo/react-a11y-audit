---
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill, Bash]
tags: [should-trigger, no-issues]
---

Audit the accessibility of this form before we ship it.

```tsx
import { useId } from "react";

type Props = { value: string; error?: string; onChange: (value: string) => void; onSubmit: () => void };

export function CouponForm({ value, error, onChange, onSubmit }: Props) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={id}>Coupon code</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <p id={errorId} role="alert">
        {error ?? ""}
      </p>
      <button type="submit">Apply coupon</button>
    </form>
  );
}
```
