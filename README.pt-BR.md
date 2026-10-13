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

> **2 critical, 2 serious, 2 moderate, 0 minor. 3 items to check in the browser.**
>
> **2. [Critical] The favorite control is not a button and has no name**
> **WCAG 2.2:** 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A)
> **Problem:** The `span` with `onClick` can't be focused or activated by keyboard. The icon-only content also gives it no accessible name.
> **Fix:**
> ```tsx
> <button
>   type="button"
>   className="favorite"
>   aria-label={`Add ${name} to favorites`}
>   onClick={(e) => { e.stopPropagation(); onFavorite(id); }}
> >
>   <HeartIcon aria-hidden="true" />
> </button>
> ```
>
> **Decisions for you**
> - **Old price color** `#9ca3af` on `#ffffff` is 2.54:1. The closest color that passes is `#727780` (4.50:1). Should I apply it, keep it and flag it to design, or change it in the theme token?
> - **Current price color** `#16a34a` on `#ffffff` is 3.30:1. The closest color that passes is `#12873d` (4.61:1). The same three options apply. Making the text 24px or larger (or 18.66px bold) would also drop the requirement to 3:1. I can't tell whether that suits the design.
>
> I can apply fixes 1, 2, 3, 5 and 6 to the file now, if you want. I'll leave the colors until you answer.

Os outros itens: o `div` clicável (deveria ser um link), a imagem sem `alt`, os preços que o leitor de tela lê como dois números soltos e o nome que não é um título. O relatório também lista o que conferir no navegador, porque o CSS do card não estava no código.

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
- **Ela não muda cor sozinha.** Cor muitas vezes é decisão de design, e quem programa não pode mudar sozinho. A skill calcula a razão e a cor mais próxima que passa, e pergunta: aplicar, manter e avisar o design, ou mudar o token do tema.
- **Ela não chuta o escopo.** Se você não diz o que auditar, ela pergunta antes: os arquivos alterados na sua branch, um pull request, uma pasta ou componente, ou o repositório inteiro. Um componente e um repositório inteiro são trabalhos bem diferentes, em tempo e em tokens.
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

Uma skill só ajuda se roda quando deve e fica quieta quando não deve. A pasta `evals/` tem 6 pedidos, rodados com `claude plugin eval`: 4 que devem ativar a skill e 2 pedidos de React que não devem, mesmo com problemas de acessibilidade no código. Só o pedido 2 é em português; os outros estão traduzidos na tabela.

| # | Pedido | Deve ativar | Ativou | O que o teste confere |
|---|---|---|---|---|
| 1 | "Audita a acessibilidade desse componente" (ProductCard) | sim | 17 de 17 | achou os problemas plantados, calculou o contraste, pergunta antes de mudar cor |
| 2 | "Um cliente não consegue assinar a newsletter com leitor de tela" (sem a palavra "acessibilidade") | sim | 16 de 16 | achou os problemas plantados, rótulos em português, nada fora do tema |
| 3 | Violações do Lighthouse coladas, "corrige no Header" | sim | 16 de 16 | corrigiu cada violação, manteve a cor até a pessoa decidir |
| 4 | "Esse ProductCard renderiza demais, como evito?" | não | 0 de 15 | – |
| 5 | "Converte esse componente para TypeScript" | não | 0 de 15 | – |
| 6 | "Confere a acessibilidade do meu app?" num repositório com vários componentes | sim | 9 de 9 | pergunta o que auditar antes de ler qualquer componente |

A skill disparou certo nas 88 execuções, em 10 rodadas com o Claude Sonnet 5.5. Um juiz (LLM) também avalia cada relatório, e nos casos 1 e 3 um teste confere se o contraste foi calculado com o script. A última versão rodou uma vez por caso (os casos 4 e 5 ficaram de fora, porque a descrição não mudou). Os relatórios dos casos 1, 3 e 6 passaram. O caso 2 reprovou num critério mais rígido que a regra que ele conferia; depois de corrigido o critério, o mesmo relatório passou numa nova avaliação feita à mão.

O que os testes pegaram no caminho:

1. **Contraste estimado.** Uma resposta sugeriu uma cor "about 7.9:1" quando o valor era 7,81:1. Agora toda razão, inclusive das cores sugeridas, é calculada com o trecho de código do checklist.
2. **Itens inventados e fora do tema.** Um "Critical" para um estado de favorito que o componente nem recebe, e uma regra de validação de e-mail apontada como problema de acessibilidade. Agora a skill só aponta problemas de acessibilidade que ela vê no código.
3. **Rótulos traduzidos pela metade.** Respostas em português vinham com "Fix" e "Check in the browser" em inglês. A correção foi uma lista dos termos em português acima do modelo, uma conferência antes de enviar e menos rótulos: os itens não têm mais a marca "Confirmado", porque o que não está confirmado vai para "Conferir no navegador".
4. **Cor trocada sem perguntar** e **pedido vago auditado sem perguntar**, as duas de propósito na primeira versão. Viraram perguntas depois de feedback, e os casos 3 e 6 conferem isso.

O juiz também precisou de ajustes: alguns critérios eram mais rígidos que a regra que conferiam. Quando um relatório reprovava, o juiz era rodado de novo à mão, pedindo o motivo de cada item, para cada correção ir para o lugar certo (a skill ou o teste).

Para rodar os testes:

```
claude plugin eval . --runs 2 --ablation none --model sonnet --judge-model sonnet --scaffold --allow-tools "Bash(node:*)" "Bash(git:*)"
```

O `--scaffold` roda o `evals/6-vague-scope/scaffold.sh`, que cria um repositório pequeno para o caso 6.

## Como está organizada

```
skills/react-a11y-audit/
├── SKILL.md                   regras, passo a passo e formato do relatório
└── references/checklist.md    as checagens, com o critério do WCAG e código ruim/bom
evals/                         os 6 pedidos de teste e seus graders
.claude-plugin/                manifestos do plugin e do marketplace
```

O Claude só vê o nome e a descrição da skill até um pedido combinar com ela. Aí ele carrega o `SKILL.md` e lê o checklist durante a auditoria.

## Licença

[MIT](LICENSE)
