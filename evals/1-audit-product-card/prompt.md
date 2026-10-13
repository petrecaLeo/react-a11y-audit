---
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill, Bash]
tags: [should-trigger]
---

Audit the accessibility of this component before we ship it:

```tsx
import { useRouter } from "next/router";
import { HeartIcon } from "./icons";

type Props = {
  id: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  onFavorite: (id: string) => void;
};

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
      <span
        className="favorite"
        onClick={(e) => {
          e.stopPropagation();
          onFavorite(id);
        }}
      >
        <HeartIcon />
      </span>
    </div>
  );
}
```
