import { collection, writeBatch, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let pendingTransactions = [];

// Função auxiliar para identificar o método de pagamento pelo texto da transação
function inferirMetodoPagamento(texto) {
    const txt = texto.toUpperCase();
    if (txt.includes('PIX')) return 'Pix';
    if (txt.includes('CARTAO') || txt.includes('CREDITO') || txt.includes('COMPRA')) return 'Cartão de Crédito';
    if (txt.includes('DEBITO') || txt.includes('TET') || txt.includes('TAR')) return 'Cartão de Débito';
    if (txt.includes('BOLETO') || txt.includes('PAG')) return 'Boleto'; // Correção do parêntese aqui
    return 'Outros';
}

function parseOFXText(ofxString) {
    const transactions = [];
    const blockRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = blockRegex.exec(ofxString)) !== null) {
        const block = match[1];

        const trnamtMatch = block.match(/<TRNAMT>([\d.-]+)/i);
        const dtpostedMatch = block.match(/<DTPOSTED>(\d{8})/i);
        const memoMatch = block.match(/<(?:MEMO|NAME)>([^<\r\n]+)/i);

        if (trnamtMatch && dtpostedMatch) {
            const rawAmount = parseFloat(trnamtMatch[1]);
            const rawDate = dtpostedMatch[1];

            const formattedDate = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
            const description = memoMatch ? memoMatch[1].trim() : "Transação Importada";

            // Detecta a Forma de Pagamento correta baseada no extrato
            const metodoDetectado = inferirMetodoPagamento(description);

            transactions.push({
                descricao: description,
                valor: Math.abs(rawAmount),
                tipo: rawAmount < 0 ? 'saida' : 'entrada',
                categoria: 'Geral', // Categoria padrão
                metodoPagamento: metodoDetectado, // Preenche a Forma de Pagamento
                status: 'Pago',
                parcelas: '1/1',
                data: formattedDate,
                selected: true
            });
        }
    }
    return transactions;
}

export function initImportModule(db, getCurrentUser, onImportSuccess) {
    const fileInput = document.getElementById('ofx-file-input');
    const previewContainer = document.getElementById('import-preview');
    const previewList = document.getElementById('preview-list');
    const btnConfirm = document.getElementById('btn-confirm-import');

    if (!fileInput) return;

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const fileText = await file.text();
            pendingTransactions = parseOFXText(fileText);

            if (pendingTransactions.length === 0) {
                alert("Nenhuma transação válida foi encontrada neste arquivo OFX.");
                return;
            }

            renderPreview(pendingTransactions, previewList);
            previewContainer.style.display = 'block';

        } catch (error) {
            console.error("Erro ao ler arquivo OFX:", error);
            alert("Erro ao ler o arquivo. Verifique se é um arquivo .OFX válido.");
        }
    });

    btnConfirm.addEventListener('click', async () => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        const selectedToSave = pendingTransactions.filter(t => t.selected);
        if (selectedToSave.length === 0) {
            alert("Selecione ao menos uma transação para importar.");
            return;
        }

        try {
            const batch = writeBatch(db);
            const userTransRef = collection(db, "users", currentUser.uid, "transacoes");

            selectedToSave.forEach(trans => {
                const newDocRef = doc(userTransRef);
                batch.set(newDocRef, {
                    descricao: trans.descricao,
                    valor: trans.valor,
                    tipo: trans.tipo,
                    categoria: trans.categoria,
                    metodoPagamento: trans.metodoPagamento,
                    status: trans.status,
                    parcelas: trans.parcelas,
                    data: trans.data
                });
            });

            await batch.commit();

            alert(`${selectedToSave.length} transações importadas com sucesso!`);
            previewContainer.style.display = 'none';
            fileInput.value = '';
            pendingTransactions = [];

            if (typeof onImportSuccess === 'function') {
                onImportSuccess();
            }

        } catch (error) {
            console.error("Erro ao salvar no Firestore:", error);
            alert("Erro ao salvar as transações no banco de dados.");
        }
    });
}

function renderPreview(transactions, container) {
    container.innerHTML = transactions.map((t, index) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="chk-${index}" ${t.selected ? 'checked' : ''} />
                <label for="chk-${index}" style="color: #fff; cursor: pointer;">
                    <strong>${t.data.split('-').reverse().join('/')}</strong> - ${t.descricao} <span style="color: #a78bfa;">(${t.metodoPagamento})</span>
                </label>
            </div>
            <span class="${t.tipo}" style="font-weight: 600;">
                ${t.tipo === 'saida' ? '-' : '+'} R$ ${t.valor.toFixed(2)}
            </span>
        </div>
    `).join('');

    transactions.forEach((_, index) => {
        document.getElementById(`chk-${index}`).addEventListener('change', (e) => {
            transactions[index].selected = e.target.checked;
        });
    });
}