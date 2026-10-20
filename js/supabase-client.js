(function inicializarClienteSupabase() {
  const parametrosRetorno = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const tipoRetorno = parametrosRetorno.get("type");
  window.boletimConvitePendente = ["invite", "recovery"].includes(tipoRetorno);

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
})();
