#!/usr/bin/env bash
# Small Next.js shop. The axe results in the prompt come from its /produtos page.
set -euo pipefail
mkdir -p app/produtos src/components locales
cat > package.json <<'JSON'
{ "name": "shop", "private": true, "dependencies": { "next": "^15.0.0", "react": "^19.0.0", "react-dom": "^19.0.0" } }
JSON
cat > locales/pt-BR.json <<'JSON'
{ "search": { "placeholder": "Buscar produtos" }, "footer": { "note": "Ofertas válidas enquanto durarem os estoques" } }
JSON
cat > src/i18n.ts <<'TS'
import messages from "../locales/pt-BR.json";
export function t(key: string): string {
  return key.split(".").reduce((o: any, k) => o[k], messages) as string;
}
TS
cat > app/layout.tsx <<'TSX'
import Script from "next/script";
import { Header } from "../src/components/Header";
import { Footer } from "../src/components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        {children}
        <Footer />
        <div id="chatbox-root" />
        <Script src="https://widget.chatbox.example/loader.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
TSX
cat > app/produtos/page.tsx <<'TSX'
import { ProductCard } from "../../src/components/ProductCard";
import { products } from "../../src/products";

export default function ProductsPage() {
  return (
    <main>
      <h1>Produtos</h1>
      <ul className="grid">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard {...p} />
          </li>
        ))}
      </ul>
    </main>
  );
}
TSX
cat > src/products.ts <<'TS'
export const products = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  name: `Produto ${i + 1}`,
  image: `/img/produto-${i + 1}.jpg`,
  price: 100 + i,
}));
TS
cat > src/components/ProductCard.tsx <<'TSX'
"use client";
import { HeartIcon } from "./HeartIcon";

type Props = { id: string; name: string; image: string; price: number };

export function ProductCard({ id, name, image, price }: Props) {
  return (
    <article className="card">
      <img src={image} className="thumb" />
      <h2>{name}</h2>
      <p>R$ {price}</p>
      <button className="favorite" onClick={() => console.log("fav", id)}>
        <HeartIcon />
      </button>
    </article>
  );
}
TSX
cat > src/components/HeartIcon.tsx <<'TSX'
export function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16">
      <path d="M12 21s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.6-9.5 9-9.5 9z" />
    </svg>
  );
}
TSX
cat > src/components/Header.tsx <<'TSX'
import { t } from "../i18n";

export function Header() {
  return (
    <header>
      <a href="/">
        <img src="/logo.svg" alt="Loja Circuito" />
      </a>
      <input type="search" placeholder={t("search.placeholder")} />
    </header>
  );
}
TSX
cat > src/components/Footer.tsx <<'TSX'
import styles from "./Footer.module.css";
import { t } from "../i18n";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.note}>{t("footer.note")}</p>
    </footer>
  );
}
TSX
cat > src/components/Footer.module.css <<'CSS'
.footer { background: #ffffff; padding: 24px; }
.note { color: #9ca3af; font-size: 14px; }
CSS
git init -q -b main
git add -A
git -c user.name=eval -c user.email=eval@example.com commit -q -m "Initial shop"
