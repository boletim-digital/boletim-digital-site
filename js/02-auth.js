// Autenticação real via Supabase Auth.

let inicializacaoAutenticacaoPromise = null;

function clienteSupabase() {
  return window.boletimSupabase || null;
}

function perfilAtual() {
  return sessionStorage.getItem("boletimDigitalPerfil") || "";
}

function rgAtual() {
  return sessionStorage.getItem("boletimDigitalRg") || "";
}

function usuarioAtualId() {
  return sessionStorage.getItem("boletimDigitalUsuarioId") || "";
}

function podeIncluirNota() {
  return ["desenvolvedor", "administrador", "editor"].includes(perfilAtual());
}

function podeVerAuditoria() {
  return ["desenvolvedor", "administrador", "auditor"].includes(perfilAtual());
}

function podeExportarNotas() {
  return ["desenvolvedor", "administrador"].includes(perfilAtual());
}

function podeImportarNotas() {
  return ["desenvolvedor", "administrador"].includes(perfilAtual());
}

function podeVerAdministracao() {
  return podeVerAuditoria() || podeExportarNotas() || podeImportarNotas();
}

function podeGerenciarUsuarios() {
  return ["desenvolvedor", "administrador"].includes(perfilAtual());
}

function podeEditarOuExcluirNota() {
  return ["desenvolvedor", "administrador", "editor"].includes(perfilAtual());
}

function possuiAcessoIrrestrito() {
  return perfilAtual() === "desenvolvedor";
}

function nomePerfil(perfil) {
  const nomes = {
    desenvolvedor: "Desenvolvedor",
    administrador: "Administrador",
    auditor: "Auditor",
    editor: "Editor",
    "usuario-comum": "Usuário comum"
  };
  return nomes[perfil] || perfil || "Usuário";
}

function aplicarPermissoes() {
  const perfil = perfilAtual();

  document.body.classList.remove(
    "perfil-desenvolvedor",
    "perfil-administrador",
    "perfil-auditor",
    "perfil-editor",
    "perfil-usuario-comum",
    "permite-incluir-nota",
    "permite-auditoria",
    "permite-exportar-notas",
    "permite-importar-notas",
    "permite-gerenciar-usuarios",
    "permite-administracao",
    "admin"
  );

  if (perfil) document.body.classList.add(`perfil-${perfil}`);
  if (podeIncluirNota()) document.body.classList.add("permite-incluir-nota");
  if (podeVerAuditoria()) document.body.classList.add("permite-auditoria");
  if (podeExportarNotas()) document.body.classList.add("permite-exportar-notas");
  if (podeImportarNotas()) document.body.classList.add("permite-importar-notas");
  if (podeGerenciarUsuarios()) document.body.classList.add("permite-gerenciar-usuarios");
  if (podeVerAdministracao()) document.body.classList.add("permite-administracao");
  if (podeEditarOuExcluirNota()) document.body.classList.add("admin");

  const el = document.getElementById("perfilUsuario");
  if (el) {
    const rg = rgAtual();
    el.textContent = rg ? `${nomePerfil(perfil)} • RG ${rg}` : nomePerfil(perfil);
  }
}

function negarAcesso(mensagem = "Você não tem permissão para executar esta ação.") {
  alert(mensagem);
}

function mostrarMensagemLogin(mensagem = "", visivel = true) {
  const erro = document.getElementById("erroLogin");
  if (!erro) return;
  erro.textContent = mensagem || "Não foi possível realizar o login.";
  erro.classList.toggle("escondido", !visivel);
}

function mostrarLogin() {
  document.getElementById("telaLogin")?.classList.remove("escondido");
  document.getElementById("telaDefinirSenha")?.classList.add("escondido");
  document.getElementById("app")?.classList.add("escondido");
}

function mostrarApp() {
  document.getElementById("telaLogin")?.classList.add("escondido");
  document.getElementById("telaDefinirSenha")?.classList.add("escondido");
  document.getElementById("app")?.classList.remove("escondido");
  aplicarPermissoes();
}

function mostrarDefinicaoSenha() {
  document.getElementById("telaLogin")?.classList.add("escondido");
  document.getElementById("telaDefinirSenha")?.classList.remove("escondido");
  document.getElementById("app")?.classList.add("escondido");
  document.getElementById("novaSenha")?.focus();
}

function mostrarMensagemDefinicaoSenha(mensagem = "", visivel = true) {
  const erro = document.getElementById("erroDefinirSenha");
  if (!erro) return;
  erro.textContent = mensagem || "Não foi possível salvar a senha.";
  erro.classList.toggle("escondido", !visivel);
}

function limparSessaoLocal() {
  [
    "boletimDigitalLogado",
    "boletimDigitalPerfil",
    "boletimDigitalRg",
    "boletimDigitalUsuarioId",
    "boletimDigitalEmail",
    "boletimDigitalCategoriaMilitar",
    "boletimDigitalPostoGraduacao",
    "boletimDigitalNome"
  ].forEach(chave => sessionStorage.removeItem(chave));
}

function armazenarPerfilAutenticado(usuario, perfil) {
  sessionStorage.setItem("boletimDigitalLogado", "true");
  sessionStorage.setItem("boletimDigitalUsuarioId", usuario.id);
  sessionStorage.setItem("boletimDigitalEmail", usuario.email || "");
  sessionStorage.setItem("boletimDigitalPerfil", perfil.perfil || "usuario-comum");
  sessionStorage.setItem("boletimDigitalRg", perfil.rg || "");
  sessionStorage.setItem("boletimDigitalCategoriaMilitar", perfil.categoria_militar || "");
  sessionStorage.setItem("boletimDigitalPostoGraduacao", perfil.posto_graduacao || "");
  sessionStorage.setItem("boletimDigitalNome", perfil.nome || "");
}

async function carregarPerfilAutenticado(usuario) {
  const cliente = clienteSupabase();
  if (!cliente || !usuario?.id) throw new Error("Sessão inválida.");

  const { data: perfil, error } = await cliente
    .from("perfis")
    .select("id,email,rg,nome,perfil,categoria_militar,posto_graduacao,obm_id,ativo")
    .eq("id", usuario.id)
    .single();

  if (error) throw error;
  if (!perfil?.ativo) throw new Error("Usuário desativado.");

  armazenarPerfilAutenticado(usuario, perfil);
  return perfil;
}

async function fazerLogin(event) {
  event?.preventDefault?.();

  const cliente = clienteSupabase();
  if (!cliente) {
    mostrarMensagemLogin("Supabase ainda não foi configurado neste ambiente.");
    mostrarLogin();
    return false;
  }

  const email = document.getElementById("loginRg")?.value.trim() || "";
  const password = document.getElementById("loginSenha")?.value || "";
  const botao = document.querySelector("#formLogin button[type='submit']");

  mostrarMensagemLogin("", false);
  if (botao) botao.disabled = true;

  try {
    const { data, error } = await cliente.auth.signInWithPassword({ email, password });
    if (error) throw error;

    await carregarPerfilAutenticado(data.user);
    mostrarApp();

    if (typeof carregarDadosSupabase === "function") await carregarDadosSupabase();
    if (typeof registrarAuditoria === "function") {
      registrarAuditoria("LOGIN_SUCESSO", { usuario: usuarioAtualId(), perfil: perfilAtual() });
    }

    try { montarMenu(); } catch {}
    try { renderizarNotas(); } catch {}
    return true;
  } catch (erro) {
    try { await cliente.auth.signOut(); } catch {}
    limparSessaoLocal();
    mostrarMensagemLogin("E-mail ou senha inválidos, ou usuário sem perfil ativo.");
    console.error("Falha no login:", erro);
    return false;
  } finally {
    if (botao) botao.disabled = false;
  }
}

async function definirSenhaDoConvite(event) {
  event?.preventDefault?.();

  const cliente = clienteSupabase();
  const senha = document.getElementById("novaSenha")?.value || "";
  const confirmacao = document.getElementById("confirmarNovaSenha")?.value || "";
  const botao = document.querySelector("#formDefinirSenha button[type='submit']");

  mostrarMensagemDefinicaoSenha("", false);

  if (senha.length < 8) {
    mostrarMensagemDefinicaoSenha("A senha deve ter pelo menos 8 caracteres.");
    return false;
  }

  if (senha !== confirmacao) {
    mostrarMensagemDefinicaoSenha("As senhas digitadas não coincidem.");
    return false;
  }

  if (!cliente) {
    mostrarMensagemDefinicaoSenha("Supabase ainda não foi configurado neste ambiente.");
    return false;
  }

  if (botao) botao.disabled = true;

  try {
    const { data, error } = await cliente.auth.updateUser({ password: senha });
    if (error) throw error;
    if (!data.user) throw new Error("O usuário do convite não foi encontrado.");

    window.boletimConvitePendente = false;
    history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    await carregarPerfilAutenticado(data.user);
    mostrarApp();

    if (typeof carregarDadosSupabase === "function") await carregarDadosSupabase();
    try { montarMenu(); } catch {}
    try { renderizarNotas(); } catch {}
    return true;
  } catch (erro) {
    mostrarMensagemDefinicaoSenha("Não foi possível salvar a senha. Solicite um novo link e tente novamente.");
    console.error("Falha ao concluir o convite:", erro);
    return false;
  } finally {
    if (botao) botao.disabled = false;
  }
}

function aplicarPerfilUsuario() {
  aplicarPermissoes();
}

function usuarioEhAdmin() {
  return podeEditarOuExcluirNota();
}

async function sair() {
  const cliente = clienteSupabase();

  try {
    if (typeof registrarAuditoria === "function") {
      registrarAuditoria("LOGOUT", { usuario: usuarioAtualId(), perfil: perfilAtual() });
    }
    if (cliente) await cliente.auth.signOut();
  } catch (erro) {
    console.error("Falha ao encerrar a sessão remota:", erro);
  } finally {
    limparSessaoLocal();
    aplicarPermissoes();
    mostrarLogin();
  }
}

async function inicializarAutenticacaoSupabase() {
  if (inicializacaoAutenticacaoPromise) return inicializacaoAutenticacaoPromise;

  inicializacaoAutenticacaoPromise = (async () => {
    await (window.boletimSupabaseReady || Promise.resolve(null));
    const cliente = clienteSupabase();

    if (!cliente) {
      limparSessaoLocal();
      mostrarLogin();
      mostrarMensagemLogin("Ambiente de homologação ainda não conectado ao Supabase.");
      return null;
    }

    const { data, error } = await cliente.auth.getSession();
    if (error) throw error;

    const sessao = data.session;
    if (!sessao?.user) {
      limparSessaoLocal();
      mostrarLogin();
      return null;
    }

    if (window.boletimConvitePendente) {
      limparSessaoLocal();
      mostrarDefinicaoSenha();
      return sessao;
    }

    try {
      await carregarPerfilAutenticado(sessao.user);
      mostrarApp();
      return sessao;
    } catch (erroPerfil) {
      await cliente.auth.signOut();
      limparSessaoLocal();
      mostrarLogin();
      mostrarMensagemLogin("Seu usuário não possui um perfil ativo no sistema.");
      console.error("Falha ao carregar perfil:", erroPerfil);
      return null;
    }
  })().catch(erro => {
    inicializacaoAutenticacaoPromise = null;
    limparSessaoLocal();
    mostrarLogin();
    mostrarMensagemLogin("Não foi possível validar a sessão.");
    console.error("Falha ao inicializar autenticação:", erro);
    return null;
  });

  return inicializacaoAutenticacaoPromise;
}

function configurarLoginRobusto() {
  const formLogin = document.getElementById("formLogin");
  const formDefinirSenha = document.getElementById("formDefinirSenha");
  const btnSair = document.getElementById("btnSair");

  if (formLogin && formLogin.dataset.authSupabase !== "1") {
    formLogin.dataset.authSupabase = "1";
    formLogin.addEventListener("submit", event => void fazerLogin(event));
  }

  if (formDefinirSenha && formDefinirSenha.dataset.authSupabase !== "1") {
    formDefinirSenha.dataset.authSupabase = "1";
    formDefinirSenha.addEventListener("submit", event => void definirSenhaDoConvite(event));
  }

  if (btnSair && btnSair.dataset.authSupabase !== "1") {
    btnSair.dataset.authSupabase = "1";
    btnSair.addEventListener("click", () => void sair());
  }

  void inicializarAutenticacaoSupabase();
}

document.addEventListener("DOMContentLoaded", configurarLoginRobusto);
