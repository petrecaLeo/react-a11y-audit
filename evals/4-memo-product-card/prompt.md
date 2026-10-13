---
max_turns: 4
allowed_tools: [Read, Glob, Grep, Skill]
tags: [should-not-trigger]
---

This ProductCard re-renders every time the product grid updates, even when its props didn't change. How do I stop that?

```tsx
import { useRouter } from "next/router";
import { HeartIcon } from "./icons";

type Props = {
  id: string;
  name: string;
  image: string;
  price: number;
  onFavorite: (id: string) => void;
};

export function ProductCard({ id, name, image, price, onFavorite }: Props) {
  const router = useRouter();

  return (
    <div className="card" onClick={() => router.push(`/product/${id}`)}>
      <img src={image} />
      <div className="title">{name}</div>
      <span>${price}</span>
      <span className="favorite" onClick={() => onFavorite(id)}>
        <HeartIcon />
      </span>
    </div>
  );
}

// in ProductGrid.tsx
// {products.map((p) => (
//   <ProductCard key={p.id} {...p} onFavorite={(id) => toggleFavorite(id)} />
// ))}
```
