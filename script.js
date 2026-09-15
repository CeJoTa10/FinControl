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
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// SUAS CREDENCIAIS FIREBASE
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

emailjs.init(EMAILJS_PUBLIC_KEY);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let isSignUpMode = false;
let unsubscribeFirestore = null;

// Elementos
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

const otpInputs = document.querySelectorAll('.otp-input');

// Efeito de pulo automático entre os caixas de número do OTP
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

// Alternar entre Login e Cadastro
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

// Gerar e Enviar OTP de 6 dígitos
async function gerarEEnviarOtp(user) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Salva o token no Firestore do usuário
    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        otpCode: code,
        isVerified: false
    }, { merge: true });

    // Envia o e-mail via EmailJS
    const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: user.email,
        to_name: user.displayName || user.email,
        otp_code: code
    });

    console.log("EmailJS Sucesso:", response);
}

// Submissão do Form de Login/Cadastro
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

// Reenviar Token
btnResendOtp.addEventListener('click', async () => {
    if (currentUser) {
        try {
            await gerarEEnviarOtp(currentUser);
            alert("Novo código enviado com sucesso para seu e-mail!");
        } catch (err) {
            console.error("Erro Reenvio:", err);
            alert("Erro ao reenviar: " + (err.text || err.message || JSON.stringify(err)));
        }
    }
});

// Validar o Token digitado pelo usuário
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

    if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.otpCode === enteredCode) {
            // Marca como verificado no banco de dados
            await setDoc(userDocRef, { isVerified: true }, { merge: true });
            alert("E-mail confirmado com sucesso!");
            location.reload();
        } else {
            alert("Código incorreto. Verifique e tente novamente.");
        }
    }
});

// Reenviar Token
btnResendOtp.addEventListener('click', async () => {
    if (currentUser) {
        try {
            await gerarEEnviarOtp(currentUser);
            alert("Novo código enviado com sucesso para seu e-mail!");
        } catch (err) {
            alert("Erro ao reenviar: " + err.message);
        }
    }
});

btnCancelVerify.addEventListener('click', () => {
    signOut(auth);
});

btnLogout.addEventListener('click', () => {
    signOut(auth);
});

// Checar status do Usuário
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
        const transacoes = [];
        tabelaCorpo.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const dataDoc = docSnap.data();
            transacoes.push({ id: docSnap.id, ...dataDoc });
            renderizarLinha(docSnap.id, dataDoc);
        });

        atualizarTotais(transacoes);
    });
}

financeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    const data = document.getElementById('data').value;

    try {
        await addDoc(collection(db, "users", currentUser.uid, "transacoes"), {
            descricao,
            valor,
            tipo,
            categoria,
            data
        });
        financeForm.reset();
    } catch (error) {
        alert("Erro ao salvar: " + error.message);
    }
});

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

    tr.innerHTML = `
        <td>${item.descricao}</td>
        <td class="${corClasse}">${item.tipo === 'saida' ? '-' : ''}${valorFormatado}</td>
        <td>${item.categoria}</td>
        <td>${item.data.split('-').reverse().join('/')}</td>
        <td>
            <button class="btn-delete" onclick="removerTransacao('${id}')">Apagar</button>
        </td>
    `;
    tabelaCorpo.appendChild(tr);
}

function atualizarTotais(transacoes) {
    let entradas = 0;
    let saidas = 0;

    transacoes.forEach(t => {
        if (t.tipo === 'entrada') entradas += t.valor;
        else if (t.tipo === 'saida') saidas += t.valor;
    });

    const saldo = entradas - saidas;

    document.getElementById('total-entradas').innerText = entradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-saidas').innerText = saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('saldo-total').innerText = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}