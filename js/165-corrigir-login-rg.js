
// v165 - garante que o campo de e-mail apareça na tela de login.
function corrigirCampoLoginRgV165() {
  const senha = document.getElementById("loginSenha");
  let rg = document.getElementById("loginRg");

  if (!senha) return;

  if (!rg) {
    const label = document.createElement("label");
    label.className = "campo-login-email campo-login-rg-v165";
    label.innerHTML = `
      E-mail institucional
      <input id="loginRg" type="email" autocomplete="username" placeholder="nome@dominio.mil.br">
    `;

    const labelSenha = senha.closest("label") || senha.parentElement;
    if (labelSenha?.parentElement) {
      labelSenha.parentElement.insertBefore(label, labelSenha);
    }
    rg = document.getElementById("loginRg");
  }

  if (rg) {
    rg.type = "email";
    rg.classList.remove("escondido");
    rg.style.display = "";
    rg.style.visibility = "";
    rg.style.opacity = "";
    rg.setAttribute("autocomplete", "username");

    const label = rg.closest("label");
    if (label) {
      label.classList.add("campo-login-email", "campo-login-rg-v165");
      label.classList.remove("escondido");
      label.style.display = "";
      label.style.visibility = "";
      label.style.opacity = "";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  corrigirCampoLoginRgV165();
  setTimeout(corrigirCampoLoginRgV165, 300);
  setTimeout(corrigirCampoLoginRgV165, 1000);
});
