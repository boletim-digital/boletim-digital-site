// 00-state.js
let dados = null;
let filtroAtual = { parte: "", secao: "", subsecao: "", label: "Todas as notas" };
let termoBusca = "";
let boletimSelecionado = "";
let dataNotaSelecionadaCalendario = "";
let mesCalendario = null;
let mesCalendarioImpressao = null;
let paginaAtual = 1;
let itensPorPagina = 20;
let modoPagina = "boletim";
let editorTabelaAtivo = "notaTextoEditor";
