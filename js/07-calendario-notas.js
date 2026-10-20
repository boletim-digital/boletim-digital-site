// 07-calendario-notas.js
function prepararCalendario() {
  const datasComNotas = obterDatasComNotas();

  if (!datasComNotas.length) {
    mesCalendario = new Date();
    renderizarCalendario();
    return;
  }

  const ultimaData = datasComNotas
    .map(dataBR => parseDataBR(dataBR))
    .sort((a, b) => b - a)[0];

  mesCalendario = ultimaData;
  renderizarCalendario();
}

function obterDatasComNotas() {
  const datas = new Set();

  (dados.notas || []).forEach(nota => {
    if (nota.data) datas.add(nota.data);
  });

  return [...datas];
}

function obterNotasDaData(dataBR) {
  return (dados.notas || [])
    .filter(nota => nota.data === dataBR)
    .sort(ordenarNotas);
}

function renderizarCalendario() {
  const grade = document.getElementById("gradeCalendario");
  const titulo = document.getElementById("mesAnoCalendario");
  if (!grade || !titulo) return;

  const datasComNotas = new Map(
    obterDatasComNotas().map(dataBR => [chaveData(dataBR), obterNotasDaData(dataBR)])
  );

  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const ano = mesCalendario.getFullYear();
  const mes = mesCalendario.getMonth();

  titulo.textContent = `${nomesMeses[mes]} de ${ano}`;
  grade.innerHTML = "";

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  for (let i = 0; i < primeiroDia.getDay(); i++) {
    const vazio = document.createElement("button");
    vazio.className = "dia-calendario vazio";
    vazio.type = "button";
    vazio.tabIndex = -1;
    grade.appendChild(vazio);
  }

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const dataBR = `${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;
    const notasDoDia = datasComNotas.get(chaveData(dataBR));

    const btn = document.createElement("button");
    btn.className = "dia-calendario";
    btn.type = "button";
    btn.textContent = dia;

    if (notasDoDia && notasDoDia.length) {
      btn.classList.add("com-boletim");
      btn.title = `${notasDoDia.length} nota(s) em ${dataBR}`;
      btn.addEventListener("click", () => {
        dataNotaSelecionadaCalendario = dataBR;
        boletimSelecionado = "";
        filtroAtual = { parte: "", secao: "", subsecao: "", label: `Notas de ${dataBR}` };
        paginaAtual = 1;

        document.getElementById("tituloPagina").textContent = `Notas de ${dataBR}`;
        document.getElementById("painelCalendario").classList.add("escondido");

        document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
        const btnTodas = document.querySelector('.menu button[data-id="todas"]');
        if (btnTodas) btnTodas.classList.add("ativo");

        mostrarBoletim();
        renderizarNotas();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    if (dataNotaSelecionadaCalendario === dataBR) {
      btn.classList.add("selecionado-estatistica");
    }

    grade.appendChild(btn);
  }
}

function prepararCalendarioImpressao() {
  const boletins = (dados.boletins || [dados.boletim]).filter(b => b && b.numero && b.data);

  if (!mesCalendarioImpressao) {
    if (boletins.length) {
      const ultimo = [...boletins].sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data))[0];
      mesCalendarioImpressao = parseDataBR(ultimo.data);
    } else {
      mesCalendarioImpressao = new Date();
    }
  }

  const btn = document.getElementById("btnCalendarioImpressao");
  const painel = document.getElementById("painelCalendarioImpressao");
  const anterior = document.getElementById("mesAnteriorImpressao");
  const proximo = document.getElementById("mesProximoImpressao");

  if (btn && btn.dataset.ok !== "1") {
    btn.dataset.ok = "1";
    btn.addEventListener("click", () => {
      painel.classList.toggle("escondido");
      renderizarCalendarioImpressao();
    });
  }

  if (anterior && anterior.dataset.ok !== "1") {
    anterior.dataset.ok = "1";
    anterior.addEventListener("click", () => {
      mesCalendarioImpressao.setMonth(mesCalendarioImpressao.getMonth() - 1);
      renderizarCalendarioImpressao();
    });
  }

  if (proximo && proximo.dataset.ok !== "1") {
    proximo.dataset.ok = "1";
    proximo.addEventListener("click", () => {
      mesCalendarioImpressao.setMonth(mesCalendarioImpressao.getMonth() + 1);
      renderizarCalendarioImpressao();
    });
  }

  renderizarCalendarioImpressao();
}

function renderizarCalendarioImpressao() {
  const grade = document.getElementById("gradeCalendarioImpressao");
  const titulo = document.getElementById("mesAnoCalendarioImpressao");
  if (!grade || !titulo || !mesCalendarioImpressao) return;

  const boletins = (dados.boletins || [dados.boletim]).filter(b => b && b.numero && b.data);
  const datasComBoletim = new Map(boletins.map(b => [chaveData(b.data), b]));

  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const ano = mesCalendarioImpressao.getFullYear();
  const mes = mesCalendarioImpressao.getMonth();

  titulo.textContent = `${nomesMeses[mes]} de ${ano}`;
  grade.innerHTML = "";

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  for (let i = 0; i < primeiroDia.getDay(); i++) {
    const vazio = document.createElement("button");
    vazio.className = "dia-calendario vazio";
    vazio.tabIndex = -1;
    grade.appendChild(vazio);
  }

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const dataBR = `${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;
    const boletim = datasComBoletim.get(chaveData(dataBR));

    const btn = document.createElement("button");
    btn.className = "dia-calendario";
    btn.textContent = dia;

    if (boletim) {
      btn.classList.add("com-boletim");
      btn.title = `Boletim nº ${boletim.numero} - ${boletim.data}`;
      btn.addEventListener("click", () => {
        document.getElementById("dataImpressao").value = boletim.data;
        document.getElementById("btnCalendarioImpressao").textContent = `Boletim nº ${boletim.numero} - ${boletim.data}`;
        document.getElementById("painelCalendarioImpressao").classList.add("escondido");
      });
    }

    grade.appendChild(btn);
  }
}


/* v113 - fecha Calendário de Boletins ao clicar fora */
function fecharCalendarioBoletinsV113() {
  const candidatos = [
    document.getElementById("painelCalendarioBoletins"),
    document.getElementById("calendarioBoletins"),
    document.getElementById("popupCalendarioBoletins"),
    document.getElementById("painelCalendarioNotas"),
    document.getElementById("calendarioNotas"),
    document.querySelector(".painel-calendario-boletins"),
    document.querySelector(".popup-calendario-boletins"),
    document.querySelector(".calendario-boletins"),
    document.querySelector(".painel-calendario-notas"),
    document.querySelector(".popup-calendario-notas")
  ].filter(Boolean);

  candidatos.forEach(painel => {
    painel.classList.add("escondido");
  });
}

function calendarioBoletinsEstaAbertoV113() {
  const candidatos = [
    document.getElementById("painelCalendarioBoletins"),
    document.getElementById("calendarioBoletins"),
    document.getElementById("popupCalendarioBoletins"),
    document.getElementById("painelCalendarioNotas"),
    document.getElementById("calendarioNotas"),
    document.querySelector(".painel-calendario-boletins"),
    document.querySelector(".popup-calendario-boletins"),
    document.querySelector(".calendario-boletins"),
    document.querySelector(".painel-calendario-notas"),
    document.querySelector(".popup-calendario-notas")
  ].filter(Boolean);

  return candidatos.some(painel => !painel.classList.contains("escondido") && painel.offsetParent !== null);
}

function ehBotaoCalendarioBoletinsV113(alvo) {
  return Boolean(
    alvo.closest("#btnCalendarioBoletins") ||
    alvo.closest("#btnCalendarioNotas") ||
    alvo.closest("[data-acao='calendario-boletins']") ||
    alvo.closest("[data-action='calendario-boletins']") ||
    alvo.closest(".btn-calendario-boletins") ||
    alvo.closest(".btn-calendario-notas") ||
    alvo.closest("button")?.textContent?.toLowerCase().includes("calendário de boletins") ||
    alvo.closest("button")?.textContent?.toLowerCase().includes("calendario de boletins")
  );
}

function ehDentroCalendarioBoletinsV113(alvo) {
  return Boolean(
    alvo.closest("#painelCalendarioBoletins") ||
    alvo.closest("#calendarioBoletins") ||
    alvo.closest("#popupCalendarioBoletins") ||
    alvo.closest("#painelCalendarioNotas") ||
    alvo.closest("#calendarioNotas") ||
    alvo.closest(".painel-calendario-boletins") ||
    alvo.closest(".popup-calendario-boletins") ||
    alvo.closest(".calendario-boletins") ||
    alvo.closest(".painel-calendario-notas") ||
    alvo.closest(".popup-calendario-notas")
  );
}

function configurarFecharCalendarioBoletinsForaV113() {
  if (document.body.dataset.fechaCalendarioBoletinsV113 === "1") return;
  document.body.dataset.fechaCalendarioBoletinsV113 = "1";

  document.addEventListener("click", (event) => {
    const alvo = event.target;

    if (!calendarioBoletinsEstaAbertoV113()) return;
    if (ehBotaoCalendarioBoletinsV113(alvo)) return;
    if (ehDentroCalendarioBoletinsV113(alvo)) return;

    fecharCalendarioBoletinsV113();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      fecharCalendarioBoletinsV113();
    }
  });
}

document.addEventListener("DOMContentLoaded", configurarFecharCalendarioBoletinsForaV113);


/* v132 - Calendário de Boletins com escolha Ano > Mês > Dia */
let modoCalendarioBoletinsV132 = "dias";
let anoSelecionadoCalendarioV132 = null;

function datasComNotasBoletinsV132() {
  const datas = new Set();

  try {
    (dados.notas || []).forEach(nota => {
      if (nota?.data) datas.add(String(nota.data));
      if (nota?.dataNota) datas.add(String(nota.dataNota));
      if (nota?.dataBoletim) datas.add(String(nota.dataBoletim));
    });
  } catch {}

  try {
    (dados.boletins || []).forEach(boletim => {
      if (boletim?.data) datas.add(String(boletim.data));
      if (boletim?.dataBoletim) datas.add(String(boletim.dataBoletim));
    });
  } catch {}

  return Array.from(datas).filter(Boolean);
}

function parseDataCalendarioV132(dataBR) {
  try {
    if (typeof parseDataBR === "function") return parseDataBR(dataBR);
  } catch {}

  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function mapaDatasCalendarioV132() {
  const anos = new Set();
  const mesesPorAno = new Map();
  const diasPorMesAno = new Map();

  datasComNotasBoletinsV132().forEach(dataBR => {
    const data = parseDataCalendarioV132(dataBR);
    if (!data || Number.isNaN(data.getTime())) return;

    const ano = data.getFullYear();
    const mes = data.getMonth();
    const dia = data.getDate();

    anos.add(ano);

    if (!mesesPorAno.has(ano)) mesesPorAno.set(ano, new Set());
    mesesPorAno.get(ano).add(mes);

    const chaveMes = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    if (!diasPorMesAno.has(chaveMes)) diasPorMesAno.set(chaveMes, new Set());
    diasPorMesAno.get(chaveMes).add(dia);
  });

  return { anos, mesesPorAno, diasPorMesAno };
}

function renderizarSeletorAnosCalendarioV132() {
  const grade = document.getElementById("gradeCalendario");
  const titulo = document.getElementById("mesAnoCalendario");
  if (!grade || !titulo) return;

  const { anos } = mapaDatasCalendarioV132();
  const anoAtual = mesCalendario ? mesCalendario.getFullYear() : new Date().getFullYear();
  const anosComDados = Array.from(anos).sort((a, b) => b - a);

  let inicio;
  let fim;

  if (anosComDados.length) {
    inicio = Math.min(...anosComDados, anoAtual) - 1;
    fim = Math.max(...anosComDados, anoAtual) + 1;
  } else {
    inicio = anoAtual - 6;
    fim = anoAtual + 5;
  }

  const anosParaMostrar = [];
  for (let ano = fim; ano >= inicio; ano--) anosParaMostrar.push(ano);

  titulo.textContent = "Escolha o ano";
  titulo.classList.add("titulo-calendario-clicavel-v132");
  grade.innerHTML = "";
  grade.classList.add("grade-calendario-anos-v132");
  grade.classList.remove("grade-calendario-meses-v132");

  anosParaMostrar.forEach(ano => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ano-calendario-v132";
    btn.textContent = String(ano);

    if (ano === anoAtual) btn.classList.add("atual");
    if (anos.has(ano)) {
      btn.classList.add("tem-dados");
      btn.title = "Há boletins/notas neste ano";
    } else {
      btn.classList.add("sem-dados");
      btn.title = "Sem boletins/notas neste ano";
    }

    btn.addEventListener("click", () => {
      anoSelecionadoCalendarioV132 = ano;
      modoCalendarioBoletinsV132 = "meses";
      renderizarSeletorMesesCalendarioV132(ano);
    });

    grade.appendChild(btn);
  });
}

function renderizarSeletorMesesCalendarioV132(ano) {
  const grade = document.getElementById("gradeCalendario");
  const titulo = document.getElementById("mesAnoCalendario");
  if (!grade || !titulo) return;

  const { mesesPorAno } = mapaDatasCalendarioV132();
  const mesesComDados = mesesPorAno.get(ano) || new Set();

  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  titulo.textContent = `Escolha o mês de ${ano}`;
  titulo.classList.add("titulo-calendario-clicavel-v132");

  grade.innerHTML = "";
  grade.classList.remove("grade-calendario-anos-v132");
  grade.classList.add("grade-calendario-meses-v132");

  nomesMeses.forEach((nome, mes) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mes-calendario-v132";
    btn.textContent = nome.substring(0, 3);

    if (mesesComDados.has(mes)) {
      btn.classList.add("tem-dados");
      btn.title = "Há boletins/notas neste mês";
    } else {
      btn.classList.add("sem-dados");
      btn.title = "Sem boletins/notas neste mês";
    }

    btn.addEventListener("click", () => {
      if (!mesCalendario) mesCalendario = new Date();
      mesCalendario = new Date(ano, mes, 1);
      modoCalendarioBoletinsV132 = "dias";

      try {
        if (typeof renderizarCalendario === "function") renderizarCalendario();
      } catch {}

      setTimeout(destacarDiasCalendarioBoletinsV132, 0);
      setTimeout(destacarDiasCalendarioBoletinsV132, 100);
    });

    grade.appendChild(btn);
  });
}

function destacarDiasCalendarioBoletinsV132() {
  const grade = document.getElementById("gradeCalendario");
  if (!grade || !mesCalendario || modoCalendarioBoletinsV132 !== "dias") return;

  const { diasPorMesAno } = mapaDatasCalendarioV132();
  const chave = `${mesCalendario.getFullYear()}-${String(mesCalendario.getMonth() + 1).padStart(2, "0")}`;
  const diasComDados = diasPorMesAno.get(chave) || new Set();

  grade.classList.remove("grade-calendario-anos-v132", "grade-calendario-meses-v132");

  grade.querySelectorAll("button, .dia, .calendario-dia, [data-data], [data-date]").forEach(btn => {
    const texto = (btn.textContent || "").trim();
    if (!/^\d{1,2}$/.test(texto)) return;

    const dia = Number(texto);

    if (diasComDados.has(dia)) {
      btn.classList.add("tem-nota", "tem-boletim", "dia-com-nota", "dia-com-boletim", "calendario-dia-com-dados-v132");
      btn.title = "Há boletins/notas neste dia";
    }
  });
}

function configurarTituloClicavelCalendarioBoletinsV132() {
  const titulo = document.getElementById("mesAnoCalendario");
  if (!titulo || titulo.dataset.v132 === "1") return;

  titulo.dataset.v132 = "1";
  titulo.classList.add("titulo-calendario-clicavel-v132");
  titulo.title = "Clique para escolher ano e mês";

  titulo.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (modoCalendarioBoletinsV132 === "dias") {
      modoCalendarioBoletinsV132 = "anos";
      renderizarSeletorAnosCalendarioV132();
      return;
    }

    if (modoCalendarioBoletinsV132 === "meses") {
      modoCalendarioBoletinsV132 = "anos";
      renderizarSeletorAnosCalendarioV132();
      return;
    }

    modoCalendarioBoletinsV132 = "dias";
    try { renderizarCalendario(); } catch {}
    setTimeout(destacarDiasCalendarioBoletinsV132, 0);
  });
}

function configurarCalendarioBoletinsAvancadoV132() {
  configurarTituloClicavelCalendarioBoletinsV132();

  const btnCalendario = document.getElementById("btnCalendario");
  const painel = document.getElementById("painelCalendario");

  if (btnCalendario && btnCalendario.dataset.v132 !== "1") {
    btnCalendario.dataset.v132 = "1";
    btnCalendario.addEventListener("click", () => {
      setTimeout(() => {
        configurarTituloClicavelCalendarioBoletinsV132();
        modoCalendarioBoletinsV132 = "dias";
        if (painel && !painel.classList.contains("escondido")) {
          try { renderizarCalendario(); } catch {}
          destacarDiasCalendarioBoletinsV132();
        }
      }, 0);

      setTimeout(destacarDiasCalendarioBoletinsV132, 120);
    });
  }

  ["mesAnterior", "mesProximo"].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.v132 === "1") return;

    btn.dataset.v132 = "1";
    btn.addEventListener("click", () => {
      modoCalendarioBoletinsV132 = "dias";
      setTimeout(destacarDiasCalendarioBoletinsV132, 0);
      setTimeout(destacarDiasCalendarioBoletinsV132, 100);
    });
  });
}

if (typeof renderizarCalendario === "function" && !window.renderizarCalendarioOriginalV132) {
  window.renderizarCalendarioOriginalV132 = renderizarCalendario;

  renderizarCalendario = function(...args) {
    const resultado = window.renderizarCalendarioOriginalV132.apply(this, args);

    modoCalendarioBoletinsV132 = "dias";
    configurarTituloClicavelCalendarioBoletinsV132();
    setTimeout(destacarDiasCalendarioBoletinsV132, 0);

    return resultado;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  configurarCalendarioBoletinsAvancadoV132();
  setTimeout(configurarCalendarioBoletinsAvancadoV132, 300);
  setTimeout(() => {
    configurarCalendarioBoletinsAvancadoV132();
    destacarDiasCalendarioBoletinsV132();
  }, 900);
});


/* v133 - refinamento do Calendário de Boletins: Mês/Ano > Meses > Ano > Meses > Dia */
let modoCalendarioBoletinsV133 = "dias";
let anoSelecionadoCalendarioV133 = null;

function datasComNotasBoletinsV133() {
  const datas = new Set();

  try {
    (dados.notas || []).forEach(nota => {
      if (nota?.data) datas.add(String(nota.data));
      if (nota?.dataNota) datas.add(String(nota.dataNota));
      if (nota?.dataBoletim) datas.add(String(nota.dataBoletim));
    });
  } catch {}

  try {
    (dados.boletins || []).forEach(boletim => {
      if (boletim?.data) datas.add(String(boletim.data));
      if (boletim?.dataBoletim) datas.add(String(boletim.dataBoletim));
    });
  } catch {}

  return Array.from(datas).filter(Boolean);
}

function parseDataCalendarioV133(dataBR) {
  try {
    if (typeof parseDataBR === "function") return parseDataBR(dataBR);
  } catch {}

  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function mapaDatasCalendarioV133() {
  const anos = new Set();
  const mesesPorAno = new Map();
  const diasPorMesAno = new Map();

  datasComNotasBoletinsV133().forEach(dataBR => {
    const data = parseDataCalendarioV133(dataBR);
    if (!data || Number.isNaN(data.getTime())) return;

    const ano = data.getFullYear();
    const mes = data.getMonth();
    const dia = data.getDate();

    anos.add(ano);

    if (!mesesPorAno.has(ano)) mesesPorAno.set(ano, new Set());
    mesesPorAno.get(ano).add(mes);

    const chaveMes = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    if (!diasPorMesAno.has(chaveMes)) diasPorMesAno.set(chaveMes, new Set());
    diasPorMesAno.get(chaveMes).add(dia);
  });

  return { anos, mesesPorAno, diasPorMesAno };
}

function renderizarSeletorMesesCalendarioV133(ano) {
  const grade = document.getElementById("gradeCalendario");
  const titulo = document.getElementById("mesAnoCalendario");
  if (!grade || !titulo) return;

  const { mesesPorAno } = mapaDatasCalendarioV133();
  const mesesComDados = mesesPorAno.get(ano) || new Set();

  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  modoCalendarioBoletinsV133 = "meses";
  anoSelecionadoCalendarioV133 = ano;

  titulo.textContent = "Escolher ano";
  titulo.classList.add("titulo-calendario-clicavel-v132", "titulo-calendario-clicavel-v133");
  titulo.title = `Clique para escolher outro ano. Ano atual: ${ano}`;

  grade.innerHTML = "";
  grade.classList.remove("grade-calendario-anos-v132", "grade-calendario-anos-v133");
  grade.classList.add("grade-calendario-meses-v132", "grade-calendario-meses-v133");

  nomesMeses.forEach((nome, mes) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mes-calendario-v132 mes-calendario-v133";
    btn.innerHTML = `<span>${nome.substring(0, 3)}</span><small>${ano}</small>`;

    if (mesesComDados.has(mes)) {
      btn.classList.add("tem-dados");
      btn.title = "Há boletins/notas neste mês";
    } else {
      btn.classList.add("sem-dados");
      btn.title = "Sem boletins/notas neste mês";
    }

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!mesCalendario) mesCalendario = new Date();
      mesCalendario = new Date(ano, mes, 1);
      modoCalendarioBoletinsV133 = "dias";

      try {
        if (typeof renderizarCalendarioOriginalV132 === "function") {
          renderizarCalendarioOriginalV132();
        } else if (typeof window.renderizarCalendarioOriginalV132 === "function") {
          window.renderizarCalendarioOriginalV132();
        } else if (typeof renderizarCalendario === "function") {
          renderizarCalendario();
        }
      } catch {}

      setTimeout(destacarDiasCalendarioBoletinsV133, 0);
      setTimeout(destacarDiasCalendarioBoletinsV133, 100);
    });

    grade.appendChild(btn);
  });
}

function renderizarSeletorAnosCalendarioV133() {
  const grade = document.getElementById("gradeCalendario");
  const titulo = document.getElementById("mesAnoCalendario");
  if (!grade || !titulo) return;

  const { anos } = mapaDatasCalendarioV133();
  const anoAtual = anoSelecionadoCalendarioV133 || (mesCalendario ? mesCalendario.getFullYear() : new Date().getFullYear());
  const anosComDados = Array.from(anos).sort((a, b) => b - a);

  let inicio;
  let fim;

  if (anosComDados.length) {
    inicio = Math.min(...anosComDados, anoAtual) - 1;
    fim = Math.max(...anosComDados, anoAtual) + 1;
  } else {
    inicio = anoAtual - 6;
    fim = anoAtual + 5;
  }

  const anosParaMostrar = [];
  for (let ano = fim; ano >= inicio; ano--) anosParaMostrar.push(ano);

  modoCalendarioBoletinsV133 = "anos";

  titulo.textContent = "Escolha o ano";
  titulo.classList.add("titulo-calendario-clicavel-v132", "titulo-calendario-clicavel-v133");
  titulo.title = "Escolha um ano para ver os meses";

  grade.innerHTML = "";
  grade.classList.add("grade-calendario-anos-v132", "grade-calendario-anos-v133");
  grade.classList.remove("grade-calendario-meses-v132", "grade-calendario-meses-v133");

  anosParaMostrar.forEach(ano => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ano-calendario-v132 ano-calendario-v133";
    btn.textContent = String(ano);

    if (ano === anoAtual) btn.classList.add("atual");
    if (anos.has(ano)) {
      btn.classList.add("tem-dados");
      btn.title = "Há boletins/notas neste ano";
    } else {
      btn.classList.add("sem-dados");
      btn.title = "Sem boletins/notas neste ano";
    }

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      renderizarSeletorMesesCalendarioV133(ano);
    });

    grade.appendChild(btn);
  });
}

function destacarDiasCalendarioBoletinsV133() {
  const grade = document.getElementById("gradeCalendario");
  if (!grade || !mesCalendario) return;

  const { diasPorMesAno } = mapaDatasCalendarioV133();
  const chave = `${mesCalendario.getFullYear()}-${String(mesCalendario.getMonth() + 1).padStart(2, "0")}`;
  const diasComDados = diasPorMesAno.get(chave) || new Set();

  grade.classList.remove("grade-calendario-anos-v132", "grade-calendario-meses-v132", "grade-calendario-anos-v133", "grade-calendario-meses-v133");

  grade.querySelectorAll("button, .dia, .calendario-dia, [data-data], [data-date]").forEach(btn => {
    const texto = (btn.textContent || "").trim();
    if (!/^\d{1,2}$/.test(texto)) return;

    const dia = Number(texto);

    if (diasComDados.has(dia)) {
      btn.classList.add("tem-nota", "tem-boletim", "dia-com-nota", "dia-com-boletim", "calendario-dia-com-dados-v132", "calendario-dia-com-dados-v133");
      btn.title = "Há boletins/notas neste dia";
    }
  });
}

function configurarTituloClicavelCalendarioBoletinsV133() {
  const titulo = document.getElementById("mesAnoCalendario");
  if (!titulo || titulo.dataset.v133 === "1") return;

  titulo.dataset.v133 = "1";
  titulo.classList.add("titulo-calendario-clicavel-v132", "titulo-calendario-clicavel-v133");
  titulo.title = "Clique para escolher mês ou ano";

  titulo.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (modoCalendarioBoletinsV133 === "dias") {
      const ano = mesCalendario ? mesCalendario.getFullYear() : new Date().getFullYear();
      renderizarSeletorMesesCalendarioV133(ano);
      return;
    }

    if (modoCalendarioBoletinsV133 === "meses") {
      renderizarSeletorAnosCalendarioV133();
      return;
    }

    if (modoCalendarioBoletinsV133 === "anos") {
      const ano = anoSelecionadoCalendarioV133 || (mesCalendario ? mesCalendario.getFullYear() : new Date().getFullYear());
      renderizarSeletorMesesCalendarioV133(ano);
    }
  });
}

function configurarSelecaoDiaFechaCalendarioV133() {
  const painel = document.getElementById("painelCalendario");
  if (!painel || painel.dataset.fechaDiaV133 === "1") return;

  painel.dataset.fechaDiaV133 = "1";

  painel.addEventListener("click", (event) => {
    if (modoCalendarioBoletinsV133 !== "dias") return;

    const alvo = event.target.closest("button, .dia, .calendario-dia, [data-data], [data-date]");
    if (!alvo || !painel.contains(alvo)) return;

    const texto = (alvo.textContent || "").trim();
    if (!/^\d{1,2}$/.test(texto)) return;

    // Deixa o handler original selecionar a data primeiro; depois fecha.
    setTimeout(() => {
      painel.classList.add("escondido");
    }, 0);
  }, false);
}

function configurarCalendarioBoletinsAvancadoV133() {
  configurarTituloClicavelCalendarioBoletinsV133();
  configurarSelecaoDiaFechaCalendarioV133();

  const btnCalendario = document.getElementById("btnCalendario");
  const painel = document.getElementById("painelCalendario");

  if (btnCalendario && btnCalendario.dataset.v133 !== "1") {
    btnCalendario.dataset.v133 = "1";
    btnCalendario.addEventListener("click", () => {
      setTimeout(() => {
        configurarTituloClicavelCalendarioBoletinsV133();
        configurarSelecaoDiaFechaCalendarioV133();

        if (painel && !painel.classList.contains("escondido")) {
          modoCalendarioBoletinsV133 = "dias";
          try {
            if (typeof window.renderizarCalendarioOriginalV132 === "function") {
              window.renderizarCalendarioOriginalV132();
            } else if (typeof renderizarCalendario === "function") {
              renderizarCalendario();
            }
          } catch {}
          destacarDiasCalendarioBoletinsV133();
        }
      }, 0);

      setTimeout(destacarDiasCalendarioBoletinsV133, 120);
    });
  }

  ["mesAnterior", "mesProximo"].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.v133 === "1") return;

    btn.dataset.v133 = "1";
    btn.addEventListener("click", () => {
      modoCalendarioBoletinsV133 = "dias";
      setTimeout(destacarDiasCalendarioBoletinsV133, 0);
      setTimeout(destacarDiasCalendarioBoletinsV133, 100);
    });
  });
}

if (typeof renderizarCalendario === "function" && !window.renderizarCalendarioOriginalV133) {
  window.renderizarCalendarioOriginalV133 = renderizarCalendario;

  renderizarCalendario = function(...args) {
    const resultado = window.renderizarCalendarioOriginalV133.apply(this, args);

    if (modoCalendarioBoletinsV133 !== "anos" && modoCalendarioBoletinsV133 !== "meses") {
      modoCalendarioBoletinsV133 = "dias";
    }

    configurarTituloClicavelCalendarioBoletinsV133();
    configurarSelecaoDiaFechaCalendarioV133();
    setTimeout(destacarDiasCalendarioBoletinsV133, 0);

    return resultado;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  configurarCalendarioBoletinsAvancadoV133();
  setTimeout(configurarCalendarioBoletinsAvancadoV133, 300);
  setTimeout(() => {
    configurarCalendarioBoletinsAvancadoV133();
    destacarDiasCalendarioBoletinsV133();
  }, 900);
});


/* v134 - limita anos ao último ano com dados e ajusta texto dos botões */
function renderizarSeletorAnosCalendarioV134() {
  const grade = document.getElementById("gradeCalendario");
  const titulo = document.getElementById("mesAnoCalendario");
  if (!grade || !titulo) return;

  const { anos } = mapaDatasCalendarioV133();
  const anoAtual = anoSelecionadoCalendarioV133 || (mesCalendario ? mesCalendario.getFullYear() : new Date().getFullYear());
  const anosComDados = Array.from(anos).sort((a, b) => b - a);

  let inicio;
  let fim;

  if (anosComDados.length) {
    inicio = Math.min(...anosComDados, anoAtual);
    // Não mostra ano posterior ao último ano que tem dados.
    fim = Math.max(...anosComDados);
  } else {
    inicio = anoAtual - 6;
    fim = anoAtual;
  }

  const anosParaMostrar = [];
  for (let ano = fim; ano >= inicio; ano--) anosParaMostrar.push(ano);

  modoCalendarioBoletinsV133 = "anos";

  titulo.textContent = "Escolha o ano";
  titulo.classList.add("titulo-calendario-clicavel-v132", "titulo-calendario-clicavel-v133");
  titulo.title = "Escolha um ano para ver os meses";

  grade.innerHTML = "";
  grade.classList.add("grade-calendario-anos-v132", "grade-calendario-anos-v133", "grade-calendario-anos-v134");
  grade.classList.remove("grade-calendario-meses-v132", "grade-calendario-meses-v133");

  anosParaMostrar.forEach(ano => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ano-calendario-v132 ano-calendario-v133 ano-calendario-v134";
    btn.textContent = String(ano);

    if (ano === anoAtual) btn.classList.add("atual");
    if (anos.has(ano)) {
      btn.classList.add("tem-dados");
      btn.title = "Há boletins/notas neste ano";
    } else {
      btn.classList.add("sem-dados");
      btn.title = "Sem boletins/notas neste ano";
    }

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      renderizarSeletorMesesCalendarioV133(ano);
    });

    grade.appendChild(btn);
  });
}

// Substitui a função de anos usada pelo fluxo v133.
renderizarSeletorAnosCalendarioV133 = renderizarSeletorAnosCalendarioV134;


/* v135 - corrige grade de dias após usar seletor de ano/mês */
function limparClassesSeletorAnoMesCalendarioV135() {
  const grade = document.getElementById("gradeCalendario");
  if (!grade) return;

  grade.classList.remove(
    "grade-calendario-anos-v132",
    "grade-calendario-meses-v132",
    "grade-calendario-anos-v133",
    "grade-calendario-meses-v133",
    "grade-calendario-anos-v134"
  );

  grade.classList.add("grade-calendario-dias-v135");
}

function calendarioEstaEmModoDiasV135() {
  const grade = document.getElementById("gradeCalendario");
  if (!grade) return false;

  const botoes = Array.from(grade.querySelectorAll("button"));
  if (!botoes.length) return false;

  return botoes.some(btn => {
    const texto = (btn.textContent || "").trim();
    return /^\d{1,2}$/.test(texto);
  });
}

function corrigirGradeDiasCalendarioV135() {
  const grade = document.getElementById("gradeCalendario");
  if (!grade) return;

  if (!calendarioEstaEmModoDiasV135()) return;

  limparClassesSeletorAnoMesCalendarioV135();

  // Garante que os botões dos dias voltem a se comportar como dias comuns.
  grade.querySelectorAll("button").forEach(btn => {
    const texto = (btn.textContent || "").trim();

    if (/^\d{1,2}$/.test(texto)) {
      btn.classList.remove("ano-calendario-v132", "ano-calendario-v133", "ano-calendario-v134", "mes-calendario-v132", "mes-calendario-v133");
      btn.classList.add("dia-calendario-v135");
    }
  });
}

if (typeof renderizarCalendario === "function" && !window.renderizarCalendarioOriginalV135) {
  window.renderizarCalendarioOriginalV135 = renderizarCalendario;

  renderizarCalendario = function(...args) {
    const resultado = window.renderizarCalendarioOriginalV135.apply(this, args);

    setTimeout(() => {
      corrigirGradeDiasCalendarioV135();
      try { destacarDiasCalendarioBoletinsV133(); } catch {}
      try { destacarDiasCalendarioBoletinsV132(); } catch {}
    }, 0);

    return resultado;
  };
}

// Reforça quando o mês é escolhido no seletor de meses.
function configurarCorrecaoGradeDiasCalendarioV135() {
  const grade = document.getElementById("gradeCalendario");
  if (!grade || grade.dataset.v135 === "1") return;

  grade.dataset.v135 = "1";

  grade.addEventListener("click", () => {
    setTimeout(() => {
      corrigirGradeDiasCalendarioV135();
      try { destacarDiasCalendarioBoletinsV133(); } catch {}
      try { destacarDiasCalendarioBoletinsV132(); } catch {}
    }, 0);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  configurarCorrecaoGradeDiasCalendarioV135();
  setTimeout(configurarCorrecaoGradeDiasCalendarioV135, 300);
  setTimeout(() => {
    configurarCorrecaoGradeDiasCalendarioV135();
    corrigirGradeDiasCalendarioV135();
  }, 900);
});
