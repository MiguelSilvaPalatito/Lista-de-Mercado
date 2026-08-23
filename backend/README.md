# Versão Básica — Minhas Compras

Versão bem enxuta, sem autenticação e sem framework no front, só pra focar
no que importa: **cálculo + salvar + atualizar a mesma lista depois**.

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Sobe em `http://localhost:8000`. Documentação em `http://localhost:8000/docs`.

Cria um arquivo `banco.db` (SQLite) automaticamente, com **uma tabela só**:
`listas`. Os itens ficam guardados dentro da própria linha, numa coluna de
texto (`itens_json`) — não existe tabela separada de itens.

## Front

Não precisa instalar nada. É só abrir o `front/index.html` no navegador
(duplo clique, ou clique direito > abrir com navegador).

Se o navegador bloquear o `fetch` por causa de CORS mesmo com o backend
rodando, tenta servir a pasta com um servidor simples em vez de abrir o
arquivo direto:
```bash
cd front
python3 -m http.server 5500
```
E acessa `http://localhost:5500`.

## O fluxo que você pediu, explicado

1. **"Lista na hora"** → o usuário já preenche os itens com preço, aperta
   "Salvar", e isso faz um **INSERT**: uma linha nova na tabela `listas`,
   já com `status="done"` e o total calculado.

2. **"Lista pra fazer compras depois"** → o usuário só dá o nome dos
   produtos (sem preço ainda), aperta "Salvar", e isso faz um **INSERT**
   também — mas com `status="pending"` e itens sem preço (`unit_price: 0`).

3. **Na hora de ir fazer as compras** (botão "Comprar" na lista de
   pendentes) → o usuário abre aquela mesma lista, preenche os preços que
   faltavam, e ao finalizar isso faz um **UPDATE** na mesma linha (mesmo
   `id`) — não cria uma linha nova. O registro original (nome, data de
   criação) continua o mesmo; só os itens e o status são atualizados por
   cima.

Isso é bem mais simples que "sincronizar item por item" (inserir os
novos, atualizar os existentes, remover os apagados) — aqui, o `PUT
/listas/{id}/finalizar` simplesmente **substitui o JSON de itens inteiro**
de uma vez. Funciona bem pro seu caso porque a lista inteira é reescrita
junto, não item por item.

## O que foi tirado de propósito, pra ficar básico

- **Login/autenticação** — não tem usuário nem senha. Todo mundo que abre
  o front vê as mesmas listas. Dá pra adicionar depois, do jeito que a
  gente já estudou (JWT + bcrypt), quando você quiser evoluir.
- **ORM (SQLAlchemy)** — aqui é SQL puro com o módulo `sqlite3` (que já
  vem no Python), pra você ver as queries de verdade.
- **React/Vite/build** — o front é HTML+CSS+JS puro, sem instalar nada,
  sem `npm install`, só abrir e usar.
- **Upload de foto** — não existe nessa versão.

## Honestidade sobre teste

Escrevi e revisei este código com cuidado, e validei a sintaxe Python
(`py_compile`), mas **não consegui rodar de ponta a ponta** neste
ambiente (sem acesso à internet aqui pra instalar o FastAPI). Teste
localmente e me avisa se aparecer algum erro — a gente ajusta junto.
