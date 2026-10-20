
(function () {
  function slug(texto){return String(texto||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[º°ª]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-+|-+$/g,"").toLowerCase();}
  function norm(texto){return String(texto||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[º°ª]/g,"").replace(/\s+/g," ").trim().toLowerCase();}
  function esc(s){try{return escapeHtml(s)}catch{return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}}

  function estrutura(){
    if(!window.dados) window.dados={};
    if(!dados.estruturaOrganizacional) dados.estruturaOrganizacional={};
    if(!Array.isArray(dados.estruturaOrganizacional.cbas)){
      dados.estruturaOrganizacional.cbas=[
        {id:"cba-i",nome:"CBA I",ativo:true},
        {id:"cba-ii",nome:"CBA II",ativo:true},
        {id:"cba-iii",nome:"CBA III",ativo:true}
      ];
    }
    if(!Array.isArray(dados.estruturaOrganizacional.obms)) dados.estruturaOrganizacional.obms=[];
    return dados.estruturaOrganizacional;
  }
  function salvar(){try{if(typeof salvarDados==="function")salvarDados();else if(typeof salvarNoLocalStorage==="function")salvarNoLocalStorage();else localStorage.setItem("boletimDigitalDados",JSON.stringify(dados));}catch{}try{if(typeof salvarEstadoCompartilhadoSupabase==="function")void salvarEstadoCompartilhadoSupabase("estrutura_organizacional",estrutura());}catch{}}
  function podeEditar(){try{return ["desenvolvedor","administrador"].includes(String((typeof perfilAtual==="function"?perfilAtual():sessionStorage.getItem("boletimDigitalPerfil"))||""));}catch{return false}}
  function cbaPorId(v){const e=estrutura();const n=norm(v);return e.cbas.find(c=>c.id===v||norm(c.nome)===n)||null;}
  function obmPorId(v){const e=estrutura();const n=norm(v);return e.obms.find(o=>o.id===v||norm(o.nome)===n||(o.aliases||[]).some(a=>norm(a)===n))||null;}

  function preencherCbas(sel,valor){if(!sel)return;const e=estrutura();sel.innerHTML=e.cbas.filter(c=>c.ativo!==false).map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("");if(valor)sel.value=valor;}
  function atualizarCamposBoletim(){const tipo=document.getElementById("notaBoletimTipo")?.value||"SEDEC";document.getElementById("grupoNotaBoletimCba")?.classList.toggle("escondido",tipo!=="CBA");document.getElementById("grupoNotaBoletimObm")?.classList.toggle("escondido",tipo!=="OBM");preencherCbas(document.getElementById("notaBoletimCba"));}
  function textoBoletim(tipo,orgao,numero){const n=String(numero||"").trim();if(tipo==="SEDEC")return `Boletim da SEDEC/CBMERJ${n?" nº "+n:""}`;if(tipo==="CBA")return `Boletim do ${orgao||"CBA"}${n?" nº "+n:""}`;if(tipo==="OBM")return `Boletim do ${orgao||"OBM"}${n?" nº "+n:""}`;return n?`Boletim nº ${n}`:"Boletim";}
  function coletarBoletim(){
    const tipo=document.getElementById("notaBoletimTipo")?.value||"SEDEC";
    const numero=document.getElementById("notaBoletimNumero")?.value?.trim()||"";
    let orgaoId="sedec-cbmerj", orgaoNome="SEDEC/CBMERJ", cbaId="", obmId="";
    if(tipo==="CBA"){cbaId=document.getElementById("notaBoletimCba")?.value||"";const c=cbaPorId(cbaId);orgaoId=c?.id||cbaId;orgaoNome=c?.nome||cbaId;}
    if(tipo==="OBM"){const inp=document.getElementById("notaBoletimObmBusca");obmId=inp?.dataset.obmId||"";let o=obmId?obmPorId(obmId):obmPorId(inp?.value||"");if(o){obmId=o.id;cbaId=o.cbaId;orgaoId=o.id;orgaoNome=o.nome}else{orgaoId=slug(inp?.value||"obm");orgaoNome=inp?.value||"OBM";}}
    return {tipo,orgaoId,orgaoNome,cbaId,obmId,numero,texto:textoBoletim(tipo,orgaoNome,numero)};
  }
  function aplicarBoletimFormulario(){const legado=document.getElementById("notaBoletim");if(!legado)return;const b=coletarBoletim();legado.value=b.texto;Object.assign(legado.dataset,{tipoBoletim:b.tipo,orgaoBoletimId:b.orgaoId,orgaoBoletimNome:b.orgaoNome,cbaBoletimId:b.cbaId,obmBoletimId:b.obmId,numeroBoletim:b.numero});}
  function aplicarBoletimNota(nota){if(!nota)return;const b=coletarBoletim();Object.assign(nota,{boletim:b.texto,boletimTexto:b.texto,boletimTipo:b.tipo,boletimOrgaoId:b.orgaoId,boletimOrgaoNome:b.orgaoNome,boletimCbaId:b.cbaId,boletimObmId:b.obmId,boletimNumero:b.numero});}
  function extrairNumero(t){const m=String(t||"").match(/n[º°.]?\s*(\d+)/i);return m?m[1]:"";}
  function preencherFormularioBoletim(nota){
    const tipo=nota?.boletimTipo||"SEDEC";const tipoEl=document.getElementById("notaBoletimTipo");if(tipoEl)tipoEl.value=tipo;atualizarCamposBoletim();
    const num=document.getElementById("notaBoletimNumero");if(num)num.value=nota?.boletimNumero||extrairNumero(nota?.boletim||"");
    if(tipo==="CBA")preencherCbas(document.getElementById("notaBoletimCba"),nota?.boletimCbaId||nota?.boletimOrgaoId||"");
    if(tipo==="OBM"){const inp=document.getElementById("notaBoletimObmBusca");if(inp){inp.value=nota?.boletimOrgaoNome||"";inp.dataset.obmId=nota?.boletimObmId||nota?.boletimOrgaoId||"";}}
    aplicarBoletimFormulario();
  }

  function sugestoesObm(){const inp=document.getElementById("notaBoletimObmBusca"),box=document.getElementById("sugestoesNotaBoletimObm");if(!inp||!box)return;const q=norm(inp.value);box.innerHTML="";if(!q){box.classList.add("escondido");return}estrutura().obms.filter(o=>o.ativo!==false).filter(o=>norm([o.nome,...(o.aliases||[])].join(" ")).includes(q)).slice(0,8).forEach(o=>{const c=cbaPorId(o.cbaId);const b=document.createElement("button");b.type="button";b.innerHTML=`<strong>${esc(o.nome)}</strong><small>${esc(c?.nome||"")}</small>`;b.onclick=()=>{inp.value=o.nome;inp.dataset.obmId=o.id;box.classList.add("escondido");aplicarBoletimFormulario()};box.appendChild(b)});box.classList.toggle("escondido",!box.children.length);}
  function configurarFormulario(){
    atualizarCamposBoletim();
    ["notaBoletimTipo","notaBoletimCba","notaBoletimNumero"].forEach(id=>{const el=document.getElementById(id);if(!el||el.dataset.v164)return;el.dataset.v164="1";el.addEventListener("input",aplicarBoletimFormulario);el.addEventListener("change",()=>{atualizarCamposBoletim();aplicarBoletimFormulario()})});
    const inp=document.getElementById("notaBoletimObmBusca");if(inp&&!inp.dataset.v164){inp.dataset.v164="1";inp.addEventListener("input",()=>{inp.dataset.obmId="";sugestoesObm();aplicarBoletimFormulario()});inp.addEventListener("blur",()=>setTimeout(()=>document.getElementById("sugestoesNotaBoletimObm")?.classList.add("escondido"),180));}
  }

  function usuarioOrg(){
    const rg=(typeof rgAtual==="function"?rgAtual():sessionStorage.getItem("boletimDigitalRg"))||"";
    const obmLocal=localStorage.getItem("boletimDigitalObmUsuarioAtual")||"";
    const o=obmPorId(obmLocal);
    const c=o?cbaPorId(o.cbaId):null;
    return {rg,obmId:o?.id||"",obmNome:o?.nome||"",cbaId:c?.id||"",cbaNome:c?.nome||""};
  }
  function inferirTipo(txt){const n=norm(txt);if(n.includes("sedec")||n.includes("cbmerj"))return"SEDEC";if(/\bcba\b/.test(n))return"CBA";if(/\bgbm\b|\bdbm\b|\bobm\b/.test(n))return"OBM";return"SEDEC";}
  function notaVisivel(nota){const tipo=nota.boletimTipo||inferirTipo(nota.boletim);if(tipo==="SEDEC")return true;const u=usuarioOrg();if(tipo==="CBA")return Boolean((nota.boletimCbaId&&nota.boletimCbaId===u.cbaId)||(nota.boletimOrgaoNome&&norm(nota.boletimOrgaoNome)===norm(u.cbaNome)));if(tipo==="OBM")return Boolean((nota.boletimObmId&&nota.boletimObmId===u.obmId)||(nota.boletimOrgaoNome&&norm(nota.boletimOrgaoNome)===norm(u.obmNome)));return true;}
  function aplicarVisibilidade(){document.querySelectorAll("#listaNotas article.nota,#listaNotas .nota").forEach(card=>{const id=card.id||card.dataset.idNota;const n=(dados.notas||[]).find(x=>String(x.id)===String(id));if(n)card.style.display=notaVisivel(n)?"":"none";});}

  function renderEstrutura(){
    const e=estrutura();preencherCbas(document.getElementById("novaObmCba"));preencherCbas(document.getElementById("notaBoletimCba"));
    const lc=document.getElementById("listaCbasEstrutura");if(lc){lc.innerHTML="";e.cbas.forEach(c=>{const d=document.createElement("div");d.className="estrutura-item";d.innerHTML=`<div><strong>${esc(c.nome)}</strong><small>${c.ativo===false?"Inativo":"Ativo"}</small></div><div class="estrutura-acoes"><button type="button">${c.ativo===false?"Ativar":"Inativar"}</button></div>`;d.querySelector("button").onclick=()=>{c.ativo=c.ativo===false?true:false;salvar();renderEstrutura()};lc.appendChild(d)})}
    const lo=document.getElementById("listaObmsEstrutura");if(lo){lo.innerHTML="";e.obms.forEach(o=>{const c=cbaPorId(o.cbaId);const d=document.createElement("div");d.className="estrutura-item";d.innerHTML=`<div><strong>${esc(o.nome)}</strong><small>${esc(c?.nome||"Sem CBA")} • ${o.ativo===false?"Inativa":"Ativa"}</small>${(o.aliases||[]).length?`<small>Busca: ${esc(o.aliases.join(", "))}</small>`:""}</div><div class="estrutura-acoes"><button type="button">${o.ativo===false?"Ativar":"Inativar"}</button></div>`;d.querySelector("button").onclick=()=>{o.ativo=o.ativo===false?true:false;salvar();renderEstrutura()};lo.appendChild(d)})}
  }
  function mostrarEstrutura(){if(!podeEditar())return alert("Apenas Administrador e Desenvolvedor podem acessar.");try{modoPagina="estrutura"}catch{};document.querySelectorAll(".menu button,.menu-rodape button").forEach(b=>b.classList.remove("ativo"));document.getElementById("btnEstruturaOrganizacional")?.classList.add("ativo");["controlesNotas","listaNotas","paginacao","paginaFatosHistoricos","paginaEstatistica","paginaAuditoria"].forEach(id=>document.getElementById(id)?.classList.add("escondido"));document.getElementById("paginaEstruturaOrganizacional")?.classList.remove("escondido");const t=document.getElementById("tituloPagina");if(t)t.textContent="Estrutura Organizacional";renderEstrutura();}
  function configurarEstrutura(){
    const btn=document.getElementById("btnEstruturaOrganizacional");if(btn&&!btn.dataset.v164){btn.dataset.v164="1";btn.onclick=mostrarEstrutura}btn?.classList.toggle("escondido",!podeEditar());
    const bc=document.getElementById("btnAdicionarCba");if(bc&&!bc.dataset.v164){bc.dataset.v164="1";bc.onclick=()=>{const inp=document.getElementById("novoCbaNome");const nome=inp.value.trim();if(!nome)return alert("Informe o nome do CBA.");const e=estrutura();const id=slug(nome);if(e.cbas.some(c=>c.id===id||norm(c.nome)===norm(nome)))return alert("Esse CBA já existe.");e.cbas.push({id,nome,ativo:true});inp.value="";salvar();renderEstrutura();};}
    const bo=document.getElementById("btnAdicionarObm");if(bo&&!bo.dataset.v164){bo.dataset.v164="1";bo.onclick=()=>{const nome=document.getElementById("novaObmNome").value.trim(),cbaId=document.getElementById("novaObmCba").value,aliases=document.getElementById("novaObmAliases").value.split(",").map(a=>a.trim()).filter(Boolean);if(!nome)return alert("Informe o nome da OBM.");if(!cbaId)return alert("Escolha o CBA.");const e=estrutura();let id=slug(nome),i=2;while(e.obms.some(o=>o.id===id))id=slug(nome)+"-"+i++;e.obms.push({id,nome,cbaId,aliases,ativo:true});document.getElementById("novaObmNome").value="";document.getElementById("novaObmAliases").value="";salvar();renderEstrutura();};}
  }

  function interceptar(){
    if(typeof salvarNota==="function"&&!salvarNota.__v164){const old=salvarNota;salvarNota=function(...args){aplicarBoletimFormulario();const antes=(dados.notas||[]).length;const r=old.apply(this,args);setTimeout(()=>{const arr=dados.notas||[];const n=arr[arr.length-1];if(n&&arr.length>=antes){aplicarBoletimNota(n);salvar();try{renderizarNotas()}catch{}}},0);return r};salvarNota.__v164=true;}
    if(typeof editarNota==="function"&&!editarNota.__v164){const old=editarNota;editarNota=function(id){const r=old.apply(this,arguments);setTimeout(()=>{const n=(dados.notas||[]).find(x=>String(x.id)===String(id));if(n)preencherFormularioBoletim(n)},80);return r};editarNota.__v164=true;}
    if(typeof renderizarNotas==="function"&&!renderizarNotas.__orgV164){const old=renderizarNotas;renderizarNotas=function(...args){const r=old.apply(this,args);setTimeout(aplicarVisibilidade,0);return r};renderizarNotas.__orgV164=true;}
  }

  window.garantirEstruturaOrganizacionalV164=estrutura;
  window.renderizarEstruturaOrganizacionalV164=renderEstrutura;
  window.notaVisivelParaUsuarioOrganizacionalV164=notaVisivel;
  window.obterUsuarioOrganizacionalV164=usuarioOrg;

  document.addEventListener("DOMContentLoaded",()=>{estrutura();configurarEstrutura();configurarFormulario();interceptar();setTimeout(()=>{configurarEstrutura();configurarFormulario();renderEstrutura();aplicarVisibilidade()},700);});
})();
