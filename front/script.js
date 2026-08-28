const API_URL = "http://localhost:8000";
let itensNovaLista = [];
let itensCompra = [];
let tipoNovaLista = "instant";
let listaEmCompraId = null;

function getAccessToken() { return localStorage.getItem("access_token"); }
function salvarAccessToken(token) { localStorage.setItem("access_token", token); }
function limparSessao() { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); }

function mostrarAuth(tela) {
  document.getElementById("tela-login").style.display = tela === "login" ? "flex" : "none";
  document.getElementById("tela-cadastro").style.display = tela === "cadastro" ? "flex" : "none";
  document.getElementById("app").style.display = "none";
}
function entrarNoApp() {
  document.getElementById("tela-login").style.display = "none";
  document.getElementById("tela-cadastro").style.display = "none";
  document.getElementById("app").style.display = "block";
  mostrarTela("tela-inicio");
}
function logout() { limparSessao(); mostrarAuth("login"); }

async function fazerLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-senha").value;
  const erro = document.getElementById("login-erro");
  erro.textContent = "";
  try {
    const resposta = await fetch(`${API_URL}/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await resposta.json();
    if (!resposta.ok) throw new Error(data.detail || "Email ou senha incorretos.");
    salvarAccessToken(data.access_token);
    if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    document.getElementById("login-form").reset();
    entrarNoApp();
  } catch (e) { erro.textContent = e.message; }
}

async function fazerCadastro(event) {
  event.preventDefault();
  const email = document.getElementById("cadastro-email").value.trim();
  const password = document.getElementById("cadastro-senha").value;
  const confirmacao = document.getElementById("cadastro-senha-confirmacao").value;
  const erro = document.getElementById("cadastro-erro");
  erro.textContent = "";
  if (password !== confirmacao) { erro.textContent = "As senhas não são iguais."; return; }
  try {
    const resposta = await fetch(`${API_URL}/auth/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await resposta.json();
    if (!resposta.ok) throw new Error(data.detail || "Não foi possível criar a conta.");
    document.getElementById("cadastro-form").reset();
    mostrarAuth("login");
    document.getElementById("login-email").value = email;
    document.getElementById("login-erro").textContent = "Conta criada! Agora faça login.";
  } catch (e) { erro.textContent = e.message; }
}

document.getElementById("login-form").addEventListener("submit", fazerLogin);
document.getElementById("cadastro-form").addEventListener("submit", fazerCadastro);

async function fetchAutenticado(url, options = {}) {
  const token = getAccessToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const resposta = await fetch(url, { ...options, headers });
  if (resposta.status === 401) { limparSessao(); mostrarAuth("login"); throw new Error("Sua sessão expirou. Faça login novamente."); }
  return resposta;
}

if (getAccessToken()) entrarNoApp(); else mostrarAuth("login");

function formatarMoeda(valor) { return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function paraNumero(texto) { const n = Number(String(texto).replace(",", ".")); return Number.isFinite(n) && n >= 0 ? n : 0; }
function subtotalItem(item) { return item.unit_price * item.quantity; }
function totalDaLista(itens) { return itens.reduce((soma, item) => soma + subtotalItem(item), 0); }

function mostrarTela(idTela) {
  document.querySelectorAll(".tela").forEach(tela => tela.style.display = "none");
  document.getElementById(idTela).style.display = "block";
  if (idTela === "tela-listas") carregarListas();
}
function iniciarNovaLista(tipo) {
  tipoNovaLista = tipo; itensNovaLista = [];
  document.getElementById("titulo-nova").textContent = tipo === "instant" ? "Lista na hora" : "Lista pra fazer compras depois";
  document.getElementById("nome-lista").value = "";
  document.getElementById("novo-preco").style.display = tipo === "instant" ? "block" : "none";
  renderizarItensNovaLista(); mostrarTela("tela-nova");
}
function adicionarItem() {
  const nome = document.getElementById("novo-nome").value.trim();
  if (!nome) { alert("Informe o nome do produto."); return; }
  itensNovaLista.push({ name: nome, unit_price: tipoNovaLista === "instant" ? paraNumero(document.getElementById("novo-preco").value) : 0, quantity: paraNumero(document.getElementById("novo-qtd").value) || 1, note: document.getElementById("novo-obs").value.trim() });
  document.getElementById("novo-nome").value = ""; document.getElementById("novo-preco").value = ""; document.getElementById("novo-qtd").value = "1"; document.getElementById("novo-obs").value = "";
  renderizarItensNovaLista();
}
function renderizarItensNovaLista() {
  const lista = document.getElementById("lista-itens"); lista.innerHTML = "";
  itensNovaLista.forEach((item, indice) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="info"><strong>${item.name}</strong>${tipoNovaLista === "instant" ? `<small>${formatarMoeda(item.unit_price)} x ${item.quantity} = ${formatarMoeda(subtotalItem(item))}</small>` : `<small>Quantidade: ${item.quantity}</small>`}</div><button class="remover" onclick="removerItemNovaLista(${indice})">x</button>`;
    lista.appendChild(li);
  });
  document.getElementById("total-nova").textContent = tipoNovaLista === "instant" ? `Total: ${formatarMoeda(totalDaLista(itensNovaLista))}` : "";
}
function removerItemNovaLista(indice) { itensNovaLista.splice(indice, 1); renderizarItensNovaLista(); }

async function salvarLista() {
  const nome = document.getElementById("nome-lista").value.trim();
  if (!nome) { alert("Dê um nome pra lista."); return; }
  if (!itensNovaLista.length) { alert("Adicione ao menos um produto."); return; }
  try {
    const resposta = await fetchAutenticado(`${API_URL}/listas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: nome, kind: tipoNovaLista, status: tipoNovaLista === "instant" ? "done" : "pending", itens: itensNovaLista }) });
    if (!resposta.ok) { const data = await resposta.json(); throw new Error(data.detail || "Não foi possível salvar a lista."); }
    alert("Lista salva!"); mostrarTela("tela-listas");
  } catch (e) { alert(e.message); console.error(e); }
}

async function carregarListas() {
  const feitasEl = document.getElementById("listas-feitas"), pendentesEl = document.getElementById("listas-pendentes");
  feitasEl.innerHTML = "<li>Carregando...</li>"; pendentesEl.innerHTML = "";
  try {
    const resposta = await fetchAutenticado(`${API_URL}/listas`);
    if (!resposta.ok) throw new Error("Não foi possível carregar as listas.");
    const listas = await resposta.json();
    const feitas = listas.filter(l => l.status === "done"), pendentes = listas.filter(l => l.status === "pending");
    feitasEl.innerHTML = feitas.length ? feitas.map(l => `<li><div class="info"><strong>${l.name}</strong><small>${new Date(l.completed_at ?? l.created_at).toLocaleDateString("pt-BR")}</small></div><span>${formatarMoeda(l.total)}</span></li>`).join("") : "<li>Nenhuma compra finalizada.</li>";
    pendentesEl.innerHTML = pendentes.length ? pendentes.map(l => `<li><div class="info"><strong>${l.name}</strong><small>${new Date(l.created_at).toLocaleDateString("pt-BR")}</small></div><button onclick="abrirParaComprar(${l.id})">Comprar</button></li>`).join("") : "<li>Nenhuma lista pendente.</li>";
  } catch (e) { feitasEl.innerHTML = `<li>${e.message}</li>`; pendentesEl.innerHTML = ""; console.error(e); }
}

async function abrirParaComprar(id) {
  listaEmCompraId = id;
  const resposta = await fetchAutenticado(`${API_URL}/listas/${id}`);
  if (!resposta.ok) { const data = await resposta.json(); throw new Error(data.detail || "Não foi possível abrir a lista."); }
  const lista = await resposta.json();
  document.getElementById("titulo-comprar").textContent = lista.name;
  itensCompra = lista.itens.map(item => ({ ...item })); renderizarItensCompra(); mostrarTela("tela-comprar");
}
function adicionarItemCompra() {
  const nome = document.getElementById("comprar-nome").value.trim();
  if (!nome) { alert("Informe o nome do produto."); return; }
  itensCompra.push({ name: nome, unit_price: paraNumero(document.getElementById("comprar-preco").value), quantity: paraNumero(document.getElementById("comprar-qtd").value) || 1, note: document.getElementById("comprar-obs").value.trim() });
  document.getElementById("comprar-nome").value = ""; document.getElementById("comprar-preco").value = ""; document.getElementById("comprar-qtd").value = "1"; document.getElementById("comprar-obs").value = ""; renderizarItensCompra();
}
function renderizarItensCompra() {
  const lista = document.getElementById("lista-itens-comprar"); lista.innerHTML = "";
  itensCompra.forEach((item, indice) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="info"><strong>${item.name}</strong><br /><input type="text" inputmode="decimal" value="${item.unit_price}" oninput="atualizarPrecoCompra(${indice}, this.value)" style="width:80px;display:inline-block" /> x <input type="text" inputmode="decimal" value="${item.quantity}" oninput="atualizarQtdCompra(${indice}, this.value)" style="width:60px;display:inline-block" /> = <strong id="subtotal-${indice}">${formatarMoeda(subtotalItem(item))}</strong></div><button class="remover" onclick="removerItemCompra(${indice})">x</button>`;
    lista.appendChild(li);
  }); atualizarTotalCompra();
}
function atualizarTotalCompra() { document.getElementById("total-comprar").textContent = `Total: ${formatarMoeda(totalDaLista(itensCompra))}`; }
function atualizarPrecoCompra(indice, valor) { itensCompra[indice].unit_price = paraNumero(valor); document.getElementById(`subtotal-${indice}`).textContent = formatarMoeda(subtotalItem(itensCompra[indice])); atualizarTotalCompra(); }
function atualizarQtdCompra(indice, valor) { itensCompra[indice].quantity = paraNumero(valor) || 1; document.getElementById(`subtotal-${indice}`).textContent = formatarMoeda(subtotalItem(itensCompra[indice])); atualizarTotalCompra(); }
function removerItemCompra(indice) { itensCompra.splice(indice, 1); renderizarItensCompra(); }
async function finalizarCompra() {
  if (!itensCompra.length) { alert("Adicione ao menos um produto."); return; }
  try {
    const resposta = await fetchAutenticado(`${API_URL}/listas/${listaEmCompraId}/finalizar`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itens: itensCompra }) });
    if (!resposta.ok) { const data = await resposta.json(); throw new Error(data.detail || "Não foi possível finalizar."); }
    alert("Compra finalizada!"); mostrarTela("tela-listas");
  } catch (e) { alert(e.message); console.error(e); }
}
