import{initializeApp as oe}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";import{getAuth as ae,createUserWithEmailAndPassword as ne,updateProfile as re,signInWithEmailAndPassword as se,signOut as N,onAuthStateChanged as ie}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";import{writeBatch as z,collection as L,doc as f,getFirestore as de,getDoc as j,query as ce,orderBy as le,onSnapshot as ue,updateDoc as me,deleteDoc as pe,setDoc as q}from"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function o(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(n){if(n.ep)return;n.ep=!0;const r=o(n);fetch(n.href,r)}})();let v=[];function ge(t){const e=t.toUpperCase();return e.includes("PIX")?"Pix":e.includes("CARTAO")||e.includes("CREDITO")||e.includes("COMPRA")?"Cartão de Crédito":e.includes("DEBITO")||e.includes("TET")||e.includes("TAR")?"Cartão de Débito":e.includes("BOLETO")||e.includes("PAG")?"Boleto":"Outros"}function fe(t){const e=[],o=/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;let a;for(;(a=o.exec(t))!==null;){const n=a[1],r=n.match(/<TRNAMT>([\d.-]+)/i),c=n.match(/<DTPOSTED>(\d{8})/i),m=n.match(/<(?:MEMO|NAME)>([^<\r\n]+)/i);if(r&&c){const l=parseFloat(r[1]),i=c[1],d=`${i.substring(0,4)}-${i.substring(4,6)}-${i.substring(6,8)}`,s=m?m[1].trim():"Transação Importada",y=ge(s);e.push({descricao:s,valor:Math.abs(l),tipo:l<0?"saida":"entrada",categoria:"Geral",metodoPagamento:y,status:"Pago",parcelas:"1/1",data:d,selected:!0})}}return e}function ye(t,e,o){const a=document.getElementById("ofx-file-input"),n=document.getElementById("import-preview"),r=document.getElementById("preview-list"),c=document.getElementById("btn-confirm-import");a&&(a.addEventListener("change",async m=>{const l=m.target.files[0];if(l)try{const i=await l.text();if(v=fe(i),v.length===0){alert("Nenhuma transação válida foi encontrada neste arquivo OFX.");return}be(v,r),n.style.display="block"}catch(i){console.error("Erro ao ler arquivo OFX:",i),alert("Erro ao ler o arquivo. Verifique se é um arquivo .OFX válido.")}}),c.addEventListener("click",async()=>{const m=e();if(!m)return;const l=v.filter(i=>i.selected);if(l.length===0){alert("Selecione ao menos uma transação para importar.");return}try{const i=z(t),d=L(t,"users",m.uid,"transacoes");l.forEach(s=>{const y=f(d);i.set(y,{descricao:s.descricao,valor:s.valor,tipo:s.tipo,categoria:s.categoria,metodoPagamento:s.metodoPagamento,status:s.status,parcelas:s.parcelas,data:s.data})}),await i.commit(),alert(`${l.length} transações importadas com sucesso!`),n.style.display="none",a.value="",v=[]}catch(i){console.error("Erro ao salvar no Firestore:",i),alert("Erro ao salvar as transações no banco de dados.")}}))}function be(t,e){e.innerHTML=t.map((o,a)=>`
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="chk-${a}" ${o.selected?"checked":""} />
                <label for="chk-${a}" style="color: #fff; cursor: pointer;">
                    <strong>${o.data.split("-").reverse().join("/")}</strong> - ${o.descricao} <span style="color: #a78bfa;">(${o.metodoPagamento})</span>
                </label>
            </div>
            <span class="${o.tipo}" style="font-weight: 600;">
                ${o.tipo==="saida"?"-":"+"} R$ ${o.valor.toFixed(2)}
            </span>
        </div>
    `).join(""),t.forEach((o,a)=>{document.getElementById(`chk-${a}`).addEventListener("change",n=>{t[a].selected=n.target.checked})})}const he={apiKey:void 0,authDomain:void 0,projectId:void 0,storageBucket:void 0,messagingSenderId:void 0,appId:void 0,measurementId:void 0},ve=void 0,Ee=void 0,V=oe(he),B=ae(V),p=de(V);let u=null,I=!1,S=null,x=[];const w=document.getElementById("auth-container"),$=document.getElementById("verify-container"),T=document.getElementById("app-container"),k=document.getElementById("auth-form"),D=document.getElementById("auth-title"),C=document.getElementById("auth-btn"),M=document.getElementById("auth-switch-text"),P=document.getElementById("auth-switch-btn"),O=document.getElementById("group-nome"),F=document.getElementById("group-confirm-password"),xe=document.getElementById("btn-verify-otp"),Be=document.getElementById("btn-resend-otp"),Ie=document.getElementById("btn-cancel-verify"),we=document.getElementById("user-email"),$e=document.getElementById("btn-logout"),A=document.getElementById("finance-form"),_=document.getElementById("tabela-corpo"),g=document.getElementById("filtro-mes"),Te=document.getElementById("btn-gerar-relatorio"),G=document.getElementById("painel-relatorio"),Pe=document.getElementById("conteudo-relatorio"),Se=document.getElementById("btn-fechar-relatorio"),Le=document.getElementById("btn-exportar-pdf"),E=document.querySelectorAll(".otp-input");if(g&&!g.value){const t=new Date,e=t.getFullYear(),o=String(t.getMonth()+1).padStart(2,"0");g.value=`${e}-${o}`}g.addEventListener("change",()=>{u&&J(u.uid)});E.forEach((t,e)=>{t.addEventListener("input",o=>{o.target.value.length===1&&e<E.length-1&&E[e+1].focus()}),t.addEventListener("keydown",o=>{o.key==="Backspace"&&!o.target.value&&e>0&&E[e-1].focus()})});P.addEventListener("click",t=>{t.preventDefault(),I=!I,I?(D.innerText="Criar uma Conta",C.innerText="Cadastrar",M.innerText="Já tem uma conta?",P.innerText="Entrar",O.style.display="block",F.style.display="block",document.getElementById("auth-nome").required=!0,document.getElementById("auth-confirm-password").required=!0):(D.innerText="Entrar na sua Conta",C.innerText="Entrar",M.innerText="Não tem uma conta?",P.innerText="Cadastrar-se",O.style.display="none",F.style.display="none",document.getElementById("auth-nome").required=!1,document.getElementById("auth-confirm-password").required=!1)});async function U(t){const e=Math.floor(1e5+Math.random()*9e5).toString();await q(f(p,"users",t.uid),{email:t.email,otpCode:e,isVerified:!1},{merge:!0}),await emailjs.send(ve,Ee,{to_email:t.email,to_name:t.displayName||t.email,otp_code:e})}k.addEventListener("submit",async t=>{t.preventDefault();const e=document.getElementById("auth-email").value,o=document.getElementById("auth-password").value;try{if(I){const a=document.getElementById("auth-nome").value,n=document.getElementById("auth-confirm-password").value;if(o!==n){alert("As senhas não coincidem!");return}const r=await ne(B,e,o);await re(r.user,{displayName:a}),await U(r.user),alert("Código de 6 dígitos enviado para o seu e-mail!")}else await se(B,e,o);k.reset()}catch(a){console.error("Erro completo:",a),alert("Erro: "+(a.text||a.message||JSON.stringify(a)))}});Be.addEventListener("click",async()=>{if(u)try{await U(u),alert("Novo código enviado com sucesso para seu e-mail!")}catch(t){alert("Erro ao reenviar: "+(t.text||t.message||JSON.stringify(t)))}});xe.addEventListener("click",async()=>{if(!u)return;let t="";if(E.forEach(a=>t+=a.value),t.length!==6){alert("Por favor, digite os 6 dígitos do código.");return}const e=f(p,"users",u.uid),o=await j(e);o.exists()&&o.data().otpCode===t?(await q(e,{isVerified:!0},{merge:!0}),alert("E-mail confirmado com sucesso!"),location.reload()):alert("Código incorreto. Verifique e tente novamente.")});Ie.addEventListener("click",()=>N(B));$e.addEventListener("click",()=>N(B));ie(B,async t=>{if(t){u=t;const e=f(p,"users",t.uid),o=await j(e);if(o.exists()&&o.data().isVerified===!0){const n=t.displayName?`Olá, ${t.displayName}`:t.email;we.innerText=n,w.style.display="none",$.style.display="none",T.style.display="block",J(t.uid),ye(p,()=>u)}else w.style.display="none",T.style.display="none",$.style.display="block"}else u=null,S&&S(),T.style.display="none",$.style.display="none",w.style.display="block"});function J(t){const e=ce(L(p,"users",t,"transacoes"),le("data","desc"));S=ue(e,o=>{const a=g.value;x=[],_.innerHTML="",o.forEach(n=>{const r=n.data();(!a||r.data.startsWith(a))&&(x.push({id:n.id,...r}),Re(n.id,r))}),ke(x)})}A.addEventListener("submit",async t=>{if(t.preventDefault(),!u)return;const e=document.getElementById("descricao").value,o=parseFloat(document.getElementById("valor").value),a=document.getElementById("tipo").value,n=document.getElementById("metodo-pagamento").value,r=document.getElementById("status-pagamento").value,c=document.getElementById("parcelas").value.trim(),m=document.getElementById("categoria").value,l=document.getElementById("data").value;let i=1;const d=c.match(/(\d+)/);d&&!c.toLowerCase().includes("à vista")&&(i=parseInt(d[1],10)||1);try{const s=z(p),y=L(p,"users",u.uid,"transacoes"),X=o/i,[H,W,R]=l.split("-").map(Number);for(let b=0;b<i;b++){const h=new Date(H,W-1+b,R);h.getDate()!==R&&h.setDate(0);const K=h.getFullYear(),Y=String(h.getMonth()+1).padStart(2,"0"),Q=String(h.getDate()).padStart(2,"0"),Z=b===0?r:"Pendente",ee=i>1?`${b+1}/${i}`:"À vista",te=f(y);s.set(te,{descricao:e,valor:X,tipo:a,metodoPagamento:n,status:Z,parcelas:ee,categoria:m,data:`${K}-${Y}-${Q}`})}await s.commit(),A.reset(),i>1&&alert(`${i} parcelas geradas com sucesso!`)}catch(s){alert("Erro ao salvar: "+s.message)}});window.alternarStatusTransacao=async function(t,e){if(!u)return;const o=e==="Pago"?"Pendente":"Pago";try{await me(f(p,"users",u.uid,"transacoes",t),{status:o})}catch(a){alert("Erro ao atualizar status: "+a.message)}};window.removerTransacao=async function(t){if(u)try{await pe(f(p,"users",u.uid,"transacoes",t))}catch(e){alert("Erro ao remover: "+e.message)}};function Re(t,e){const o=document.createElement("tr"),a=e.valor.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),n=e.tipo==="entrada"?"entrada":"saida",r=e.status||"Pago",c=r==="Pago",m=c?'<span style="color: #10b981; font-weight: 600;">✓ Pago</span>':'<span style="color: #f59e0b; font-weight: 600;">⏳ Pendente</span>',l=c?"Marcar Pendente":"Marcar Pago",i=`
        background: linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(124, 58, 237, 0.15));
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(167, 139, 250, 0.4);
        color: #e9d5ff;
        font-size: 0.75rem;
        padding: 5px 10px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(124, 58, 237, 0.15);
    `;o.innerHTML=`
        <td>${e.descricao}</td>
        <td class="${n}">${e.tipo==="saida"?"-":""}${a}</td>
        <td>${e.metodoPagamento||"N/A"}</td>
        <td>${m}</td>
        <td>${e.parcelas||"1/1"}</td>
        <td>${e.categoria}</td>
        <td>${e.data.split("-").reverse().join("/")}</td>
        <td>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button 
                    style="${i}" 
                    onmouseover="this.style.background='linear-gradient(135deg, rgba(167, 139, 250, 0.45), rgba(124, 58, 237, 0.3))'; this.style.boxShadow='0 4px 20px rgba(167, 139, 250, 0.4)';" 
                    onmouseout="this.style.background='linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(124, 58, 237, 0.15))'; this.style.boxShadow='0 4px 15px rgba(124, 58, 237, 0.15)';"
                    onclick="alternarStatusTransacao('${t}', '${r}')">
                    ${l}
                </button>
                <button class="btn-delete" onclick="removerTransacao('${t}')">Apagar</button>
            </div>
        </td>
    `,_.appendChild(o)}function ke(t){let e=0,o=0;t.forEach(a=>{a.tipo==="entrada"?e+=a.valor:a.tipo==="saida"&&(o+=a.valor)}),document.getElementById("total-entradas").innerText=e.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),document.getElementById("total-saidas").innerText=o.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),document.getElementById("saldo-total").innerText=(e-o).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}Te.addEventListener("click",()=>{if(x.length===0){alert("Nenhuma transação encontrada para este mês.");return}const t={},e={};let o=0,a=0,n=0;x.forEach(d=>{if(d.tipo==="saida"){a+=d.valor,t[d.descricao.trim()]=(t[d.descricao.trim()]||0)+d.valor;const s=d.metodoPagamento||"Outros";e[s]=(e[s]||0)+d.valor,d.status==="Pendente"&&(n+=d.valor)}else d.tipo==="entrada"&&(o+=d.valor)});const r=g.value?g.value.split("-").reverse().join("/"):"Geral",c=Object.entries(t).sort((d,s)=>s[1]-d[1]),m=Object.entries(e).sort((d,s)=>s[1]-d[1]);let l=c.map(([d,s])=>`
        <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
            <span>${d}</span>
            <strong>R$ ${s.toFixed(2)} <span style="color: #a78bfa; font-weight: normal;">(${(s/(a||1)*100).toFixed(1)}%)</span></strong>
        </li>
    `).join(""),i=m.map(([d,s])=>`
        <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
            <span>${d}</span>
            <strong>R$ ${s.toFixed(2)} <span style="color: #a78bfa; font-weight: normal;">(${(s/(a||1)*100).toFixed(1)}%)</span></strong>
        </li>
    `).join("");Pe.innerHTML=`
        <div style="font-family: sans-serif; color: #f8fafc; background-color: #0f172a; padding: 15px; border-radius: 12px;">
            <div style="border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="color: #a78bfa; margin: 0; font-size: 1.3rem;">📊 Relatório Financeiro</h2>
                <span style="color: #94a3b8; font-size: 0.85rem;">Mês Referência: <strong>${r}</strong></span>
            </div>

            <!-- Resumo Financeiro em Cards -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px; border-radius: 8px;">
                    <span style="font-size: 0.75rem; color: #10b981; font-weight: bold;">ENTRADAS</span>
                    <h3 style="margin: 4px 0 0 0; color: #10b981; font-size: 1rem;">R$ ${o.toFixed(2)}</h3>
                </div>
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 8px;">
                    <span style="font-size: 0.75rem; color: #ef4444; font-weight: bold;">SAÍDAS</span>
                    <h3 style="margin: 4px 0 0 0; color: #ef4444; font-size: 1rem;">R$ ${a.toFixed(2)}</h3>
                </div>
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 10px; border-radius: 8px;">
                    <span style="font-size: 0.75rem; color: #f59e0b; font-weight: bold;">PENDENTES</span>
                    <h3 style="margin: 4px 0 0 0; color: #f59e0b; font-size: 1rem;">R$ ${n.toFixed(2)}</h3>
                </div>
            </div>

            <!-- Colunas com Detalhes de Gastos -->
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 220px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    <h4 style="color: #a78bfa; margin-top: 0; margin-bottom: 10px; font-size: 0.9rem; border-bottom: 1px solid rgba(167, 139, 250, 0.3); padding-bottom: 4px;">Gastos por Descrição</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">${l||'<li style="color:#94a3b8;">Nenhum registro.</li>'}</ul>
                </div>

                <div style="flex: 1; min-width: 220px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    <h4 style="color: #a78bfa; margin-top: 0; margin-bottom: 10px; font-size: 0.9rem; border-bottom: 1px solid rgba(167, 139, 250, 0.3); padding-bottom: 4px;">Forma de Pagamento</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">${i||'<li style="color:#94a3b8;">Nenhum registro.</li>'}</ul>
                </div>
            </div>
        </div>
    `,G.style.display="block"});Se.addEventListener("click",()=>{G.style.display="none"});Le.addEventListener("click",()=>{const t=document.getElementById("conteudo-relatorio"),o={margin:8,filename:`relatorio-financeiro-${g.value||"geral"}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,backgroundColor:"#0f172a",useCORS:!0},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}};html2pdf().set(o).from(t).save()});
