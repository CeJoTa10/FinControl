import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initImportModule } from "./importExtrato.js";

// CREDENCIAIS FIREBASE
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// CREDENCIAIS EMAILJS
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

if (typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let isSignUpMode = false;
let unsubscribeFirestore = null;
let transacoesAtuais = [];

// Elementos HTML
const authContainer = document.getElementById('auth-container');
const verifyContainer = document.getElementById('verify-container');
const appContainer = document.getElementById('app-container');

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchBtn = document.getElementById('auth-switch-btn');

const groupNome = document.getElementById('group-nome');
const groupConfirmPassword = document.getElementById('group-confirm-password');

const btnVerifyOtp = document.getElementById('btn-verify-otp');
const btnResendOtp = document.getElementById('btn-resend-otp');
const btnCancelVerify = document.getElementById('btn-cancel-verify');

const userEmailSpan = document.getElementById('user-email');
const btnLogout = document.getElementById('btn-logout');

const financeForm = document.getElementById('finance-form');
const tabelaCorpo = document.getElementById('tabela-corpo');
const filtroMesInput = document.getElementById('filtro-mes');

const btnGerarRelatorio = document.getElementById('btn-gerar-relatorio');
const painelRelatorio = document.getElementById('painel-relatorio');
const conteudoRelatorio = document.getElementById('conteudo-relatorio');
const btnFecharRelatorio = document.getElementById('btn-fechar-relatorio');
const btnExportarPdf = document.getElementById('btn-exportar-pdf');

const otpInputs = document.querySelectorAll('.otp-input');

if (filtroMesInput && !filtroMesInput.value) {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    filtroMesInput.value = `${ano}-${mes}`;
}

filtroMesInput.addEventListener('change', () => {
    if (currentUser) carregarTransacoesUsuario(currentUser.uid);
});

otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
});

authSwitchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;

    if (isSignUpMode) {
        authTitle.innerText = "Criar uma Conta";
        authBtn.innerText = "Cadastrar";
        authSwitchText.innerText = "Já tem uma conta?";
        authSwitchBtn.innerText = "Entrar";

        groupNome.style.display = "block";
        groupConfirmPassword.style.display = "block";
        document.getElementById('auth-nome').required = true;
        document.getElementById('auth-confirm-password').required = true;
    } else {
        authTitle.innerText = "Entrar na sua Conta";
        authBtn.innerText = "Entrar";
        authSwitchText.innerText = "Não tem uma conta?";
        authSwitchBtn.innerText = "Cadastrar-se";

        groupNome.style.display = "none";
        groupConfirmPassword.style.display = "none";
        document.getElementById('auth-nome').required = false;
        document.getElementById('auth-confirm-password').required = false;
    }
});

async function gerarEEnviarOtp(user) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        otpCode: code,
        isVerified: false
    }, { merge: true });

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: user.email,
        to_name: user.displayName || user.email,
        otp_code: code
    });
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
        if (isSignUpMode) {
            const nome = document.getElementById('auth-nome').value;
            const confirmPassword = document.getElementById('auth-confirm-password').value;

            if (password !== confirmPassword) {
                alert("As senhas não coincidem!");
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: nome });

            await gerarEEnviarOtp(userCredential.user);
            alert("Código de 6 dígitos enviado para o seu e-mail!");
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        authForm.reset();
    } catch (error) {
        console.error("Erro completo:", error);
        alert("Erro: " + (error.text || error.message || JSON.stringify(error)));
    }
});

btnResendOtp.addEventListener('click', async () => {
    if (currentUser) {
        try {
            await gerarEEnviarOtp(currentUser);
            alert("Novo código enviado com sucesso para seu e-mail!");
        } catch (err) {
            alert("Erro ao reenviar: " + (err.text || err.message || JSON.stringify(err)));
        }
    }
});

btnVerifyOtp.addEventListener('click', async () => {
    if (!currentUser) return;

    let enteredCode = "";
    otpInputs.forEach(input => enteredCode += input.value);

    if (enteredCode.length !== 6) {
        alert("Por favor, digite os 6 dígitos do código.");
        return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().otpCode === enteredCode) {
        await setDoc(userDocRef, { isVerified: true }, { merge: true });
        alert("E-mail confirmado com sucesso!");
        location.reload();
    } else {
        alert("Código incorreto. Verifique e tente novamente.");
    }
});

btnCancelVerify.addEventListener('click', () => signOut(auth));
btnLogout.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        const isVerified = userDoc.exists() && userDoc.data().isVerified === true;

        if (isVerified) {
            const nomeExibicao = user.displayName ? `Olá, ${user.displayName}` : user.email;
            userEmailSpan.innerText = nomeExibicao;

            authContainer.style.display = 'none';
            verifyContainer.style.display = 'none';
            appContainer.style.display = 'block';

            carregarTransacoesUsuario(user.uid);
            initImportModule(db, () => currentUser);
        } else {
            authContainer.style.display = 'none';
            appContainer.style.display = 'none';
            verifyContainer.style.display = 'block';
        }
    } else {
        currentUser = null;
        if (unsubscribeFirestore) unsubscribeFirestore();
        appContainer.style.display = 'none';
        verifyContainer.style.display = 'none';
        authContainer.style.display = 'block';
    }
});

function carregarTransacoesUsuario(userId) {
    const q = query(
        collection(db, "users", userId, "transacoes"),
        orderBy("data", "desc")
    );

    unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const mesSelecionado = filtroMesInput.value;
        transacoesAtuais = [];
        tabelaCorpo.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const dataDoc = docSnap.data();
            if (!mesSelecionado || dataDoc.data.startsWith(mesSelecionado)) {
                transacoesAtuais.push({ id: docSnap.id, ...dataDoc });
                renderizarLinha(docSnap.id, dataDoc);
            }
        });

        atualizarTotais(transacoesAtuais);
    });
}

financeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const descricao = document.getElementById('descricao').value;
    const valorTotal = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;
    const metodoPagamento = document.getElementById('metodo-pagamento').value;
    const statusInicial = document.getElementById('status-pagamento').value;
    const inputParcelas = document.getElementById('parcelas').value.trim();
    const categoria = document.getElementById('categoria').value;
    const dataInicialStr = document.getElementById('data').value;

    let numParcelas = 1;
    const matchMatch = inputParcelas.match(/(\d+)/);
    if (matchMatch && !inputParcelas.toLowerCase().includes('à vista')) {
        numParcelas = parseInt(matchMatch[1], 10) || 1;
    }

    try {
        const batch = writeBatch(db);
        const transRef = collection(db, "users", currentUser.uid, "transacoes");

        const valorParcela = valorTotal / numParcelas;
        const [anoBase, mesBase, diaBase] = dataInicialStr.split('-').map(Number);

        for (let i = 0; i < numParcelas; i++) {
            const dataParcela = new Date(anoBase, (mesBase - 1) + i, diaBase);
            if (dataParcela.getDate() !== diaBase) dataParcela.setDate(0);

            const anoFmt = dataParcela.getFullYear();
            const mesFmt = String(dataParcela.getMonth() + 1).padStart(2, '0');
            const diaFmt = String(dataParcela.getDate()).padStart(2, '0');

            const statusParcela = i === 0 ? statusInicial : "Pendente";
            const textoParcela = numParcelas > 1 ? `${i + 1}/${numParcelas}` : "À vista";

            const newDoc = doc(transRef);
            batch.set(newDoc, {
                descricao: descricao,
                valor: valorParcela,
                tipo: tipo,
                metodoPagamento: metodoPagamento,
                status: statusParcela,
                parcelas: textoParcela,
                categoria: categoria,
                data: `${anoFmt}-${mesFmt}-${diaFmt}`
            });
        }

        await batch.commit();
        financeForm.reset();
        if (numParcelas > 1) alert(`${numParcelas} parcelas geradas com sucesso!`);

    } catch (error) {
        alert("Erro ao salvar: " + error.message);
    }
});

window.alternarStatusTransacao = async function (id, statusAtual) {
    if (!currentUser) return;
    const novoStatus = statusAtual === 'Pago' ? 'Pendente' : 'Pago';
    try {
        await updateDoc(doc(db, "users", currentUser.uid, "transacoes", id), { status: novoStatus });
    } catch (error) {
        alert("Erro ao atualizar status: " + error.message);
    }
};

window.removerTransacao = async function (id) {
    if (!currentUser) return;
    try {
        await deleteDoc(doc(db, "users", currentUser.uid, "transacoes", id));
    } catch (error) {
        alert("Erro ao remover: " + error.message);
    }
};

function renderizarLinha(id, item) {
    const tr = document.createElement('tr');
    const valorFormatado = item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const corClasse = item.tipo === 'entrada' ? 'entrada' : 'saida';

    const statusTexto = item.status || 'Pago';
    const isPago = statusTexto === 'Pago';

    const statusBadge = isPago
        ? `<span style="color: #10b981; font-weight: 600;">✓ Pago</span>`
        : `<span style="color: #f59e0b; font-weight: 600;">⏳ Pendente</span>`;

    const btnStatusTexto = isPago ? 'Marcar Pendente' : 'Marcar Pago';

    const estiloBtnStatus = `
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
    `;

    tr.innerHTML = `
        <td>${item.descricao}</td>
        <td class="${corClasse}">${item.tipo === 'saida' ? '-' : ''}${valorFormatado}</td>
        <td>${item.metodoPagamento || 'N/A'}</td>
        <td>${statusBadge}</td>
        <td>${item.parcelas || '1/1'}</td>
        <td>${item.categoria}</td>
        <td>${item.data.split('-').reverse().join('/')}</td>
        <td>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button 
                    style="${estiloBtnStatus}" 
                    onmouseover="this.style.background='linear-gradient(135deg, rgba(167, 139, 250, 0.45), rgba(124, 58, 237, 0.3))'; this.style.boxShadow='0 4px 20px rgba(167, 139, 250, 0.4)';" 
                    onmouseout="this.style.background='linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(124, 58, 237, 0.15))'; this.style.boxShadow='0 4px 15px rgba(124, 58, 237, 0.15)';"
                    onclick="alternarStatusTransacao('${id}', '${statusTexto}')">
                    ${btnStatusTexto}
                </button>
                <button class="btn-delete" onclick="removerTransacao('${id}')">Apagar</button>
            </div>
        </td>
    `;
    tabelaCorpo.appendChild(tr);
}

function atualizarTotais(transacoes) {
    let entradas = 0, saidas = 0;
    transacoes.forEach(t => {
        if (t.tipo === 'entrada') entradas += t.valor;
        else if (t.tipo === 'saida') saidas += t.valor;
    });

    document.getElementById('total-entradas').innerText = entradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-saidas').innerText = saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('saldo-total').innerText = (entradas - saidas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

btnGerarRelatorio.addEventListener('click', () => {
    if (transacoesAtuais.length === 0) {
        alert("Nenhuma transação encontrada para este mês.");
        return;
    }

    const gastosPorDescricao = {}, gastosPorMetodo = {};
    let totalEntradas = 0, totalSaidas = 0, totalPendentes = 0;

    transacoesAtuais.forEach(t => {
        if (t.tipo === 'saida') {
            totalSaidas += t.valor;
            gastosPorDescricao[t.descricao.trim()] = (gastosPorDescricao[t.descricao.trim()] || 0) + t.valor;
            const metodo = t.metodoPagamento || 'Outros';
            gastosPorMetodo[metodo] = (gastosPorMetodo[metodo] || 0) + t.valor;

            if (t.status === 'Pendente') totalPendentes += t.valor;
        } else if (t.tipo === 'entrada') {
            totalEntradas += t.valor;
        }
    });

    const mesAno = filtroMesInput.value ? filtroMesInput.value.split('-').reverse().join('/') : 'Geral';
    const descricoesOrdenadas = Object.entries(gastosPorDescricao).sort((a, b) => b[1] - a[1]);
    const metodosOrdenados = Object.entries(gastosPorMetodo).sort((a, b) => b[1] - a[1]);

    let htmlDescricoes = descricoesOrdenadas.map(([desc, val]) => `
        <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
            <span>${desc}</span>
            <strong>R$ ${val.toFixed(2)} <span style="color: #a78bfa; font-weight: normal;">(${((val / (totalSaidas || 1)) * 100).toFixed(1)}%)</span></strong>
        </li>
    `).join('');

    let htmlMetodos = metodosOrdenados.map(([met, val]) => `
        <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
            <span>${met}</span>
            <strong>R$ ${val.toFixed(2)} <span style="color: #a78bfa; font-weight: normal;">(${((val / (totalSaidas || 1)) * 100).toFixed(1)}%)</span></strong>
        </li>
    `).join('');

    // Estrutura visual com as cores idênticas do site (fundo escuro #0f172a, cards escuros, destaques roxos)
    conteudoRelatorio.innerHTML = `
        <div style="font-family: sans-serif; color: #f8fafc; background-color: #0f172a; padding: 15px; border-radius: 12px;">
            <div style="border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="color: #a78bfa; margin: 0; font-size: 1.3rem;">📊 Relatório Financeiro</h2>
                <span style="color: #94a3b8; font-size: 0.85rem;">Mês Referência: <strong>${mesAno}</strong></span>
            </div>

            <!-- Resumo Financeiro em Cards -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 10px; border-radius: 8px;">
                    <span style="font-size: 0.75rem; color: #10b981; font-weight: bold;">ENTRADAS</span>
                    <h3 style="margin: 4px 0 0 0; color: #10b981; font-size: 1rem;">R$ ${totalEntradas.toFixed(2)}</h3>
                </div>
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 10px; border-radius: 8px;">
                    <span style="font-size: 0.75rem; color: #ef4444; font-weight: bold;">SAÍDAS</span>
                    <h3 style="margin: 4px 0 0 0; color: #ef4444; font-size: 1rem;">R$ ${totalSaidas.toFixed(2)}</h3>
                </div>
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 10px; border-radius: 8px;">
                    <span style="font-size: 0.75rem; color: #f59e0b; font-weight: bold;">PENDENTES</span>
                    <h3 style="margin: 4px 0 0 0; color: #f59e0b; font-size: 1rem;">R$ ${totalPendentes.toFixed(2)}</h3>
                </div>
            </div>

            <!-- Colunas com Detalhes de Gastos -->
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 220px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    <h4 style="color: #a78bfa; margin-top: 0; margin-bottom: 10px; font-size: 0.9rem; border-bottom: 1px solid rgba(167, 139, 250, 0.3); padding-bottom: 4px;">Gastos por Descrição</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">${htmlDescricoes || '<li style="color:#94a3b8;">Nenhum registro.</li>'}</ul>
                </div>

                <div style="flex: 1; min-width: 220px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                    <h4 style="color: #a78bfa; margin-top: 0; margin-bottom: 10px; font-size: 0.9rem; border-bottom: 1px solid rgba(167, 139, 250, 0.3); padding-bottom: 4px;">Forma de Pagamento</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">${htmlMetodos || '<li style="color:#94a3b8;">Nenhum registro.</li>'}</ul>
                </div>
            </div>
        </div>
    `;

    painelRelatorio.style.display = 'block';
});

btnFecharRelatorio.addEventListener('click', () => {
    painelRelatorio.style.display = 'none';
});

// AÇÃO DO BOTÃO DE EXPORTAR PDF
btnExportarPdf.addEventListener('click', () => {
    const elementoRelatorio = document.getElementById('conteudo-relatorio');
    const mesAno = filtroMesInput.value || 'geral';

    // Configurações do arquivo PDF
    const opcoes = {
        margin: 8,
        filename: `relatorio-financeiro-${mesAno}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            backgroundColor: '#0f172a', // Garante que o fundo seja o azul/preto escuro do site
            useCORS: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Gera o arquivo PDF
    html2pdf().set(opcoes).from(elementoRelatorio).save();
});