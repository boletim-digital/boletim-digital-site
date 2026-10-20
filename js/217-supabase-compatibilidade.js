// Integra as funções adicionadas nas versões finais do portal com o Supabase.
(function configurarCompatibilidadeSupabaseV217() {
  if (typeof excluirNota === "function" && !window.excluirNotaOriginalSupabaseV217) {
    window.excluirNotaOriginalSupabaseV217 = excluirNota;

    excluirNota = function(id) {
      const listaAntes = Array.isArray(dados?.notas) ? dados.notas : [];
      const idsAntes = new Set(listaAntes.map(nota => String(nota?.id)));
      const resultado = window.excluirNotaOriginalSupabaseV217.apply(this, arguments);
      const aindaExiste = (Array.isArray(dados?.notas) ? dados.notas : [])
        .some(nota => String(nota?.id) === String(id));

      if (idsAntes.has(String(id)) && !aindaExiste && typeof excluirNotaSupabase === "function") {
        void excluirNotaSupabase(id).catch(erro => {
          console.error("Falha ao excluir a nota no servidor:", erro);
        });
      }

      return resultado;
    };

    window.excluirNota = excluirNota;
  }

  if (typeof definirFavoritaV194 === "function" && !window.definirFavoritaOriginalSupabaseV217) {
    window.definirFavoritaOriginalSupabaseV217 = definirFavoritaV194;

    definirFavoritaV194 = function(id, favorita) {
      const resultado = window.definirFavoritaOriginalSupabaseV217.apply(this, arguments);
      if (typeof salvarFavoritoSupabase === "function") {
        void salvarFavoritoSupabase(id, Boolean(favorita)).catch(erro => {
          console.error("Falha ao atualizar o favorito no servidor:", erro);
        });
      }
      return resultado;
    };

    window.definirFavoritaV194 = definirFavoritaV194;
  }
})();
