---
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
tags: [should-not-trigger]
---

Convert this component to TypeScript. Add a Props type and make `max` optional with a default of 10.

```jsx
export function QuantitySelector({ value, onChange, max }) {
  return (
    <div className="quantity">
      <div className="btn" onClick={() => onChange(Math.max(1, value - 1))}>
        -
      </div>
      <span>{value}</span>
      <div className="btn" onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </div>
    </div>
  );
}
```
