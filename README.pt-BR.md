# react-a11y-audit

[English](README.md)

Uma skill do Claude Code que revisa componentes React em busca de problemas de acessibilidade, com base no WCAG 2.2 nível AA. Ela encontra problemas de contraste, ARIA, foco, navegação por teclado, rótulos de formulário e texto alternativo, e escreve a correção no código para cada um. Cole o resultado de um scanner como o axe ou o Lighthouse, e ela acha o componente por trás de cada problema.

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

Os outros itens: o botão de favoritar (um `span` sem nome), a imagem sem `alt`, os preços que o leitor de tela lê como dois números soltos e o nome que não é um título. O relatório também lista o que conferir no navegador, porque o CSS do card não estava no código.

## Do resultado do scanner ao código

Os scanners testam a página pronta, então apontam um HTML como `.grid > li:nth-child(3) > .card > .favorite`. Você ainda precisa descobrir qual componente gera aquilo. Cole o resultado do scanner e a skill faz essa parte: ela vai da página aos componentes, procura por ids, textos (inclusive nos arquivos de tradução), classes (inclusive as do CSS Modules) e pela estrutura, e junta os elementos repetidos numa correção só. Esta tabela é de uma execução real, com o resultado do axe de uma página de produtos:

> | Regra | Elementos | Origem | Como encontrei |
> |---|---|---|---|
> | `button-name` | 24 | `src/components/ProductCard.tsx:12` | classe `favorite` e o ícone de coração (`HeartIcon`) |
> | `image-alt` | 24 | `src/components/ProductCard.tsx:9` | classe `thumb` e `src` em `/img/produto-N.jpg` (vem de `src/products.ts`) |
> | `label` | 1 | `src/components/Header.tsx:9` | `header > input[type=search]` e o placeholder "Buscar produtos" (em `locales/pt-BR.json`) |
> | `color-contrast` | 1 | `src/components/Footer.module.css:2` (`.note`) | `Footer_note__k3Lm9` aponta para `Footer.module.css`, classe `.note`, usada em `Footer.tsx:7` |
> | `frame-title` | 1 | widget de terceiros, carregado em `app/layout.tsx:13` | `#chatbox-root` está em `layout.tsx:12`; o iframe vem do `loader.js` do chatbox |

Cinco regras e 51 elementos se resumiram a três arquivos do projeto, mais um widget de chat que não é código do projeto. Para problemas assim, ou para conteúdo que vem de um CMS, a skill avisa e diz onde fica a correção.

## O que ela confere

- **Semântica:** `div` clicável, link sem `href`, títulos, landmarks, listas e tabelas
- **Nomes:** botão só com ícone, `alt`, SVG, link vago, `aria-label` diferente do texto visível
- **Formulários:** rótulos, erro ligado ao campo, grupos, `autoComplete`, colar bloqueado
- **Teclado e foco:** outline removido, `tabIndex`, menu que só abre com o mouse, modais, widgets próprios
- **ARIA:** `aria-hidden` em elemento focável, ids que faltam ou se repetem, valores inválidos
- **Conteúdo dinâmico:** mensagens de status, live regions, carregamento, troca de rota
- **Cor:** contraste de texto e de interface (calculado com um script, nunca estimado), cor como único sinal. As classes do Tailwind viram cores de verdade antes, na v3 e na v4, inclusive as cores próprias do projeto no `@theme` ou no `tailwind.config.js`
- **Tamanho de alvo, movimento e mídia:** alvos de 24×24 px, ação só com arrastar, autoplay, legendas
- **Página:** `lang`, título da página, link para pular ao conteúdo, zoom bloqueado

Cada problema vem com a gravidade (crítico, sério, moderado, menor), o critério do WCAG e a correção.

## O que ela não faz

- **Ela lê o código, não abre a página.** O que depende de um CSS que ela não vê, de um tema, de um componente de terceiros ou do estado em tempo de execução vai para uma lista "Conferir no navegador", em vez de ser chutado. O mesmo vale para as cores do Tailwind que o script não resolve: variáveis de CSS, fundo com transparência e `tailwind.config.ts`.
- **Ela nunca diz que um componente "está acessível".** Revisão de código e ferramentas automáticas cobrem só parte do WCAG. Teste também com o teclado e com um leitor de tela.
- **Ela não muda cor sozinha.** Cor muitas vezes é decisão de design, e quem programa não pode mudar sozinho. A skill calcula a razão e uma cor que passa, de preferência um tom que o projeto já tem (`text-gray-500` em vez de um hex novo), e pergunta: aplicar, manter e avisar o design, ou mudar o token do tema. Se as cores são do time de design, ela escreve um recado curto para você mandar para eles.
- **Ela não chuta o escopo.** Se você não diz o que auditar, ela pergunta antes: os arquivos alterados na sua branch, um pull request, uma pasta ou componente, ou o repositório inteiro. Um componente e um repositório inteiro são trabalhos bem diferentes, em tempo e em tokens.

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

Uma skill só ajuda se roda quando deve, fica quieta quando não deve e se sai melhor que o Claude sem ela. A pasta `evals/` tem 9 pedidos, rodados com `claude plugin eval` e o Claude Sonnet 5.5. Os pedidos 2 e 8 são em português; os outros estão traduzidos nas tabelas.

### Ela dispara na hora certa?

| # | Pedido | Deve ativar | Ativou |
|---|---|---|---|
| 1 | "Audita a acessibilidade desse componente" (ProductCard) | sim | 25 de 25 |
| 2 | "Um cliente não consegue assinar a newsletter com leitor de tela" (sem a palavra "acessibilidade") | sim | 25 de 25 |
| 3 | Violações do Lighthouse coladas, "corrige no Header" | sim | 22 de 22 |
| 4 | "Esse ProductCard renderiza demais, como evito?" | não | 0 de 19 |
| 5 | "Converte esse componente para TypeScript" | não | 1 de 25 |
| 6 | "Confere a acessibilidade do meu app?" num repositório com vários componentes | sim | 13 de 13 |
| 7 | Resultado do axe de uma página: "de onde vem cada problema no nosso código?" | sim | 13 de 13 |
| 8 | "Revisa esse banner? As cores são do time de design" | sim | 11 de 11 |
| 9 | "Confere a acessibilidade de src/components/PlanCard.tsx" (Tailwind v4, com uma cor do projeto) | sim | 12 de 12 |

Certo em 164 de 165 execuções. Os casos 4 e 5 têm problemas de acessibilidade no código, então a skill tinha motivo para disparar. No caso 4 ela ficou quieta todas as vezes, e no caso 5 disparou uma vez em 25.

### Ela é melhor que o Claude sem ela?

Cada caso rodou com e sem a skill (duas vezes cada, o caso 9 quatro vezes), com os mesmos pedidos, e o mesmo juiz (Claude Sonnet 5.5) deu a nota com os mesmos critérios.

| # | Com a skill | Sem | O que fez a diferença |
|---|---|---|---|
| 1 | 1 de 2 | 0 de 2 | Sem a skill, o Claude trocou as cores na correção sem perguntar, estimou o contraste ("about 3.3:1") e incluiu itens que o código não tem. |
| 2 | 1 de 2 | 0 de 2 | Sem a skill, ele apontou a regra de validação do e-mail como problema de acessibilidade. |
| 3 | 2 de 2 | 0 de 2 | Sem a skill, ele trocou a cor do carrinho no código corrigido sem perguntar. |
| 6 | 2 de 2 | 0 de 2 | Sem a skill, ele saiu lendo o repositório inteiro em vez de perguntar o que auditar. |
| 7 | 2 de 2 | 0 de 2 | Os dois acharam a origem de cada problema. Sem a skill, o Claude propôs remendar o iframe do fornecedor do chat pelo código do projeto. |
| 8 | 1 de 2 | 0 de 2 | Sem a skill, não veio um recado pronto para o time de design. |
| 9 | 4 de 4 | 0 de 4 | Sem a skill, o Claude usou as cores do Tailwind v3 (`#9ca3af`) num projeto v4 e estimou as razões ("about 2.5:1"). Uma resposta não achou a cor do projeto no `@theme`. |

Os casos 1 a 8 são da última comparação completa. O caso 9 é da rodada depois da mudança no script (antes dela, 1 de 2: veja o item 7 abaixo). As falhas nos casos 1, 2 e 8 passaram quando os mesmos relatórios foram avaliados de novo, pedindo ao juiz o motivo de cada item: o juiz também erra. Depois da mudança, os casos 1, 3 e 8 rodaram mais duas vezes: os 6 relatórios passaram, 2 deles só nessa segunda avaliação.

O Claude sozinho já acha a maior parte dos problemas. O que a skill acrescenta é o jeito de lidar com eles: contraste calculado em vez de estimado, cor deixada para quem decide, a pergunta de escopo, o mapa do resultado do scanner até os arquivos e o recado para o design.

### O que os testes pegaram no caminho

1. **Contraste estimado.** Uma resposta sugeriu uma cor "about 7.9:1" quando o valor era 7,81:1. Agora toda razão, inclusive das cores sugeridas, é calculada com o script `scripts/contrast.mjs` da skill.
2. **Itens inventados e fora do tema.** Um "Critical" para um estado de favorito que o componente nem recebe, uma regra de validação de e-mail apontada como problema de acessibilidade, e "os cards não estão numa lista" quando a lista fica num componente pai que não estava no código. Agora a skill só aponta problemas de acessibilidade que ela vê no código.
3. **Rótulos traduzidos pela metade.** Respostas em português vinham com "Fix" e "Check in the browser" em inglês. O modelo do relatório agora lista os termos em português, o relatório é conferido antes de enviar, e o rótulo virou uma frase ("How to fix"), que o modelo traduz com mais confiança do que a palavra solta.
4. **Cor trocada sem perguntar** e **pedido vago auditado sem perguntar**, as duas de propósito na primeira versão. Viraram perguntas depois de feedback, e os casos 3 e 6 conferem isso.
5. **Remendo no widget do fornecedor.** Para o iframe do chat, uma resposta ofereceu um `MutationObserver` que mexe no iframe do fornecedor. Agora a skill aponta para a configuração do fornecedor e explica por que um remendo quebra.
6. **Resposta na língua da página.** No caso 7, o pedido foi em inglês, mas 3 de 4 respostas vieram em português, a língua da página. Uma primeira regra ("a língua das palavras de quem pediu") não resolveu: 2 de 2 ainda em português. Uma regra explícita, com o exemplo "pedido em inglês recebe relatório em inglês, mesmo com a página em português", resolveu: 2 de 2 em inglês. Nas rodadas seguintes, 4 de 5 vieram em inglês: a regra ajuda, mas não é perfeita.
7. **Script bloqueado, cor chutada.** No caso 9, 3 de 8 respostas montaram o comando com algo antes do `node` (`ls; …` ou uma variável). Os testes só liberam comandos que começam com `node`, então o comando foi bloqueado, e o Claude usou de memória as cores do Tailwind v3 num projeto v4. Muita gente também só libera o `node` no dia a dia. Agora um script só, o `contrast.mjs`, recebe as classes e devolve a razão, e a skill pede para rodá-lo como um comando separado, começando com `node`: 4 de 4 depois da mudança.

O juiz também precisou de ajustes: alguns critérios eram mais rígidos que a regra que conferiam. Quando um relatório reprovava, o juiz era rodado de novo à mão, pedindo o motivo de cada item, para cada correção ir para o lugar certo: a skill ou o teste.

Para rodar os testes:

```
claude plugin eval . --runs 2 --ablation none --model sonnet --judge-model sonnet --scaffold --allow-tools "Bash(node:*)" "Bash(git:*)"
```

O `--scaffold` roda o `scaffold.sh` dos casos 6, 7 e 9, que criam repositórios pequenos. Use `--ablation with-without` para rodar também cada caso sem a skill.

## Como está organizada

```
skills/react-a11y-audit/
├── SKILL.md                   regras, passo a passo e formato do relatório
├── references/checklist.md    as checagens, com o critério do WCAG e código ruim/bom
├── references/scanner-to-source.md   como achar o componente de cada resultado do scanner
├── scripts/contrast.mjs       calcula o contraste e as cores mais próximas que passam
└── scripts/tw-color.mjs       transforma classes do Tailwind em cores (paletas em tw-colors.json)
evals/                         os 9 pedidos de teste e seus graders
.claude-plugin/                manifestos do plugin e do marketplace
```

O Claude só vê o nome e a descrição da skill até um pedido combinar com ela. Aí ele carrega o `SKILL.md`, lê o checklist durante a auditoria e só lê o `scanner-to-source.md` quando você cola o resultado de um scanner.

## Licença

[MIT](LICENSE). As paletas de cores em `scripts/tw-colors.json` vêm do [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) (licença MIT, Tailwind Labs).
