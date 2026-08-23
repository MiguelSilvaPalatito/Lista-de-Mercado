// URL do backend FastAPI. Se você rodar em outra porta, muda aqui.
const API_URL = "http://localhost:8000";

// ---------- Estado em memória (enquanto o usuário monta a lista) ----------
let itensNovaLista = [];      // itens da tela "nova lista"
let itensCompra = [];         // itens da tela "fazer compras"
let tipoNovaLista = "instant"; // "instant" ou "planned"
let listaEmCompraId = null;    // id da lista que está sendo comprada agora

// ---------- Funções de cálculo (o "coração" que você quis manter no front) ----------

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function paraNumero(texto) {
  const numero = Number(String(texto).replace(",", "."));
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
}

function subtotalItem(item) {
  return item.unit_price * item.quantity;
}

function totalDaLista(itens) {
  return itens.reduce((soma, item) => soma + subtotalItem(item), 0);
}

// ---------- Navegação simples entre telas (mostra uma, esconde as outras) ----------

function mostrarTela(idTela) {
  document.querySelectorAll(".tela").forEach((tela) => (tela.style.display = "none"));
  document.getElementById(idTela).style.display = "block";

  if (idTela === "tela-listas") carregarListas();
}

// ---------- Tela: nova lista ----------

function iniciarNovaLista(tipo) {
  tipoNovaLista = tipo;
  itensNovaLista = [];
  document.getElementById("titulo-nova").textContent =
    tipo === "instant" ? "Lista na hora" : "Lista pra fazer compras depois";
  document.getElementById("nome-lista").value = "";
  document.getElementById("novo-preco").style.display = tipo === "instant" ? "block" : "none";
  renderizarItensNovaLista();
  mostrarTela("tela-nova");
}

function adicionarItem() {
  const nome = document.getElementById("novo-nome").value.trim();
  if (!nome) {
    alert("Informe o nome do produto.");
    return;
  }

  itensNovaLista.push({
    name: nome,
    unit_price: tipoNovaLista === "instant" ? paraNumero(document.getElementById("novo-preco").value) : 0,
    quantity: paraNumero(document.getElementById("novo-qtd").value) || 1,
    note: document.getElementById("novo-obs").value.trim(),
  });

  // limpa o formulário pro próximo produto
  document.getElementById("novo-nome").value = "";
  document.getElementById("novo-preco").value = "";
  document.getElementById("novo-qtd").value = "1";
  document.getElementById("novo-obs").value = "";

  renderizarItensNovaLista();
}

function renderizarItensNovaLista() {
  const lista = document.getElementById("lista-itens");
  lista.innerHTML = "";

  itensNovaLista.forEach((item, indice) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="info">
        <strong>${item.name}</strong>
        ${tipoNovaLista === "instant"
          ? `<small>${formatarMoeda(item.unit_price)} x ${item.quantity} = ${formatarMoeda(subtotalItem(item))}</small>`
          : `<small>Quantidade: ${item.quantity}</small>`}
      </div>
      <button class="remover" onclick="removerItemNovaLista(${indice})">x</button>
    `;
    lista.appendChild(li);
  });

  document.getElementById("total-nova").textContent =
    tipoNovaLista === "instant" ? `Total: ${formatarMoeda(totalDaLista(itensNovaLista))}` : "";
}

function removerItemNovaLista(indice) {
  itensNovaLista.splice(indice, 1);
  renderizarItensNovaLista();
}

async function salvarLista() {
  const nome = document.getElementById("nome-lista").value.trim();
  if (!nome) {
    alert("Dê um nome pra lista.");
    return;
  }
  if (itensNovaLista.length === 0) {
    alert("Adicione ao menos um produto.");
    return;
  }

  try {
    await fetch(`${API_URL}/listas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nome,
        kind: tipoNovaLista,
        status: tipoNovaLista === "instant" ? "done" : "pending",
        itens: itensNovaLista,
      }),
    });
    alert("Lista salva!");
    mostrarTela("tela-listas");
  } catch (erro) {
    alert("Não foi possível salvar. Confira se o backend está rodando.");
    console.error(erro);
  }
}

// ---------- Tela: listas salvas ----------

async function carregarListas() {
  const feitasEl = document.getElementById("listas-feitas");
  const pendentesEl = document.getElementById("listas-pendentes");
  feitasEl.innerHTML = "<li>Carregando...</li>";
  pendentesEl.innerHTML = "";

  try {
    const resposta = await fetch(`${API_URL}/listas`);
    const listas = await resposta.json();

    const feitas = listas.filter((l) => l.status === "done");
    const pendentes = listas.filter((l) => l.status === "pending");

    feitasEl.innerHTML = feitas.length
      ? feitas
          .map(
            (l) => `
        <li>
          <div class="info">
            <strong>${l.name}</strong>
            <small>${new Date(l.completed_at ?? l.created_at).toLocaleDateString("pt-BR")}</small>
          </div>
          <span>${formatarMoeda(l.total)}</span>
        </li>`,
          )
          .join("")
      : "<li>Nenhuma compra finalizada.</li>";

    pendentesEl.innerHTML = pendentes.length
      ? pendentes
          .map(
            (l) => `
        <li>
          <div class="info">
            <strong>${l.name}</strong>
            <small>${new Date(l.created_at).toLocaleDateString("pt-BR")}</small>
          </div>
          <button onclick="abrirParaComprar(${l.id})">Comprar</button>
        </li>`,
          )
          .join("")
      : "<li>Nenhuma lista pendente.</li>";
  } catch (erro) {
    feitasEl.innerHTML = "<li>Erro ao carregar. O backend está rodando?</li>";
    console.error(erro);
  }
}

// ---------- Tela: fazer as compras (abre uma lista pendente e finaliza) ----------

async function abrirParaComprar(id) {
  listaEmCompraId = id;
  const resposta = await fetch(`${API_URL}/listas/${id}`);
  const lista = await resposta.json();

  document.getElementById("titulo-comprar").textContent = lista.name;

  // Os itens que já tinham nome (sem preço ainda) viram o ponto de partida.
  // O usuário preenche o preço aqui, na hora da compra.
  itensCompra = lista.itens.map((item) => ({ ...item }));
  renderizarItensCompra();
  mostrarTela("tela-comprar");
}

function adicionarItemCompra() {
  const nome = document.getElementById("comprar-nome").value.trim();
  if (!nome) {
    alert("Informe o nome do produto.");
    return;
  }

  itensCompra.push({
    name: nome,
    unit_price: paraNumero(document.getElementById("comprar-preco").value),
    quantity: paraNumero(document.getElementById("comprar-qtd").value) || 1,
    note: document.getElementById("comprar-obs").value.trim(),
  });

  document.getElementById("comprar-nome").value = "";
  document.getElementById("comprar-preco").value = "";
  document.getElementById("comprar-qtd").value = "1";
  document.getElementById("comprar-obs").value = "";

  renderizarItensCompra();
}

function renderizarItensCompra() {
  const lista = document.getElementById("lista-itens-comprar");
  lista.innerHTML = "";

  itensCompra.forEach((item, indice) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="info">
        <strong>${item.name}</strong><br />
        <input type="text" inputmode="decimal" value="${item.unit_price}"
          oninput="atualizarPrecoCompra(${indice}, this.value)" style="width:80px;display:inline-block" />
        x
        <input type="text" inputmode="decimal" value="${item.quantity}"
          oninput="atualizarQtdCompra(${indice}, this.value)" style="width:60px;display:inline-block" />
        =
        <strong>${formatarMoeda(subtotalItem(item))}</strong>
      </div>
      <button class="remover" onclick="removerItemCompra(${indice})">x</button>
    `;
    lista.appendChild(li);
  });

  document.getElementById("total-comprar").textContent =
    `Total: ${formatarMoeda(totalDaLista(itensCompra))}`;
}

function atualizarPrecoCompra(indice, valor) {
  itensCompra[indice].unit_price = paraNumero(valor);
  renderizarItensCompra();
}

function atualizarQtdCompra(indice, valor) {
  itensCompra[indice].quantity = paraNumero(valor) || 1;
  renderizarItensCompra();
}

function removerItemCompra(indice) {
  itensCompra.splice(indice, 1);
  renderizarItensCompra();
}

async function finalizarCompra() {
  if (itensCompra.length === 0) {
    alert("Adicione ao menos um produto.");
    return;
  }

  try {
    // Aqui está o ponto principal que você pediu: isso NÃO cria uma lista
    // nova. É um PUT na MESMA lista (mesmo id), que troca os itens e o
    // status pra "done" — o registro é atualizado, não duplicado.
    await fetch(`${API_URL}/listas/${listaEmCompraId}/finalizar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itens: itensCompra }),
    });
    alert("Compra finalizada!");
    mostrarTela("tela-listas");
  } catch (erro) {
    alert("Não foi possível finalizar. Confira se o backend está rodando.");
    console.error(erro);
  }
}
