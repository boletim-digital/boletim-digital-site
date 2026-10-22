(function inicializarAdministracaoUsuarios() {
  const PERFIS = ["usuario-comum", "editor", "auditor", "administrador"];
  const NOMES_PERFIS = {
    desenvolvedor: "Desenvolvedor",
    administrador: "Administrador",
    auditor: "Auditor",
    editor: "Editor",
    "usuario-comum": "Usuário comum"
  };
  let usuarios = [];

  function elemento(id) {
    return document.getElementById(id);
  }

  function mostrarMensagem(texto = "", erro = false) {
    const caixa = elemento("mensagemUsuarios");
    if (!caixa) return;
    caixa.textContent = texto;
    caixa.classList.toggle("escondido", !texto);
    caixa.classList.toggle("erro", Boolean(erro));
  }

  function formatarData(valor) {
    if (!valor) return "Ainda não acessou";
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? "Ainda não acessou" : data.toLocaleString("pt-BR");
  }

  async function detalheErro(erro) {
    try {
      if (erro?.context && typeof erro.context.json === "function") {
        const corpo = await erro.context.json();
        return corpo?.erro || corpo?.error || erro.message;
      }
    } catch {}
    return erro?.message || "Não foi possível concluir a operação.";
  }

  async function chamarFuncao(acao, dados = {}) {
    const cliente = typeof clienteSupabase === "function" ? clienteSupabase() : window.boletimSupabase;
    if (!cliente) throw new Error("A conexão com o Supabase não está disponível.");

    const { data, error } = await cliente.functions.invoke("admin-usuarios", {
      body: { acao, ...dados }
    });
    if (error) throw new Error(await detalheErro(error));
    if (data?.erro) throw new Error(data.erro);
    return data;
  }

  function criarOpcaoPerfil(valor, perfilAtualDoUsuario) {
    const opcao = document.createElement("option");
    opcao.value = valor;
    opcao.textContent = NOMES_PERFIS[valor] || valor;
    opcao.selected = valor === perfilAtualDoUsuario;
    return opcao;
  }

  function criarItemUsuario(usuario) {
    const item = document.createElement("article");
    const ehProprioUsuario = usuario.id === usuarioAtualId();
    const ehDesenvolvedor = usuario.perfil === "desenvolvedor";
    const bloqueado = ehProprioUsuario || ehDesenvolvedor;
    item.className = `usuario-item${usuario.ativo ? "" : " usuario-inativo"}`;

    const identidade = document.createElement("div");
    identidade.className = "usuario-identidade";
    const nome = document.createElement("strong");
    nome.textContent = usuario.nome || "Nome não informado";
    const email = document.createElement("span");
    email.textContent = usuario.email || "E-mail não informado";
    const ultimoAcesso = document.createElement("small");
    ultimoAcesso.textContent = `Último acesso: ${formatarData(usuario.ultimo_acesso)}`;
    identidade.append(nome, email, ultimoAcesso);

    const seletorPerfil = document.createElement("select");
    seletorPerfil.className = "usuario-perfil";
    seletorPerfil.setAttribute("aria-label", `Perfil de ${usuario.email || usuario.nome || "usuário"}`);
    if (ehDesenvolvedor) seletorPerfil.appendChild(criarOpcaoPerfil("desenvolvedor", usuario.perfil));
    PERFIS.forEach(perfil => seletorPerfil.appendChild(criarOpcaoPerfil(perfil, usuario.perfil)));
    seletorPerfil.disabled = bloqueado;

    const situacao = document.createElement("label");
    situacao.className = "usuario-situacao";
    const ativo = document.createElement("input");
    ativo.type = "checkbox";
    ativo.checked = Boolean(usuario.ativo);
    ativo.disabled = bloqueado;
    const textoSituacao = document.createElement("span");
    textoSituacao.textContent = usuario.ativo ? "Ativo" : "Bloqueado";
    ativo.addEventListener("change", () => {
      textoSituacao.textContent = ativo.checked ? "Ativo" : "Bloqueado";
    });
    situacao.append(ativo, textoSituacao);

    const acoes = document.createElement("div");
    acoes.className = "usuario-acoes";
    const status = document.createElement("span");
    const pendente = !usuario.ultimo_acesso;
    status.className = `usuario-status${usuario.ativo ? (pendente ? " status-pendente" : "") : " status-inativo"}`;
    status.textContent = usuario.ativo ? (pendente ? "Convite pendente" : "Acesso liberado") : "Sem acesso";
    const salvar = document.createElement("button");
    salvar.type = "button";
    salvar.className = "btn-secundario";
    salvar.textContent = bloqueado ? (ehProprioUsuario ? "Sua conta" : "Protegido") : "Salvar";
    salvar.disabled = bloqueado;
    salvar.addEventListener("click", async () => {
      salvar.disabled = true;
      mostrarMensagem("");
      try {
        await chamarFuncao("atualizar", {
          usuario_id: usuario.id,
          perfil: seletorPerfil.value,
          ativo: ativo.checked
        });
        await carregarUsuarios();
        mostrarMensagem("Acesso atualizado com sucesso.");
      } catch (erro) {
        mostrarMensagem(await detalheErro(erro), true);
        salvar.disabled = false;
      }
    });
    acoes.append(status, salvar);

    item.append(identidade, seletorPerfil, situacao, acoes);
    return item;
  }

  function renderizarUsuarios() {
    const lista = elemento("listaUsuarios");
    const resumo = elemento("resumoUsuarios");
    if (!lista || !resumo) return;

    const termo = (elemento("buscaUsuarios")?.value || "").trim().toLocaleLowerCase("pt-BR");
    const filtrados = usuarios.filter(usuario => {
      const texto = `${usuario.nome || ""} ${usuario.email || ""} ${NOMES_PERFIS[usuario.perfil] || ""}`.toLocaleLowerCase("pt-BR");
      return !termo || texto.includes(termo);
    });

    resumo.textContent = `${usuarios.length} usuário(s) cadastrado(s)`;
    lista.replaceChildren();
    if (!filtrados.length) {
      const vazio = document.createElement("div");
      vazio.className = "usuarios-vazio";
      vazio.textContent = termo ? "Nenhum usuário encontrado para essa busca." : "Nenhum usuário cadastrado.";
      lista.appendChild(vazio);
      return;
    }
    filtrados.forEach(usuario => lista.appendChild(criarItemUsuario(usuario)));
  }

  async function carregarUsuarios() {
    const lista = elemento("listaUsuarios");
    const resumo = elemento("resumoUsuarios");
    if (resumo) resumo.textContent = "Carregando...";
    if (lista) lista.innerHTML = '<div class="usuarios-vazio">Carregando usuários...</div>';
    try {
      const resposta = await chamarFuncao("listar");
      usuarios = Array.isArray(resposta?.usuarios) ? resposta.usuarios : [];
      renderizarUsuarios();
    } catch (erro) {
      usuarios = [];
      renderizarUsuarios();
      mostrarMensagem(await detalheErro(erro), true);
    }
  }

  function esconderOutrasPaginas() {
    [
      "controlesNotas",
      "listaNotas",
      "paginacao",
      "paginaFatosHistoricos",
      "paginaEstatistica",
      "paginaAuditoria",
      "paginaEstruturaOrganizacional"
    ].forEach(id => elemento(id)?.classList.add("escondido"));
  }

  async function abrirPaginaUsuarios() {
    if (typeof podeGerenciarUsuarios !== "function" || !podeGerenciarUsuarios()) {
      if (typeof negarAcesso === "function") negarAcesso();
      return;
    }
    try { modoPagina = "usuarios"; } catch {}
    if (typeof ocultarBotaoIncluirNotaTopo === "function") ocultarBotaoIncluirNotaTopo();
    document.querySelectorAll(".menu button, .menu-rodape button").forEach(botao => botao.classList.remove("ativo"));
    elemento("btnUsuarios")?.classList.add("ativo");
    esconderOutrasPaginas();
    elemento("paginaUsuarios")?.classList.remove("escondido");
    const titulo = elemento("tituloPagina");
    if (titulo) titulo.textContent = "Gerenciar usuários";
    mostrarMensagem("");
    await carregarUsuarios();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function convidarUsuario(evento) {
    evento.preventDefault();
    const botao = elemento("btnConvidarUsuario");
    const nome = elemento("conviteUsuarioNome")?.value.trim() || "";
    const email = elemento("conviteUsuarioEmail")?.value.trim().toLocaleLowerCase() || "";
    const perfil = elemento("conviteUsuarioPerfil")?.value || "usuario-comum";
    if (!email) return;

    if (botao) botao.disabled = true;
    mostrarMensagem("");
    try {
      await chamarFuncao("convidar", { nome, email, perfil });
      evento.currentTarget.reset();
      await carregarUsuarios();
      mostrarMensagem(`Convite enviado para ${email}.`);
    } catch (erro) {
      mostrarMensagem(await detalheErro(erro), true);
    } finally {
      if (botao) botao.disabled = false;
    }
  }

  elemento("btnUsuarios")?.addEventListener("click", abrirPaginaUsuarios);
  elemento("btnAtualizarUsuarios")?.addEventListener("click", carregarUsuarios);
  elemento("formConvidarUsuario")?.addEventListener("submit", convidarUsuario);
  elemento("buscaUsuarios")?.addEventListener("input", renderizarUsuarios);

  document.addEventListener("click", evento => {
    const alvo = evento.target.closest("#menuLateral button, #btnFatosHistoricos, #btnEstatistica, #btnAuditoria, #btnEstruturaOrganizacional");
    if (alvo) elemento("paginaUsuarios")?.classList.add("escondido");
  }, true);
})();
