#!/usr/bin/env bash
# Tailwind v4 project with one custom color in @theme.
set -euo pipefail
mkdir -p src/components
cat > package.json <<'JSON'
{ "name": "plans", "private": true, "dependencies": { "next": "^15.0.0", "react": "^19.0.0", "react-dom": "^19.0.0", "tailwindcss": "^4.1.0" } }
JSON
cat > src/app.css <<'CSS'
@import "tailwindcss";

@theme {
  --color-brand-500: #0ea5e9;
}
CSS
cat > src/components/PlanCard.tsx <<'TSX'
type Props = { name: string; price: number; onSelect: () => void };

export function PlanCard({ name, price, onSelect }: Props) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-400">Monthly billing, cancel anytime</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">${price}</p>
      <button
        className="mt-4 rounded bg-brand-500 px-4 py-2 text-sm text-white focus:outline-none"
        onClick={onSelect}
      >
        Choose plan
      </button>
    </div>
  );
}
TSX
git init -q -b main
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "Plan card"
