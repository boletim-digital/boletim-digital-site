(function inicializarClienteSupabase() {
  const parametrosHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const parametrosBusca = new URLSearchParams(window.location.search);
  const tipoRetorno = parametrosHash.get("type") || parametrosBusca.get("type");
  const possuiCodigoRetorno = Boolean(
    parametrosHash.get("access_token") ||
    parametrosHash.get("refresh_token") ||
    parametrosBusca.get("code") ||
    parametrosBusca.get("token_hash")
  );
  window.boletimRetornoAuthTipo = tipoRetorno || "";
  window.boletimConvitePendente = ["invite", "recovery"].includes(tipoRetorno) || possuiCodigoRetorno;

  const config = window.BOLETIM_CONFIG || {};
  const url = String(config.supabaseUrl || "").trim();
  const publishableKey = String(config.supabasePublishableKey || "").trim();
  const biblioteca = window.supabase;

  window.boletimSupabaseConfigurado = Boolean(
    biblioteca?.createClient &&
    /^https:\/\/.+\.supabase\.co$/i.test(url) &&
    publishableKey.startsWith("sb_publishable_")
  );

  window.boletimSupabase = window.boletimSupabaseConfigurado
    ? biblioteca.createClient(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

  window.boletimSupabaseReady = Promise.resolve(window.boletimSupabase);

  window.boletimAuthInicialPromise = window.boletimSupabase
    ? new Promise(resolve => {
        let concluido = false;
        const finalizar = (evento, sessao) => {
          if (concluido) return;
          concluido = true;
          resolve({ evento, sessao });
        };

        window.boletimSupabase.auth.onAuthStateChange((evento, sessao) => {
          if (evento === "PASSWORD_RECOVERY") {
            window.boletimRetornoAuthTipo = "recovery";
            window.boletimConvitePendente = true;
            window.boletimSessaoRetorno = sessao;
          }

          const retornoProcessado =
            evento === "PASSWORD_RECOVERY" ||
            (evento === "SIGNED_IN" && Boolean(sessao?.user)) ||
            (evento === "INITIAL_SESSION" && (!possuiCodigoRetorno || Boolean(sessao?.user)));

          if (retornoProcessado) {
            finalizar(evento, sessao);
          }
        });

        setTimeout(async () => {
          if (concluido) return;
          try {
            const { data } = await window.boletimSupabase.auth.getSession();
            finalizar("TIMEOUT", data.session || null);
          } catch {
            finalizar("TIMEOUT", null);
          }
        }, 4000);
      })
    : Promise.resolve({ evento: "SEM_CLIENTE", sessao: null });
})();
