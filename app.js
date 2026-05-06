const CIDADES_CONTAGEM = [
  "JUAZEIRO", "JAGUARARI", "FLAMENGO", "SOBRADINHO", "PETROLINA",
  "CARNAÍBA", "JUREMAL", "CURAÇÁ", "ITAMOTINGA", "NH3",
  "MANDACARU", "JARDIM PRIMAVERA", "RODEADOURO", "SALITRE",
  "CASA NOVA", "BEM BOM", "CAMPO FORMOSO", "LAGOA DO PORCO",
  "UAUÁ", "MANIÇOBA", "PILAR", "POÇO DE FORA", "PINHÕES",
  "LAJE DOS NEGROS", "SENTO SÉ"
];

const TIPOS_CONTAGEM = [
  "ATIVAÇÃO",
  "SEM CONEXÃO",
  "CONEXÃO LENTA",
  "OSCILAÇÃO",

  "MUDANÇA DE ENDEREÇO",
  "MUDANÇA INTERNA",
  "MUDANÇA DE CIDADE",

  "MIGRAÇÃO DE TECNOLOGIA",
  "FIBRA-MANUTENÇÃO",

  "CONFIGURAÇÃO DE ROTEADOR",
  "TROCA DE SENHA",

  "COMODATO - SUBSTITUIÇÃO",
  "COMODATO - INSTALAÇÃO",

  "AJUDAR OUTRO TÉCNICO",
  "RECOLHIMENTO",

  "EQUIPAMENTOS DESCOLADOS",
  "VERIFICAÇÃO MESH",
  "INSTALAÇÃO MESH",
  "REINCIDÊNCIA",
  "VERIFICAÇÃO DE EQUIPAMENTO"
];

const REGIOES_FILTRO = [
  "JUAZEIRO ATIVAÇÃO",
  "JUAZEIRO SUPORTE",
  "JUAZEIRO TOTAL",
  ...CIDADES_CONTAGEM.filter(cidade => cidade !== "JUAZEIRO"),
  "OUTROS"
];

let demandas = [];
let ignoradas = [];
let rotasSelecionadas = new Set(["JUAZEIRO SUPORTE"]);

document.addEventListener("DOMContentLoaded", () => {
  restaurarTema();
  preencherTipos();
  montarDropdownRotas();
  registrarEventos();
  renderizar();
});

function registrarEventos() {
  document.getElementById("btnTema").addEventListener("click", alternarTema);
  document.getElementById("btnLimpar").addEventListener("click", limpar);
  document.getElementById("btnImportar").addEventListener("click", importarCSV);
  document.getElementById("btnCopiarLote").addEventListener("click", copiarLote);
  document.getElementById("filtroTipo").addEventListener("change", renderizar);
  document.getElementById("buscaLivre").addEventListener("input", renderizar);

  document.getElementById("csvFile").addEventListener("change", () => {
    const file = document.getElementById("csvFile").files[0];
    document.getElementById("fileName").textContent = file ? file.name : "Escolher CSV";
  });

  document.addEventListener("click", (event) => {
    const dropdown = document.getElementById("rotasDropdown");
    if (!dropdown.contains(event.target)) {
      document.getElementById("rotasMenu").classList.remove("open");
    }
  });
}

function restaurarTema() {
  const tema = localStorage.getItem("temaNocRotas") || "light";
  document.body.classList.toggle("dark", tema === "dark");
  atualizarBotaoTema();
}

function alternarTema() {
  document.body.classList.toggle("dark");
  localStorage.setItem("temaNocRotas", document.body.classList.contains("dark") ? "dark" : "light");
  atualizarBotaoTema();
}

function atualizarBotaoTema() {
  const btn = document.getElementById("btnTema");
  if (!btn) return;
  btn.textContent = document.body.classList.contains("dark") ? "☀️ Claro" : "🌙 Escuro";
}

function preencherTipos() {
  const select = document.getElementById("filtroTipo");
  select.innerHTML = "";
  ["TODOS OS TIPOS", ...TIPOS_CONTAGEM].forEach(tipo => {
    const option = document.createElement("option");
    option.value = tipo;
    option.textContent = tipo;
    select.appendChild(option);
  });
}

function montarDropdownRotas() {
  const lista = document.getElementById("listaRotas");
  lista.innerHTML = "";

  REGIOES_FILTRO.forEach(rota => {
    const label = document.createElement("label");
    label.className = "multi-item";
    label.dataset.rota = normalizarVisual(rota);

    label.innerHTML = `
      <span class="multi-item-left">
        <input type="checkbox" value="${escapeAttr(rota)}">
        <span>${escapeHTML(rota)}</span>
      </span>
    `;

    const checkbox = label.querySelector("input");
    checkbox.checked = rotasSelecionadas.has(rota);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) rotasSelecionadas.add(rota);
      else rotasSelecionadas.delete(rota);

      salvarRotasSelecionadas();
      atualizarResumoRotas();
      renderizar();
    });

    lista.appendChild(label);
  });

  const salvas = localStorage.getItem("rotasSelecionadasNoc");
  if (salvas) {
    try {
      const arr = JSON.parse(salvas);
      if (Array.isArray(arr)) rotasSelecionadas = new Set(arr);
    } catch (_) {}
  }

  sincronizarCheckboxRotas();

  document.getElementById("rotasTrigger").addEventListener("click", () => {
    document.getElementById("rotasMenu").classList.toggle("open");
  });

  document.getElementById("buscaRota").addEventListener("input", filtrarRotasDropdown);

  document.getElementById("btnTodasRotas").addEventListener("click", () => {
    REGIOES_FILTRO.forEach(rota => rotasSelecionadas.add(rota));
    salvarRotasSelecionadas();
    sincronizarCheckboxRotas();
    renderizar();
  });

  document.getElementById("btnLimparRotas").addEventListener("click", () => {
    rotasSelecionadas.clear();
    salvarRotasSelecionadas();
    sincronizarCheckboxRotas();
    renderizar();
  });
}

function salvarRotasSelecionadas() {
  localStorage.setItem("rotasSelecionadasNoc", JSON.stringify(Array.from(rotasSelecionadas)));
}

function sincronizarCheckboxRotas() {
  document.querySelectorAll("#listaRotas input[type='checkbox']").forEach(input => {
    input.checked = rotasSelecionadas.has(input.value);
  });

  atualizarResumoRotas();
}

function atualizarResumoRotas() {
  const resumo = document.getElementById("rotasResumo");
  const selecionadas = Array.from(rotasSelecionadas);

  if (!selecionadas.length) {
    resumo.textContent = "Nenhuma rota selecionada";
    return;
  }

  if (selecionadas.length === 1) {
    resumo.textContent = selecionadas[0];
    return;
  }

  resumo.textContent = `${selecionadas[0]} + ${selecionadas.length - 1} rota${selecionadas.length - 1 > 1 ? "s" : ""}`;
}

function filtrarRotasDropdown() {
  const termo = normalizarVisual(document.getElementById("buscaRota").value);

  document.querySelectorAll(".multi-item").forEach(item => {
    const rota = item.dataset.rota;
    item.style.display = !termo || rota.includes(termo) ? "flex" : "none";
  });
}

async function importarCSV() {
  const file = document.getElementById("csvFile").files[0];
  if (!file) {
    alert("Selecione o CSV primeiro.");
    return;
  }

  try {
    const text = (await file.text()).replace(/^\uFEFF/, "");
    const rows = parseCSV(text);

    if (!rows.length) {
      alert("CSV vazio ou inválido.");
      return;
    }

    const processado = processarCSV(rows);
    demandas = processado.validas;
    ignoradas = processado.ignoradas;

    atualizarStats(rows.length - 1);
    popularResumo();
    atualizarContadoresRotas();
    renderizar();

    setStatus(`CSV importado com sucesso. ${demandas.length} O.S válidas encontradas.`, "ok");
  } catch (error) {
    console.error(error);
    setStatus("Erro ao importar: " + error.message, "warn");
  }
}

function processarCSV(rows) {
  const headers = rows[0].map(normalizarCabecalho);

  const idxTitulo = acharColuna(headers, ["TITULO"]);
  const idxStatus = acharColuna(headers, ["STATUS"]);
  const idxProtocolo = acharColuna(headers, ["PROTOCOLO"]);
  const idxBairro = acharColuna(headers, ["BAIRRO DO CLIENTE", "BAIRRO"]);
  const idxCidade = acharColuna(headers, ["CIDADE DO CLIENTE", "CIDADE"]);
  const idxCatalogo = acharColuna(headers, ["CATALAGO DE SERVICOS", "CATALOGO DE SERVICOS"]);

  if (idxTitulo === -1) throw new Error("Não encontrei a coluna Título no CSV.");

  const validas = [];
  const ignoradas = [];

  rows.slice(1).forEach((row, index) => {
    const titulo = get(row, idxTitulo);
    const tituloNormalizado = normalizarTextoContagem(titulo);

    const cidadeContagem = CIDADES_CONTAGEM.find(cidade =>
      tituloNormalizado.includes(normalizarTextoContagem(cidade))
    ) || "";

    const tipoContagem = TIPOS_CONTAGEM.find(tipo =>
      tituloNormalizado.includes(normalizarTextoContagem(tipo))
    ) || "";

    if (!cidadeContagem || !tipoContagem) {
      ignoradas.push({
        linha: index + 2,
        titulo,
        motivo: !cidadeContagem ? "Cidade não encontrada no título" : "Tipo não encontrado no título"
      });
      return;
    }

    const status = get(row, idxStatus);
    const protocolo = get(row, idxProtocolo);
    const bairro = get(row, idxBairro);
    const cidadeCliente = get(row, idxCidade);
    const catalogo = get(row, idxCatalogo);
    const tipoOperacional = extrairTipoOperacional(titulo);
    const cliente = extrairCliente(titulo, cidadeContagem);
    const regiaoFiltro = calcularRegiaoFiltro(cidadeContagem, tipoContagem);

    validas.push({
      linha: index + 2,
      titulo,
      cidadeContagem,
      tipoContagem,
      regiaoFiltro,
      tipoOperacional,
      cliente,
      bairro,
      cidadeCliente,
      catalogo,
      status,
      protocolo,
      textoCopiar: `${cliente}\t${tipoOperacional}\t${bairro}`,
      textoTela: `${cliente} / ${tipoOperacional} / ${bairro}`
    });
  });

  return { validas, ignoradas };
}

function calcularRegiaoFiltro(cidadeContagem, tipoContagem) {
  if (cidadeContagem !== "JUAZEIRO") return cidadeContagem;

  if (
    tipoContagem === "ATIVAÇÃO" ||
    tipoContagem === "MUDANÇA DE ENDEREÇO" ||
    tipoContagem === "MUDANÇA DE CIDADE"
  ) {
    return "JUAZEIRO ATIVAÇÃO";
  }

  return "JUAZEIRO SUPORTE";
}

function renderizar() {
  const tipo = document.getElementById("filtroTipo").value;
  const busca = normalizarVisual(document.getElementById("buscaLivre").value);
  const lista = document.getElementById("lista");

  const selecionadas = Array.from(rotasSelecionadas);

  let filtradas = demandas.filter(d => {
    const bateRegiao = selecionadas.some(regiao => {
      return regiao === "JUAZEIRO TOTAL"
        ? d.cidadeContagem === "JUAZEIRO"
        : d.regiaoFiltro === regiao;
    });

    const bateTipo = tipo === "TODOS OS TIPOS" || d.tipoContagem === tipo;

    const textoBusca = normalizarVisual(`${d.cliente} ${d.bairro} ${d.protocolo} ${d.tipoOperacional}`);
    const bateBusca = !busca || textoBusca.includes(busca);

    return bateRegiao && bateTipo && bateBusca;
  });

  filtradas.sort((a, b) => (
    normalizarVisual(a.bairro).localeCompare(normalizarVisual(b.bairro)) ||
    normalizarVisual(a.cliente).localeCompare(normalizarVisual(b.cliente))
  ));

  atualizarResumoFiltro(filtradas);

  document.getElementById("totalFiltrado").textContent = filtradas.length;
  document.getElementById("saidaLote").value = filtradas.map(d => d.textoCopiar).join("\n");

  lista.innerHTML = "";

  if (!demandas.length) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <strong>Nenhum CSV importado ainda.</strong>
        <span>Importe o relatório para visualizar as demandas.</span>
      </div>
    `;
    return;
  }

  if (!filtradas.length) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <strong>Nenhuma O.S encontrada.</strong>
        <span>Revise as rotas selecionadas, tipo de demanda ou busca.</span>
      </div>
    `;
    return;
  }

  filtradas.forEach(d => {
    const card = document.createElement("article");
    card.className = "os-card";

    const info = document.createElement("div");
    info.innerHTML = `
      <div class="os-title">${escapeHTML(d.cliente)}</div>
      <div class="os-sub">
        <span class="badge ${classeTipo(d.tipoContagem)}">${escapeHTML(d.tipoOperacional)}</span>
        <span class="badge">${escapeHTML(d.bairro || "Sem bairro")}</span>
        <span class="badge green">${escapeHTML(d.regiaoFiltro)}</span>
        <span class="badge">Protocolo: ${escapeHTML(d.protocolo || "-")}</span>
        <span class="badge">Status: ${escapeHTML(d.status || "-")}</span>
      </div>
    `;

    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "COPIAR";
    btn.addEventListener("click", () => copiarLinha(d.textoCopiar, btn));

    card.appendChild(info);
    card.appendChild(btn);
    lista.appendChild(card);
  });
}

function classeTipo(tipo) {
  const t = normalizarVisual(tipo);
  if (t.includes("SEM CONEXAO")) return "red";
  if (t.includes("CONEXAO LENTA") || t.includes("OSCILACAO")) return "amber";
  if (t.includes("ATIVACAO")) return "";
  if (t.includes("MUDANCA")) return "purple";
  return "green";
}

function atualizarResumoFiltro(filtradas) {
  const conta = (predicate) => filtradas.filter(predicate).length;

  document.getElementById("resumoTotal").textContent = filtradas.length;
  document.getElementById("resumoSemConexao").textContent = conta(d => d.tipoContagem === "SEM CONEXÃO");
  document.getElementById("resumoAtivacao").textContent = conta(d => d.tipoContagem === "ATIVAÇÃO");
  document.getElementById("resumoMudancas").textContent = conta(d => normalizarVisual(d.tipoContagem).includes("MUDANCA"));
  document.getElementById("resumoLentidao").textContent = conta(d => ["CONEXÃO LENTA", "OSCILAÇÃO"].includes(d.tipoContagem));
}

function atualizarContadoresRotas() {
  const mapa = {};

  REGIOES_FILTRO.forEach(rota => mapa[rota] = 0);

  demandas.forEach(d => {
    if (d.cidadeContagem === "JUAZEIRO") {
      mapa["JUAZEIRO TOTAL"] = (mapa["JUAZEIRO TOTAL"] || 0) + 1;
    }
    mapa[d.regiaoFiltro] = (mapa[d.regiaoFiltro] || 0) + 1;
  });

  document.querySelectorAll("[data-count-rota]").forEach(el => {
    const rota = el.getAttribute("data-count-rota");
    el.textContent = mapa[rota] || 0;
  });
}

function popularResumo() {
  const tbody = document.getElementById("resumoTabela");
  const mapa = {};

  CIDADES_CONTAGEM.forEach(cidade => mapa[cidade] = 0);

  demandas.forEach(d => {
    mapa[d.cidadeContagem] = (mapa[d.cidadeContagem] || 0) + 1;
  });

  tbody.innerHTML = "";

  Object.keys(mapa).forEach(cidade => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHTML(cidade)}</td><td>${mapa[cidade]}</td>`;
    tbody.appendChild(tr);
  });
}

function extrairTipoOperacional(titulo) {
  const antesDaBarra = String(titulo || "").split("/")[0] || "";
  return antesDaBarra
    .replace(/Protocolo\s+\d+\s*-\s*/i, "")
    .replace(/\((Suporte|Instalação|Instalacao)\)/gi, "")
    .replace(/^Suporte\s*/i, "")
    .trim() || "TIPO NÃO IDENTIFICADO";
}

function extrairCliente(titulo, cidadeContagem) {
  const partes = String(titulo || "").split("/");
  let cliente = partes.length > 1 ? partes.slice(1).join("/").trim() : "";

  const reCidade = new RegExp("^\\s*" + escaparRegex(cidadeContagem) + "\\s*[-–—]?\\s*", "i");
  cliente = cliente.replace(reCidade, "");

  const clienteNorm = normalizarVisual(cliente);
  const cidadeNorm = normalizarVisual(cidadeContagem);

  if (clienteNorm.startsWith(cidadeNorm)) {
    cliente = cliente.substring(cidadeContagem.length).replace(/^\s*[-–—]?\s*/, "");
  }

  return cliente.replace(/^[-–—\s]+/, "").trim() || "CLIENTE NÃO IDENTIFICADO";
}

function atualizarStats(totalCsv) {
  document.getElementById("totalImportado").textContent = totalCsv;
  document.getElementById("totalContabilizado").textContent = demandas.length;
  document.getElementById("totalIgnorado").textContent = ignoradas.length;
}

function limpar() {
  demandas = [];
  ignoradas = [];

  document.getElementById("csvFile").value = "";
  document.getElementById("fileName").textContent = "Escolher CSV";
  document.getElementById("totalImportado").textContent = "0";
  document.getElementById("totalContabilizado").textContent = "0";
  document.getElementById("totalFiltrado").textContent = "0";
  document.getElementById("totalIgnorado").textContent = "0";
  document.getElementById("saidaLote").value = "";
  document.getElementById("buscaLivre").value = "";

  popularResumoVazio();
  atualizarContadoresRotas();
  atualizarResumoFiltro([]);
  renderizar();
  setStatus("Importe o CSV para começar.", "warn");
}

function popularResumoVazio() {
  const tbody = document.getElementById("resumoTabela");
  tbody.innerHTML = `<tr><td colspan="2">Importe o CSV.</td></tr>`;
}

function copiarLinha(texto, btn) {
  navigator.clipboard.writeText(texto.toUpperCase()).then(() => {
    const antigo = btn.textContent;
    btn.textContent = "COPIADO";
    setTimeout(() => btn.textContent = antigo, 900);
  });
}

function copiarLote() {
  const texto = document.getElementById("saidaLote").value;
  if (!texto) return;

  navigator.clipboard.writeText(texto).then(() => {
    setStatus("Lista filtrada copiada em colunas.", "ok");
  });
}

function setStatus(msg, tipo) {
  const el = document.getElementById("statusMsg");
  el.textContent = msg;
  el.className = "notice " + (tipo === "ok" ? "notice-ok" : "notice-warn");
}

function parseCSV(text) {
  const delimiter = detectarDelimitador(text);
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === delimiter && !insideQuotes) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (value || row.length) {
        row.push(value.trim());
        rows.push(row);
        row = [];
        value = "";
      }
      if (char === "\r" && next === "\n") i++;
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows.filter(r => r.some(c => String(c).trim() !== ""));
}

function detectarDelimitador(text) {
  const primeira = text.split(/\r?\n/)[0] || "";
  const cont = ch => (primeira.match(new RegExp("\\" + ch, "g")) || []).length;
  const pontoVirgula = cont(";");
  const virgula = cont(",");
  const tab = (primeira.match(/\t/g) || []).length;

  if (pontoVirgula >= virgula && pontoVirgula >= tab) return ";";
  if (tab >= virgula && tab >= pontoVirgula) return "\t";
  return ",";
}

function normalizarTextoContagem(texto) {
  if (!texto) return "";
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function normalizarVisual(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function normalizarCabecalho(texto) {
  return normalizarVisual(texto);
}

function acharColuna(headersNormalizados, nomes) {
  for (const nome of nomes) {
    const idx = headersNormalizados.indexOf(normalizarCabecalho(nome));
    if (idx !== -1) return idx;
  }
  return -1;
}

function get(row, idx) {
  return idx >= 0 ? String(row[idx] || "").trim() : "";
}

function escaparRegex(texto) {
  return String(texto || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHTML(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(texto) {
  return escapeHTML(texto);
}
