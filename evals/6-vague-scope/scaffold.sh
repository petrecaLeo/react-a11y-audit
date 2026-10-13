#!/usr/bin/env bash
# Small Next.js shop with a feature branch, so the scope question has real options.
set -euo pipefail
mkdir -p src/components src/pages
cat > package.json <<'JSON'
{ "name": "shop", "private": true, "dependencies": { "next": "^15.0.0", "react": "^19.0.0", "react-dom": "^19.0.0" } }
JSON
cat > src/components/Button.tsx <<'TSX'
export function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <div className="btn" onClick={onClick}>{children}</div>;
}
TSX
cat > src/components/Header.tsx <<'TSX'
export function Header() {
  return (
    <header>
      <a href="/"><img src="/logo.svg" /></a>
      <input type="search" placeholder="Search" />
    </header>
  );
}
TSX
cat > src/components/Modal.tsx <<'TSX'
export function Modal({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="overlay"><div className="modal">{children}</div></div>;
}
TSX
cat > src/pages/index.tsx <<'TSX'
import { Header } from "../components/Header";
export default function Home() {
  return <><Header /><main><h3>Offers</h3></main></>;
}
TSX
cat > src/pages/cart.tsx <<'TSX'
import { Header } from "../components/Header";
export default function Cart() {
  return <><Header /><main><h1>Cart</h1></main></>;
}
TSX
git init -q -b main
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "Initial shop"
git checkout -q -b feature/checkout-button
cat > src/pages/cart.tsx <<'TSX'
import { Header } from "../components/Header";
import { Button } from "../components/Button";
export default function Cart() {
  return <><Header /><main><h1>Cart</h1><Button onClick={() => {}}>Checkout</Button></main></>;
}
TSX
git -c user.name=eval -c user.email=eval@example.com commit -q -am "Add checkout button"
