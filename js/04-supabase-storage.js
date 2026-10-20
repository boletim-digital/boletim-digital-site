// Persistência remota compatível com o modelo legado em memória.

let sincronizacaoSupabaseTimer = null;
let sincronizacaoSupabaseEmAndamento = Promise.resolve();

function dataBrParaIsoSupabase(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!br) return null;
  return `${br[3]}-${String(br[2]).padStart(2, "0")}-${String(br[1]).padStart(2, "0")}`;
}

function idBoletimSupabase(boletim) {
  if (boletim?.id) return String(boletim.id);
  const base = [boletim?.tipo, boletim?.numero, boletim?.data]
    .filter(Boolean)
    .join("-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return base || `boletim-${Date.now()}`;
}

function notaReservadaSupabase(nota) {
  try {
    if (typeof notaEhReservadaOficiaisV213 === "function") {
      return Boolean(notaEhReservadaOficiaisV213(nota));
    }
  } catch {}

  return Boolean(
    nota?.reservadoOficiais ||
    /reservado\s+de\s+oficiais/i.test(String(nota?.boletim || ""))
  );
}

function payloadNotaCompartilhadaSupabase(nota) {
  const payload = { ...nota };
  delete payload.favorita;
  delete payload.favorito;
  delete payload.favoritada;
  return payload;
}

function notaParaLinhaSupabase(nota) {
  return {
    id: String(nota.id),
    numero: nota.numero || null,
    titulo: nota.titulo || null,
    parte: nota.parte || null,
    secao: nota.secao || null,
    subsecao: nota.subsecao || null,
    boletim: nota.boletim || null,
    data_referencia: dataBrParaIsoSupabase(nota.data),
    reservado_oficiais: notaReservadaSupabase(nota),
    ordem_inclusao: Number(nota.ordemInclusao || nota.inseridoEm || nota.criadoEm || 0) || null,
    payload: payloadNotaCompartilhadaSupabase(nota),
    atualizado_por: usuarioAtualId()
  };
}

function linhaParaNotaSupabase(linha) {
  return {
    ...(linha.payload || {}),
    id: linha.id,
    numero: linha.numero || linha.payload?.numero || "",
    titulo: linha.titulo || linha.payload?.titulo || "",
    parte: linha.parte || linha.payload?.parte || "",
    secao: linha.secao || linha.payload?.secao || "",
    subsecao: linha.subsecao || linha.payload?.subsecao || "",
    boletim: linha.boletim || linha.payload?.boletim || "",
    reservadoOficiais: Boolean(linha.reservado_oficiais),
    ordemInclusao: linha.ordem_inclusao || linha.payload?.ordemInclusao
  };
}

function boletimParaLinhaSupabase(boletim) {
  return {
    id: idBoletimSupabase(boletim),
    numero: String(boletim.numero || ""),
    titulo: boletim.titulo || null,
    data_referencia: dataBrParaIsoSupabase(boletim.data),
    tipo: boletim.tipo || null,
    payload: boletim,
    atualizado_por: usuarioAtualId()
  };
}

function linhaParaBoletimSupabase(linha) {
  return {
    ...(linha.payload || {}),
    id: linha.id,
    numero: linha.numero,
    titulo: linha.titulo || linha.payload?.titulo || "",
    tipo: linha.tipo || linha.payload?.tipo || ""
  };
}

async function selecionarTodasLinhasSupabase(tabela, colunas, ordenarPor) {
  const cliente = clienteSupabase();
  const resultado = [];
  const tamanhoPagina = 1000;

  for (let inicio = 0; ; inicio += tamanhoPagina) {
    let consulta = cliente.from(tabela).select(colunas).range(inicio, inicio + tamanhoPagina - 1);
    if (ordenarPor) consulta = consulta.order(ordenarPor, { ascending: false });

    const { data, error } = await consulta;
    if (error) throw error;
    resultado.push(...(data || []));
    if (!data || data.length < tamanhoPagina) break;
  }

  return resultado;
}

async function carregarFavoritosSupabase() {
  const cliente = clienteSupabase();
  const usuarioId = usuarioAtualId();
  if (!cliente || !usuarioId) return [];

  const { data, error } = await cliente
    .from("favoritos")
    .select("nota_id")
    .eq("usuario_id", usuarioId);

  if (error) throw error;
  const ids = (data || []).map(item => String(item.nota_id));

  try {
    if (typeof salvarFavIdsV194 === "function") salvarFavIdsV194(ids);
  } catch {}

  window.favoritosSupabaseIds = new Set(ids);
  return ids;
}

async function carregarAuditoriaSupabase() {
  const cliente = clienteSupabase();
  if (!cliente || !podeVerAuditoria()) return;

  const { data, error } = await cliente
    .from("auditoria")
    .select("id,usuario_id,acao,detalhes,criado_em")
    .order("criado_em", { ascending: false })
    .limit(2000);

  if (error) throw error;
  const logs = (data || []).map(item => ({
    id: item.id,
    dataHora: new Date(item.criado_em).toLocaleString("pt-BR"),
    usuario: item.usuario_id || "sistema",
    perfil: "",
    acao: item.acao,
    detalhes: item.detalhes || {}
  }));
  localStorage.setItem("auditoria", JSON.stringify(logs));
}

async function carregarEstadoCompartilhadoSupabase() {
  const cliente = clienteSupabase();
  if (!cliente) return;

  const { data, error } = await cliente
    .from("estado_compartilhado")
    .select("chave,payload");

  if (error) throw error;

  (data || []).forEach(item => {
    if (item.chave === "estrutura_organizacional") {
      dados.estruturaOrganizacional = item.payload || {};
    }
    if (item.chave === "fatos_historicos") {
      localStorage.setItem("boletimDigitalFatosHistoricos", JSON.stringify(item.payload || []));
    }
    if (item.chave === "estatisticas") {
      localStorage.setItem("boletimDigitalEstatisticasV50", JSON.stringify(item.payload || []));
    }
  });

  return data || [];
}

function podeMigrarDadosLocaisSupabase() {
  const perfil = String(typeof perfilAtual === "function" ? perfilAtual() : "").toLowerCase();
  return ["desenvolvedor", "administrador", "editor"].includes(perfil);
}

function lerJsonLocalSupabase(chave, fallback) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "null");
    return valor ?? fallback;
  } catch {
    return fallback;
  }
}

async function migrarEstadoLocalInicialSupabase(chavesRemotas) {
  if (!podeMigrarDadosLocaisSupabase()) return;

  const existentes = new Set((chavesRemotas || []).map(item => item.chave));
  const pendentes = [];
  const estrutura = dados?.estruturaOrganizacional;
  const fatos = lerJsonLocalSupabase("boletimDigitalFatosHistoricos", []);
  const estatisticasLocais = lerJsonLocalSupabase("boletimDigitalEstatisticasV50", []);

  if (!existentes.has("estrutura_organizacional") && estrutura && Object.keys(estrutura).length) {
    pendentes.push(salvarEstadoCompartilhadoSupabase("estrutura_organizacional", estrutura));
  }
  if (!existentes.has("fatos_historicos") && Array.isArray(fatos) && fatos.length) {
    pendentes.push(salvarEstadoCompartilhadoSupabase("fatos_historicos", fatos));
  }
  if (!existentes.has("estatisticas") && Array.isArray(estatisticasLocais) && estatisticasLocais.length) {
    pendentes.push(salvarEstadoCompartilhadoSupabase("estatisticas", estatisticasLocais));
  }

  await Promise.all(pendentes);
}

async function carregarDadosSupabase() {
  const cliente = clienteSupabase();
  if (!cliente || !usuarioAtualId()) return false;

  const dadosLocais = {
    notas: Array.isArray(dados?.notas) ? [...dados.notas] : [],
    boletins: Array.isArray(dados?.boletins) ? [...dados.boletins] : []
  };

  const [notasRemotas, boletinsRemotos] = await Promise.all([
    selecionarTodasLinhasSupabase(
      "notas",
      "id,numero,titulo,parte,secao,subsecao,boletim,data_referencia,reservado_oficiais,ordem_inclusao,payload",
      "data_referencia"
    ),
    selecionarTodasLinhasSupabase(
      "boletins",
      "id,numero,titulo,data_referencia,tipo,payload",
      "data_referencia"
    )
  ]);

  const servidorSemConteudo = notasRemotas.length === 0 && boletinsRemotos.length === 0;
  const haConteudoLocal = dadosLocais.notas.length > 0 || dadosLocais.boletins.length > 0;

  if (servidorSemConteudo && haConteudoLocal && podeMigrarDadosLocaisSupabase()) {
    dados.notas = dadosLocais.notas;
    dados.boletins = dadosLocais.boletins;
    await sincronizarDadosSupabase();
  } else {
    dados.notas = notasRemotas.map(linhaParaNotaSupabase);
    dados.boletins = boletinsRemotos.map(linhaParaBoletimSupabase);
  }

  const [, estadoRemoto] = await Promise.all([
    carregarFavoritosSupabase(),
    carregarEstadoCompartilhadoSupabase(),
    carregarAuditoriaSupabase()
  ]);
  await migrarEstadoLocalInicialSupabase(estadoRemoto);

  try { prepararTopo(); } catch {}
  try { prepararCalendario(); } catch {}
  try { renderizarNotas(); } catch {}
  return true;
}

async function sincronizarDadosSupabase() {
  const cliente = clienteSupabase();
  const usuarioId = usuarioAtualId();
  if (!cliente || !usuarioId || !dados) return false;

  const notas = (dados.notas || []).filter(nota => nota?.id).map(notaParaLinhaSupabase);
  const boletins = (dados.boletins || []).filter(boletim => boletim?.numero).map(boletimParaLinhaSupabase);

  if (notas.length) {
    const { error } = await cliente.from("notas").upsert(notas, { onConflict: "id" });
    if (error) throw error;
  }

  if (boletins.length) {
    const { error } = await cliente.from("boletins").upsert(boletins, { onConflict: "id" });
    if (error) throw error;
  }

  return true;
}

function agendarSincronizacaoSupabase() {
  clearTimeout(sincronizacaoSupabaseTimer);
  sincronizacaoSupabaseTimer = setTimeout(() => {
    sincronizacaoSupabaseEmAndamento = sincronizacaoSupabaseEmAndamento
      .catch(() => {})
      .then(() => sincronizarDadosSupabase())
      .catch(erro => {
        console.error("Falha ao sincronizar dados:", erro);
        alert("A alteração ficou salva neste navegador, mas não foi sincronizada com o servidor.");
      });
  }, 250);
}

const salvarNotasLocaisLegado = salvarNotasLocais;
salvarNotasLocais = function salvarNotasComSupabase() {
  try { salvarNotasLocaisLegado(); } catch {}
  agendarSincronizacaoSupabase();
};
async function excluirNotaSupabase(id) {
  const cliente = clienteSupabase();
  if (!cliente || !id) return;
  const { error } = await cliente.from("notas").delete().eq("id", String(id));
  if (error) throw error;
}

async function salvarFavoritoSupabase(notaId, favorito) {
  const cliente = clienteSupabase();
  const usuarioId = usuarioAtualId();
  if (!cliente || !usuarioId || !notaId) return;

  if (favorito) {
    const { error } = await cliente.from("favoritos").upsert({
      usuario_id: usuarioId,
      nota_id: String(notaId)
    });
    if (error) throw error;
  } else {
    const { error } = await cliente
      .from("favoritos")
      .delete()
      .eq("usuario_id", usuarioId)
      .eq("nota_id", String(notaId));
    if (error) throw error;
  }
}

async function salvarEstadoCompartilhadoSupabase(chave, payload) {
  const cliente = clienteSupabase();
  const usuarioId = usuarioAtualId();
  if (!cliente || !usuarioId) return;

  const { error } = await cliente.from("estado_compartilhado").upsert({
    chave,
    payload,
    atualizado_por: usuarioId
  });
  if (error) throw error;
}

const registrarAuditoriaLocal = registrarAuditoria;
registrarAuditoria = function registrarAuditoriaRemota(acao, detalhes = {}) {
  try { registrarAuditoriaLocal(acao, detalhes); } catch {}

  if (["CRIOU_NOTA", "EDITOU_NOTA", "EXCLUIU_NOTA"].includes(acao)) return;
  const cliente = clienteSupabase();
  const usuarioId = usuarioAtualId();
  if (!cliente || !usuarioId) return;

  void cliente
    .from("auditoria")
    .insert({ usuario_id: usuarioId, acao, detalhes })
    .then(({ error }) => {
      if (error) console.error("Falha ao registrar auditoria:", error);
    });
};
