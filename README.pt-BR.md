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
- **Nomes:** botão só com ícone, `alt`, SVG, link vago, diálogos, `aria-label` diferente do texto visível
- **Formulários:** rótulos, erro ligado ao campo, grupos, `autoComplete`, colar bloqueado
- **Teclado e foco:** outline removido, `tabIndex`, menu que só abre com o mouse, modais, widgets próprios, caixas com rolagem como blocos de código
- **ARIA:** `aria-hidden` em elemento focável, ids que faltam ou se repetem, valores inválidos
- **Conteúdo dinâmico:** mensagens de status, live regions, carregamento, troca de rota
- **Cor:** contraste de texto e de interface (calculado com um script, nunca estimado), cor como único sinal. As classes do Tailwind viram cores de verdade antes, na v3 e na v4, inclusive as cores próprias do projeto no `@theme` ou no `tailwind.config.js` e as variáveis de CSS em `:root` e `.dark` (como no shadcn/ui), com um resultado para cada modo. As cores definidas no CSS do projeto também entram (links do `.prose`, código no texto). Para corrigir, ela oferece um tom que o projeto já tem antes de um hex novo
- **Tamanho de alvo, movimento e mídia:** alvos de 24×24 px, ação só com arrastar, autoplay, legendas
- **Página:** `lang`, título da página, link para pular ao conteúdo, zoom bloqueado

Cada problema vem com a gravidade (crítico, sério, moderado, menor), o critério do WCAG e a correção.

## O que ela não faz

- **Ela é para a web.** React Native fica de fora: as checagens são de HTML, ARIA e navegador.
- **Ela lê o código, não abre a página.** O que depende de um CSS que ela não vê, de um tema, de um componente de terceiros cujo código ela não consegue ler ou do estado em tempo de execução vai para uma lista "Conferir no navegador", em vez de ser chutado. O mesmo vale para as cores do Tailwind que o script não resolve: variáveis de CSS fora de `:root` e `.dark`, fundo transparente quando a cor de trás é desconhecida, e `tailwind.config.ts`.
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

Uma skill só ajuda se roda quando deve, fica quieta quando não deve e se sai melhor que o Claude sem ela. A pasta `evals/` tem 13 pedidos, rodados com `claude plugin eval` e o Claude Sonnet 5.5. Os pedidos 2 e 8 são em português; os outros estão traduzidos nas tabelas.

### Ela dispara na hora certa?

| # | Pedido | Deve ativar | Ativou |
|---|---|---|---|
| 1 | "Audita a acessibilidade desse componente" (ProductCard) | sim | 44 de 44 |
| 2 | "Um cliente não consegue assinar a newsletter com leitor de tela" (sem a palavra "acessibilidade") | sim | 47 de 47 |
| 3 | Violações do Lighthouse coladas, "corrige no Header" | sim | 37 de 37 |
| 4 | "Esse ProductCard renderiza demais, como evito?" | não | 0 de 29 |
| 5 | "Converte esse componente para TypeScript" | não | 1 de 35 |
| 6 | "Confere a acessibilidade do meu app?" num repositório com vários componentes | sim | 23 de 23 |
| 7 | Resultado do axe de uma página: "de onde vem cada problema no nosso código?" | sim | 31 de 31 |
| 8 | "Revisa esse banner? As cores são do time de design" | sim | 42 de 42 |
| 9 | "Confere a acessibilidade de src/components/PlanCard.tsx" (Tailwind v4, com uma cor do projeto) | sim | 24 de 24 |
| 10 | "Confere a acessibilidade de src/components/DeleteAccount.tsx" (dialog do shadcn/ui, uma cor que só falha no modo escuro) | sim | 18 de 18 |
| 11 | "Confere a acessibilidade desse componente React Native?" | não | 0 de 10 |
| 12 | "Meu campo de busca perde o foco a cada letra que digito. Por quê?" | não | 0 de 10 |
| 13 | "Audita a acessibilidade desse formulário" (um formulário sem problema real) | sim | 12 de 12 |

Certo em 361 de 362 execuções. Os casos 4, 5 e 12 têm problemas de acessibilidade no código, então a skill tinha motivo para disparar, e o caso 12 também usa a palavra "foco". Ela ficou quieta todas as vezes, menos uma nas 35 execuções do caso 5.

### Ela é melhor que o Claude sem ela?

Os dois lados tiveram os mesmos pedidos e o mesmo juiz (Claude Sonnet 5.5). A coluna "com" é a última rodada de cada caso: a versão 1.1.2 nos casos 1, 2 e 8, e a 1.1.1 nos outros (veja o item 15). A coluna "sem" é da última rodada feita sem a skill (duas vezes por caso, o caso 9 quatro vezes), avaliada com os critérios daquela época.

| # | Com a skill | Sem | O que fez a diferença |
|---|---|---|---|
| 1 | 2 de 2 | 0 de 2 | Sem a skill, o Claude trocou as cores na correção sem perguntar, estimou o contraste ("about 3.3:1") e incluiu itens que o código não tem. |
| 2 | 2 de 2 | 0 de 2 | Sem a skill, ele apontou a regra de validação do e-mail como problema de acessibilidade. |
| 3 | 2 de 2 | 0 de 2 | Sem a skill, ele trocou a cor do carrinho no código corrigido sem perguntar. |
| 6 | 2 de 2 | 0 de 2 | Sem a skill, ele saiu lendo o repositório inteiro em vez de perguntar o que auditar. |
| 7 | 2 de 2 | 0 de 2 | Os dois acharam a origem de cada problema. Sem a skill, o Claude propôs remendar o iframe do fornecedor do chat pelo código do projeto. |
| 8 | 2 de 2 | 0 de 2 | Sem a skill, não veio um recado pronto para o time de design. |
| 9 | 2 de 2 | 0 de 4 | Sem a skill, o Claude usou as cores do Tailwind v3 (`#9ca3af`) num projeto v4 e estimou as razões ("about 2.5:1"). Uma resposta não achou a cor do projeto no `@theme`. |

Nas versões anteriores, alguns relatórios reprovaram. Cada falha foi avaliada de novo com o motivo de cada item, para a correção ir para o lugar certo: a skill ou o teste. "O que os testes mudaram", abaixo, lista essas falhas.

O Claude sozinho já acha a maior parte dos problemas. O que a skill acrescenta é o jeito de lidar com eles: contraste calculado em vez de estimado, cor deixada para quem decide, a pergunta de escopo, o mapa do resultado do scanner até os arquivos e o recado para o design.

### Num projeto real

Os casos acima foram escritos para a skill, então não mostram tudo. Para testar em código que ninguém escreveu para ela, a skill auditou o [shadcn-admin](https://github.com/satnaing/shadcn-admin) (15,7 mil estrelas; React 19, Vite, shadcn/ui, Tailwind v4; commit `e16c87f`). O axe 4.11 rodou nas mesmas páginas, no modo claro e no escuro, com as regras A e AA do WCAG, e achou 2 problemas: o select de "linhas por página" não tem nome (páginas de tarefas e de usuários), e o badge "suspended" dá 4,0:1. A skill leu o código de 4 páginas: tarefas, usuários, configurações e login.

| | Primeira rodada | Depois das correções dos itens 10 e 12 |
|---|---|---|
| Problemas do axe achados | 0 de 2 | 2 de 2, com a severidade do axe: Critical para o select, Serious para o badge (4,01:1) |
| Páginas com contraste calculado | 3 de 4 | 4 de 4 |
| Achados falsos | 4 | nenhum dos 4 voltou; os 4 achados novos conferidos à mão eram reais |
| Boas práticas (tabela sem nome, o mesmo nome em toda linha) | Serious | Minor |

A skill também achou o que o axe não vê numa página carregada: grupos de rádio sem nome num drawer fechado, o menu de configurações no celular, bordas de campo com 1,23:1 (1.4.11), foco que some no modo de alto contraste do Windows, um nível de heading pulado, um link sem nenhum sinal visual e um título de card que não é heading.

**Um blog em Next.js.** O segundo projeto é o [tailwind-nextjs-starter-blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) (10,5 mil estrelas; Next.js 15 com App Router, Tailwind v4, Headless UI e o pacote pliny; commit `b45bef6`). O axe rodou em 7 páginas, no modo claro e no escuro, no celular com o menu aberto e com o menu de tema aberto. A skill auditou três partes pelo código (a página inicial, o header com o menu mobile e uma página de post) e mapeou o resultado do axe de uma página de tag. Nessas três partes, o axe achou 6 problemas, contando cada regra uma vez por parte: links e tags rosa com 3,58:1, tags com menos de 24px (2.5.8) na página inicial e no post, blocos de código que não rolam pelo teclado e, só com o menu de tema aberto, papéis de rádio dentro de um menu. Na página de post, as falhas de contraste incluem o código no meio do texto com 4,40:1 no modo escuro.

| | Primeira rodada | Depois das correções do item 13 (2 execuções) |
|---|---|---|
| Problemas do axe achados pelo código | 3 de 6 | 5 de 6 e 6 de 6 |
| Cores definidas no CSS (links do `.prose`, código no texto) | iam para a lista do navegador | calculadas: 3,58:1 e 4,40:1, como o axe mediu |
| Componentes de pacote (formulário de newsletter e bloco de código do pliny) | não lidos | lidos: o botão com 3,58:1, erros que não são anunciados, um botão de copiar que só aparece com o mouse em cima |
| Link para pular ao conteúdo quando a página tem `<main>` | Moderate | Minor (boa prática) |
| Resultado do axe mapeado no código (página de tag) | 2 de 2, contando 15 elementos de 16 | 2 de 2, com a contagem certa |

Pelo código, ela também achou o que o axe não aponta numa página carregada: links do menu mobile com contorno de foco de 0px (`outline outline-0` vence o estilo de foco global), o diálogo do menu mobile sem nome e um botão de menu sem `aria-expanded`.

### O que os testes mudaram

1. **Contraste estimado.** Uma resposta sugeriu uma cor "about 7.9:1" quando o valor era 7,81:1. Agora toda razão, inclusive das cores sugeridas, é calculada com o script `scripts/contrast.mjs` da skill.
2. **Itens inventados e fora do tema.** Um "Critical" para um estado de favorito que o componente nem recebe, uma regra de validação de e-mail apontada como problema de acessibilidade, e "os cards não estão numa lista" quando a lista fica num componente pai que não estava no código. Agora a skill só aponta problemas de acessibilidade que ela vê no código.
3. **Rótulos traduzidos pela metade.** Respostas em português vinham com "Fix" e "Check in the browser" em inglês. O modelo do relatório agora lista os termos em português, o relatório é conferido antes de enviar, e o rótulo virou uma frase ("How to fix"), que o modelo traduz com mais confiança do que a palavra solta.
4. **Cor trocada sem perguntar** e **pedido vago auditado sem perguntar.** As primeiras versões faziam as duas coisas. Hoje as duas viraram perguntas, e os casos 3 e 6 conferem isso.
5. **Remendo no widget do fornecedor.** Para o iframe do chat, uma resposta ofereceu um `MutationObserver` que mexe no iframe do fornecedor. Agora a skill aponta para a configuração do fornecedor e explica por que um remendo quebra.
6. **Resposta na língua da página.** No caso 7, o pedido foi em inglês, mas 3 de 4 respostas vieram em português, a língua da página. Uma primeira regra ("a língua das palavras de quem pediu") não resolveu: 2 de 2 ainda em português. Uma regra explícita, com o exemplo "pedido em inglês recebe relatório em inglês, mesmo com a página em português", resolveu: 2 de 2 em inglês. Nas rodadas seguintes, 7 de 9 vieram em inglês. Pedir ao Claude para anotar o idioma do pedido logo no primeiro passo, antes de ler qualquer arquivo, levou a 6 de 6.
7. **Script bloqueado, cor chutada.** No caso 9, 3 de 8 respostas montaram o comando com algo antes do `node` (`ls; …` ou uma variável). Os testes só liberam comandos que começam com `node`, então o comando foi bloqueado, e o Claude usou de memória as cores do Tailwind v3 num projeto v4. Muita gente também só libera o `node` no dia a dia. Agora um script só, o `contrast.mjs`, recebe as classes e devolve a razão, e a skill pede para rodá-lo como um comando separado, começando com `node`: 4 de 4 depois da mudança.
8. **Cor de dentro do wrapper esquecida.** No caso 10, a cor da descrição vem de `components/ui/dialog.tsx`. O Claude leu esse arquivo, mas calculou só as cores escritas no `DeleteAccount.tsx`, e perdeu a falha do modo escuro em 2 de 2. Com uma regra para incluir as cores dos wrappers, 1 de 2 ainda deixou o par em "Conferir no navegador" sem calcular. Uma última conferência antes de enviar (par de cores que ficou lá passa pelo script antes) levou a 3 de 3.
9. **Uma nota sobre o scanner que escondeu um achado.** Uma linha nova dizia para ler só as falhas do scanner, e uma resposta no caso 3 chamou de "opcional" o nome que falta no link do carrinho, porque o Lighthouse não apontou. A linha agora diz que um problema visto no código continua sendo achado: 3 de 3.
10. **O projeto real.** No shadcn-admin, a primeira rodada perdeu os dois problemas do axe: não leu a paginação compartilhada e mandou para a lista do navegador o badge com fundo transparente. Numa das páginas, leu arquivos com `cat`, que foi bloqueado, e desistiu do script também. Também teve 4 achados falsos: `autoComplete` pedido num formulário em que um admin edita outras pessoas, um label que o wrapper do formulário já liga, e dois ícones do lucide que já são escondidos. Agora o script aceita `--behind` para fundos transparentes e lê cores do tema com transparência, e a skill lê todo componente compartilhado que a página renderiza, lê arquivos com as ferramentas de arquivo e manda para a lista do navegador o que ela escreveria com ressalva ("pode", "confira antes").
11. **O juiz lia errado os próprios critérios.** Com todos os itens num critério só, o juiz reprovava de 20% a 30% dos relatórios certos nos casos 1, 2 e 8, sem dizer por quê. Com um juiz por item, a falha passou a dizer o item, e os critérios se mostraram abertos a outra leitura: o estado de favorito, dado como exemplo de achado inventado, pegava também uma sugestão opcional; "sem bloco de código" no recado para o design foi lido como regra para a resposta inteira; e uma pergunta dentro desse recado parecia uma pergunta ao usuário. Com critérios mais claros, a última rodada passou em 26 de 26.
12. **Severidade, e um label ao lado do select.** No projeto real, boas práticas vinham como "Serious" (tabela sem nome, o mesmo nome em toda linha). O checklist agora lista esses itens como Minor no máximo. Numa rodada, a skill leu a paginação mas não pegou o select: o texto "Rows per page" fica ao lado sem ser o label dele, e um select do Radix não pega o nome do valor que mostra. O checklist agora diz isso, e as duas páginas voltaram a achar, como Critical, igual ao axe.
13. **O blog em Next.js.** A primeira rodada mandou as cores definidas no CSS (links do `.prose`, código no texto) para a lista do navegador, não abriu os componentes de pacote que a página renderiza (o formulário de newsletter e o bloco de código do pliny) e não viu que tags de 20px de altura numa linha que quebra reprovam no 2.5.8. Também não pegou o nome de um diálogo do Headless UI, porque o checklist só cobria cópias locais como o shadcn/ui, e deu Moderate para a falta de link de pular ao conteúdo em páginas com `<main>`, que já atende o 2.4.1. Agora a skill lê o CSS global e os componentes de pacote que consegue ler, o `contrast.mjs` aceita `var(--x)` como está escrito no CSS, e o checklist cobre links de texto como alvo, diálogos e widgets aninhados de bibliotecas headless, caixas com rolagem sem nada focável e o link de pular como boa prática quando há `<main>`. Na última rodada, o caso do header não pegou o `outline-0` do menu mobile em 2 de 2 execuções, e uma execução apontou um ícone dentro de um botão que já tem nome. O checklist agora cita os dois.
14. **Os 13 casos na 1.1.0.** A primeira rodada passou em 22 de 26. O caso 8 reprovou nas duas execuções na mensagem para o design, mas o juiz rodado de novo à mão aprovou, e ele passou em 2 de 2 quando rodou de novo. No caso 3, o critério pedia ícones escondidos mesmo quando o botão tem `aria-label`, o que o checklist diz que não precisa, então o teste foi corrigido. No caso 9, um relatório deu a razão de `text-gray-400` sem o hex, então a skill agora escreve cada classe com o seu hex. No header do blog, as duas regras novas funcionaram em uma de 2 execuções. A outra mandou o `outline-0` para a lista do navegador depois de ler o CSS global, apontou como pequeno um botão de exatamente 24px e voltou atrás em itens no próprio relatório ("Removo este item da contagem"). Agora o checklist diz que o outline é achado depois de ler o CSS global e que 24px passa, e a skill fecha a lista antes de escrever. Na 1.1.1, os casos 3 e 9 passaram em 2 de 2, e o caso do header achou o outline em 2 de 2, sem alvo falso e sem item desfeito.
15. **Os 13 casos na 1.1.1.** A rodada passou em 23 de 26, e todos os casos ativaram certo. O juiz do `claude plugin eval` responde com uma palavra, com um prompt de sistema que pede rigor. O mesmo prompt, rodado de novo à mão pedindo o motivo, mostrou o que falhou no caso 8: comentários `// before` e `// after` num relatório em português, e uma mensagem para o design que dava o mínimo uma vez só para as duas cores. Agora a skill traduz os comentários do código e dá a cada cor o mínimo para o tamanho do texto. O juiz também contou como erro chamar "Ver ofertas" de botão (é um link com cara de botão) e a linha "WCAG 2.2:", então os critérios do caso 8 agora dizem que os dois estão certos. A falha do caso 1 passou ao ser avaliada de novo com o mesmo prompt. Na 1.1.2, os casos 1, 2 e 8 passaram em 2 de 2.

O juiz também precisou de ajustes: alguns critérios eram mais rígidos que a regra que conferiam. Quando um relatório reprovava, o juiz era rodado de novo à mão, pedindo o motivo de cada item, para cada correção ir para o lugar certo: a skill ou o teste. Os casos 1, 2, 3, 8 e 13 agora avaliam cada critério com um juiz próprio, então uma falha diz qual item reprovou.

Para rodar os testes:

```
claude plugin eval . --runs 2 --ablation none --model sonnet --judge-model sonnet --scaffold --allow-tools "Bash(node:*)" "Bash(git:*)"
```

O `--scaffold` roda o `scaffold.sh` dos casos 6, 7, 9 e 10, que criam repositórios pequenos. Use `--ablation with-without` para rodar também cada caso sem a skill.

## Como está organizada

```
skills/react-a11y-audit/
├── SKILL.md                   regras, passo a passo e formato do relatório
├── references/checklist.md    as checagens, com o critério do WCAG e código ruim/bom
├── references/scanner-to-source.md   como achar o componente de cada resultado do scanner
├── scripts/contrast.mjs       calcula o contraste e as cores mais próximas que passam
└── scripts/tw-color.mjs       transforma classes do Tailwind em cores (paletas em tw-colors.json)
evals/                         os 13 pedidos de teste e seus graders
.claude-plugin/                manifestos do plugin e do marketplace
```

O Claude só vê o nome e a descrição da skill até um pedido combinar com ela. Aí ele carrega o `SKILL.md`, lê o checklist durante a auditoria e só lê o `scanner-to-source.md` quando você cola o resultado de um scanner.

## Próximos passos

A versão 1.1.2 é a que este README descreve. O que pode vir depois:

- **Rodar os 13 casos na 1.1.2.** Os 13 rodaram na 1.1.1. As mudanças do item 15 rodaram nos casos 1, 2 e 8.
- **Testar as partes do checklist que nenhum caso cobre ainda:** teclado em componentes próprios (menus, abas), mensagens de status, o nível da página (`lang`, título) e animação.
- **Um projeto real com Tailwind v3.** Os dois projetos reais usam a v4, então o caminho do `tailwind.config.js` ainda não rodou em código de verdade.
- **Mais execuções por caso.** As últimas mudanças rodaram duas vezes cada caso.
- **Ler o `tailwind.config.ts`.** Hoje o script lê só configs `.js`, `.cjs` e `.mjs`.
- **Modo PR:** separar o que o pull request criou do que já existia.
- **Conferir depois de corrigir:** rodar o que o projeto já tiver (eslint-plugin-jsx-a11y, Playwright ou Storybook com axe) para fechar o ciclo auditar, corrigir e conferir.
- **Dizer o que o leitor de tela deve falar** em cada correção ("Adicionar aos favoritos, botão"), mais os passos de teclado, para qualquer pessoa conferir.
- **Um GIF da skill rodando** neste README.

## Licença

[MIT](LICENSE). As paletas de cores em `scripts/tw-colors.json` vêm do [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) (licença MIT, Tailwind Labs).
