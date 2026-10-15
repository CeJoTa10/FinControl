# 💰 FinControl - Controle Financeiro Pessoal

![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)

> Uma aplicação web leve, moderna e responsiva para gerenciamento financeiro pessoal e importação de extratos bancários.

🔗 **[https://fin-control-lyart.vercel.app/](https://fin-control-lyart.vercel.app/))**

---

## 📌 Sobre o Projeto

O **FinControl** foi desenvolvido para simplificar o acompanhamento de despesas e receitas diárias. A aplicação conta com uma interface limpa em estilo *Glassmorphism*, adaptada para dispositivos móveis e desktops, permitindo o cadastro manual de movimentações financeiras bem como a importação simplificada de extratos.

### ✨ Funcionalidades Principais
- 📊 **Resumo Financeiro Instantâneo:** Cards de Entradas, Saídas e Saldo Total otimizados para leitura rápida no mobile.
- ➕ **Cadastro de Transações:** Formulário retrátil (collapsible) para adicionar transações com campos como Categoria, Método de Pagamento, Status e Parcelamento.
- 📄 **Importação de Extrato:** Suporte à leitura e parsing de arquivos de extrato financeiro.
- 📱 **Design Responsivo:** Layout fluido construído com CSS Grid e Flexbox, adaptado para qualquer tamanho de tela.

---

## 🎨 Interface e Layout

| Visão Desktop | Visão Mobile |
| :---: | :---: |
| ![Desktop] ![alt text](<Imagens/image copy.png>)
| ![Mobile] ![alt text](<Imagens/image copy 3.png>)

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 (Modern Flexbox/Grid e Glassmorphism Design)
- **Linguagem:** JavaScript (ES6+)
- **Build Tool / Bundler:** [Vite](https://vitejs.dev/)
- **Hospedagem / Deploy:** [Vercel](https://vercel.com)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
Antes de começar, você precisará ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (Versão 16 ou superior)
- Gerenciador de pacotes `npm` ou `yarn`

### Passo a Passo

1. **Clone este repositório:**
   ```bash
   git clone https://github.com/CeJoTa10/FinControl.git
   Acesse a pasta do projeto:

2. **No Terminal do projeto execute**
    cd FinControl

Instale as dependências:
    npm install

3. Inicie o servidor de desenvolvimento:
    npm run dev

4. Abra o navegador e acesse o endereço fornecido no terminal
    (geralmente http://localhost:5173).

   ### Estrutura dos Arquivos
FinControl/
├── index.html            # Estrutura principal da página web
├── style.css             # Estilos globais e regras de responsividade (Mobile First)
├── src/
│   ├── script.js         # Lógica de manipulação do DOM e controle do estado
│   └── importExtrato.js  # Lógica para parsing e importação de extratos
├── package.json          # Dependências e scripts do projeto
└── README.md             # Documentação do projeto

✒️ Autor
Desenvolvido por Caio — entre em contato!

GitHub: @CeJoTa10

LinkedIn: www.linkedin.com/in/caio-juan-dev-ti
