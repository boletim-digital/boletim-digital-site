// 03-auditoria.js
function registrarAuditoria(acao, detalhes = {}) {
  const logs = JSON.parse(localStorage.getItem("auditoria") || "[]");

  logs.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    dataHora: new Date().toLocaleString("pt-BR"),
    usuario: sessionStorage.getItem("boletimDigitalRg"),
    perfil: sessionStorage.getItem("boletimDigitalPerfil"),
    acao,
    detalhes
  });

  localStorage.setItem("auditoria", JSON.stringify(logs));
}

function obterLogsAuditoriaFiltrados() {
  const logs = JSON.parse(localStorage.getItem("auditoria") || "[]");
  const usuario = document.getElementById("filtroAuditoriaUsuario")?.value || "";
  const acao = document.getElementById("filtroAuditoriaAcao")?.value || "";

  return logs.filter(log => {
    const usuarioOk = !usuario || String(log.usuario) === usuario;
    const acaoOk = !acao || String(log.acao) === acao;
    return usuarioOk && acaoOk;
  });
}

function prepararFiltrosAuditoria() {
  const logs = JSON.parse(localStorage.getItem("auditoria") || "[]");
  const filtroUsuario = document.getElementById("filtroAuditoriaUsuario");
  const filtroAcao = document.getElementById("filtroAuditoriaAcao");

  if (!filtroUsuario || !filtroAcao) return;

  const usuarios = [...new Set(logs.map(l => l.usuario).filter(Boolean))].sort();
  const acoes = [...new Set(logs.map(l => l.acao).filter(Boolean))].sort();

  const usuarioAtual = filtroUsuario.value;
  const acaoAtual = filtroAcao.value;

  filtroUsuario.innerHTML = '<option value="">Todos</option>' + usuarios.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join("");
  filtroAcao.innerHTML = '<option value="">Todas</option>' + acoes.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");

  filtroUsuario.value = usuarioAtual;
  filtroAcao.value = acaoAtual;
}

function renderizarAuditoria() {
  if (!podeVerAuditoria()) {
    document.getElementById("tabelaAuditoria").innerHTML = '<div class="vazio">Você não tem permissão para visualizar a auditoria.</div>';
    return;
  }
  prepararFiltrosAuditoria();

  const container = document.getElementById("tabelaAuditoria");
  const logs = obterLogsAuditoriaFiltrados();

  if (!logs.length) {
    container.innerHTML = '<div class="vazio">Nenhum registro encontrado.</div>';
    return;
  }

  container.innerHTML = logs.map(log => criarCardAuditoria(log)).join("");
}

function criarCardAuditoria(log) {
  return `
    <article class="audit-card">
      <div class="audit-header">
        <div>
          <strong>${escapeHtml(log.acao)}</strong>
          <div class="audit-meta">${escapeHtml(log.dataHora)} • Usuário ${escapeHtml(log.usuario)} • Perfil ${escapeHtml(log.perfil)}</div>
        </div>
        <span class="audit-tag">${escapeHtml(log.acao)}</span>
      </div>
      <div class="audit-body">
        ${renderizarDetalhesAuditoria(log)}
      </div>
    </article>
  `;
}

function renderizarDetalhesAuditoria(log) {
  const detalhes = log.detalhes || {};

  if (detalhes.antes || detalhes.depois) {
    return `
      <div class="audit-diff">
        <div class="audit-box">
          <h4>Antes</h4>
          <pre>${escapeHtml(JSON.stringify(detalhes.antes || {}, null, 2))}</pre>
        </div>
        <div class="audit-box">
          <h4>Depois</h4>
          <pre>${escapeHtml(JSON.stringify(detalhes.depois || {}, null, 2))}</pre>
        </div>
      </div>
    `;
  }

  return `<div class="audit-detalhes">${escapeHtml(JSON.stringify(detalhes, null, 2))}</div>`;
}

function exportarAuditoriaPdf() {
  if (!podeVerAuditoria()) {
    negarAcesso("Você não tem permissão para exportar auditoria.");
    return;
  }
  const logs = obterLogsAuditoriaFiltrados();

  const janela = window.open("", "_blank");
  const conteudo = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Auditoria - Boletim Digital</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 24px; }
        h1 { margin-bottom: 4px; }
        .meta { color: #555; margin-bottom: 20px; }
        .card { border: 1px solid #ccc; border-radius: 8px; margin: 12px 0; page-break-inside: avoid; }
        .head { background: #eee; padding: 10px; border-bottom: 1px solid #ccc; }
        .body { padding: 10px; }
        pre { white-space: pre-wrap; word-break: break-word; font-size: 11px; }
        .diff { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .box { border: 1px solid #ddd; padding: 8px; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <button onclick="window.print()">Imprimir / Salvar em PDF</button>
      <h1>Auditoria - Boletim Digital</h1>
      <div class="meta">Exportado em ${new Date().toLocaleString("pt-BR")} • ${logs.length} registro(s)</div>
      ${logs.map(log => `
        <div class="card">
          <div class="head"><strong>${escapeHtml(log.acao)}</strong><br>${escapeHtml(log.dataHora)} • Usuário ${escapeHtml(log.usuario)} • Perfil ${escapeHtml(log.perfil)}</div>
          <div class="body">${renderizarAuditoriaParaPdf(log)}</div>
        </div>
      `).join("")}
    </body>
    </html>
  `;

  janela.document.open();
  janela.document.write(conteudo);
  janela.document.close();
}

function renderizarAuditoriaParaPdf(log) {
  const detalhes = log.detalhes || {};

  if (detalhes.antes || detalhes.depois) {
    return `
      <div class="diff">
        <div class="box"><strong>Antes</strong><pre>${escapeHtml(JSON.stringify(detalhes.antes || {}, null, 2))}</pre></div>
        <div class="box"><strong>Depois</strong><pre>${escapeHtml(JSON.stringify(detalhes.depois || {}, null, 2))}</pre></div>
      </div>
    `;
  }

  return `<pre>${escapeHtml(JSON.stringify(detalhes, null, 2))}</pre>`;
}
document.getElementById("filtroAuditoriaUsuario")?.addEventListener("change", renderizarAuditoria);
document.getElementById("filtroAuditoriaAcao")?.addEventListener("change", renderizarAuditoria);
document.getElementById("btnExportarAuditoriaPdf")?.addEventListener("click", exportarAuditoriaPdf);
document.getElementById("btnLimparFiltrosAuditoria")?.addEventListener("click", () => {
  document.getElementById("filtroAuditoriaUsuario").value = "";
  document.getElementById("filtroAuditoriaAcao").value = "";
  renderizarAuditoria();
});


/* v71 - marca página auditoria quando usada */
function marcarPaginaAuditoriaAtiva() {
  document.body.classList.remove("pagina-estatistica-ativa", "pagina-fatos-ativa", "pagina-auditoria-ativa");
  document.body.classList.add("pagina-auditoria-ativa");
}
