# react-a11y-audit

[English](README.md)

Uma skill do Claude Code que revisa componentes React em busca de problemas de acessibilidade, com base no WCAG 2.2 nível AA. Ela encontra problemas de contraste, ARIA, foco, navegação por teclado, rótulos de formulário e texto alternativo, e escreve a correção no código para cada um.

## Exemplo

Você pede: *"Audit the accessibility of this component before we ship it"*, com este componente:

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

A skill responde com um relatório. Este trecho é de uma execução real com o Claude Sonnet 5.5 (em inglês, porque o pedido foi em inglês):

> **3 critical, 3 serious, 2 moderate, 1 minor. 3 items to check in the browser.**
>
> **2. [Critical] Favorite control is a `span` with `onClick` and has no name**
> **WCAG 2.2:** 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A) · **Confirmed**
> **Problem:** The control can't be focused or used with the keyboard. A screen reader has nothing to announce, because the only content is an icon.
> **Fix:**
> ```tsx
> <button type="button" className="favorite" onClick={() => onFavorite(id)} aria-label={`Add ${name} to favorites`}>
>   <HeartIcon aria-hidden="true" />
> </button>
> ```
>
> **5. [Serious] Current price contrast is 3.30:1**
> **WCAG 2.2:** 1.4.3 Contrast (Minimum) (AA) · **Confirmed**, assuming a white background
> **Problem:** `#16a34a` on white is 3.30:1. At 14px it's normal-size text, so it needs 4.5:1.
> **Fix:** Use `#15803d` (5.02:1 on white).

Os outros itens: o `div` clicável (deveria ser um link), a imagem sem `alt`, o contraste do preço antigo (2,54:1), os preços que o leitor de tela lê como dois números soltos, o nome que não é um título e o tamanho do botão de favoritar. O relatório termina com o que conferir no navegador, porque o CSS do card não estava no código.

## O que ela confere

- **Semântica:** `div` clicável, link sem `href`, títulos, landmarks, listas e tabelas
- **Nomes:** botão só com ícone, `alt`, SVG, link vago, `aria-label` diferente do texto visível
- **Formulários:** rótulos, erro ligado ao campo, grupos, `autoComplete`, colar bloqueado
- **Teclado e foco:** outline removido, `tabIndex`, menu que só abre com o mouse, modais, widgets próprios
- **ARIA:** `aria-hidden` em elemento focável, ids que faltam ou se repetem, valores inválidos
- **Conteúdo dinâmico:** mensagens de status, live regions, carregamento, troca de rota
- **Cor:** contraste de texto e de interface (calculado com um script, nunca estimado), cor como único sinal
- **Tamanho de alvo, movimento e mídia:** alvos de 24×24 px, ação só com arrastar, autoplay, legendas
- **Página:** `lang`, título da página, link para pular ao conteúdo, zoom bloqueado

Cada problema vem com a gravidade (crítico, sério, moderado, menor), o critério do WCAG e a correção.

## O que ela não faz

- **Ela lê o código, não abre a página.** O que depende de um CSS que ela não vê, de um tema, de um componente de terceiros ou do estado em tempo de execução vai para uma lista "Conferir no navegador", em vez de ser chutado.
- **Ela nunca diz que um componente "está acessível".** Revisão de código e ferramentas automáticas cobrem só parte do WCAG. Teste também com o teclado e com um leitor de tela.
- Ela combina com um scanner que roda na página: cole as violações do axe ou do Lighthouse, e ela acha e corrige cada uma no componente que a renderiza.

## Instalação

### Plugin do Claude Code

```
/plugin marketplace add petrecaLeo/react-a11y-audit
/plugin install react-a11y-audit@react-a11y-audit
```

### Copiar a pasta

Copie `skills/react-a11y-audit/` para um destes lugares:

- `~/.claude/skills/`, para usar em todos os seus projetos
- `.claude/skills/` dentro de um repositório, com commit, para dividir com todo mundo que usa o Claude Code nele

### Outras ferramentas

A pasta segue o formato aberto [Agent Skills](https://agentskills.io), então ferramentas que leem `SKILL.md` também podem usá-la. No claude.ai, compacte a pasta em ZIP e envie como skill personalizada.

## Como usar

O Claude usa a skill sozinho quando você pergunta sobre acessibilidade num projeto React:

- "Confere a acessibilidade de `src/components/Header.tsx`"
- "Dá para usar esse modal só com o teclado?"
- "Corrige no código essas violações do axe: ..."

Também dá para chamar pelo nome: `/react-a11y-audit` (ou `/react-a11y-audit:react-a11y-audit` quando instalada como plugin).

## Testes

Uma skill só ajuda se roda quando deve e fica quieta quando não deve. A pasta `evals/` tem 5 pedidos, rodados com `claude plugin eval`: 3 que devem ativar a skill e 2 pedidos de React que não devem, mesmo com problemas de acessibilidade no código. Só o pedido 2 é em português; os outros estão traduzidos na tabela.

| # | Pedido | Deve ativar | Ativou | Relatório |
|---|---|---|---|---|
| 1 | "Audit the accessibility of this component" (ProductCard) | sim | 2 de 2 | 2 de 2 aprovados |
| 2 | "Um cliente não consegue assinar a newsletter com leitor de tela" (em português, sem a palavra "acessibilidade") | sim | 2 de 2 | 2 de 2 aprovados |
| 3 | Violações do Lighthouse coladas, "corrige no Header" | sim | 2 de 2 | 2 de 2 aprovados |
| 4 | "Esse ProductCard renderiza demais, como evito?" | não | 0 de 2 | – |
| 5 | "Converte esse componente para TypeScript" | não | 0 de 2 | – |

Rodada final, Claude Sonnet 5.5, 2 execuções por pedido. Além de conferir se a skill foi chamada, um juiz (LLM) avalia cada relatório: se achou os problemas plantados, se cada correção funciona, se evitou dizer que o código "está acessível". Nos casos 1 e 3, um teste confere se o contraste foi calculado com o script.

A skill disparou certo desde a primeira rodada. Os relatórios precisaram de três ajustes:

1. **Contraste estimado.** Uma resposta sugeriu uma cor "about 7.9:1" quando o valor era 7,81:1. Agora toda razão, inclusive das cores sugeridas, é calculada com o trecho de código do checklist.
2. **Itens inventados e gravidade inflada.** Um "Critical" para um estado de favorito que o componente nem recebe, e uma regra de validação apontada como problema de acessibilidade. Agora a skill só aponta problemas do código que leu e parte da gravidade padrão do checklist.
3. **Rótulos traduzidos pela metade.** Respostas em português vinham com "Fix" e "Check in the browser" em inglês. O modelo do relatório agora pede para traduzir os rótulos, com os termos em português como exemplo.

Para rodar os testes:

```
claude plugin eval . --runs 2 --ablation none --model sonnet --allow-tools "Bash(node:*)"
```

## Como está organizada

```
skills/react-a11y-audit/
├── SKILL.md                   regras, passo a passo e formato do relatório
└── references/checklist.md    as checagens, com o critério do WCAG e código ruim/bom
evals/                         os 5 pedidos de teste e seus graders
.claude-plugin/                manifestos do plugin e do marketplace
```

O Claude só vê o nome e a descrição da skill até um pedido combinar com ela. Aí ele carrega o `SKILL.md` e lê o checklist durante a auditoria.

## Licença

[MIT](LICENSE)
