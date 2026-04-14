# TOKNOW - Compliance & Risk Management System

O **TOKNOW** é uma plataforma corporativa completa desenvolvida para a gestão de Compliance e Avaliação de Risco de parceiros de negócio (Fornecedores e Clientes). Este sistema apoia organizações na verificação diligente (Due Diligence), homologação de entidades e mapeamento de métricas operacionais, servindo como uma componente indispensável de auditoria.

## 🚀 Tecnologias e Stack (The Stack)

A aplicação foi rigorosamente desenvolvida utilizando uma stack de última geração, garantindo performance, segurança e usabilidade responsiva:

### Frontend
- **React 19**: Biblioteca UI reativa, assegurando as interfaces e componentização moderna.
- **Vite 6**: Ferramenta de build de última geração e HMR (Hot Module Replacement) incrivelmente rápido.
- **Tailwind CSS 4**: Substrato estilístico com utilitários responsivos que permite o sistema fluir impecavelmente de ecrãs 4K até smartphones, além de gerir dinamicamente a tipografia (Inter) e o Modo Escuro.
- **React Router Dom (v7)**: Gestor de rotas da aplicação (Single Page Application).
- **Lucide React**: Biblioteca iconográfica profissional.
- **Recharts**: Geração de gráficos visuais limpos e consolidados no Painel de Gestão.

### Backend & Database
- **Node.js (Express)**: Motor de rotas API e orquestração de transações.
- **Better-Sqlite3**: Base de dados SQL transacional, escolhida pela enorme rapidez local e robustez na gestão síncrona/assíncrona para I/O.
- **BCrypt & JSON Web Tokens (JWT)**: Protocolo de autenticação moderno que substitui gestão sensível baseada apenas em cookies locais, além de proteção contra ataques na encriptação nativa das senhas dos utilizadores.
- **Multer**: Gestão dos streams para upload de ficheiros de evidência e documentação para o disco (`uploads/`).

---

## 🛠️ Configuração e Execução

### 1. Requisitos do Sistema
- **Node.js** v20+ (Obrigatório)
- **NPM** (incluído no Node.js)

### 2. Instalar Dependências
Navegue para o diretório raiz do projecto ("To Know") e instale todos os módulos:
```bash
npm install
```

### 3. Ficheiros de Ambiente
Certifique-se de que o ficheiro `.env` está presente na raiz com a variável secreta de produção. O sistema possui chaves robustas mapeadas já ativas:
```env
PORT=3000
JWT_SECRET=sua_chave_criptografica_aqui
```

### 4. Inicialização do Banco de Dados
A script `init_db.ts` cria todas as tabelas (Entities, Processes, Users, Notifications, etc.) e semeia dados reais iniciais bem como as credenciais de Administração. Para compilar a base do zero/resetar:
```bash
npx tsx init_db.ts
```

### 5. Executar a Aplicação (Servidor + UI)
Corra o seguinte comando para ligar o ambiente local. O site e a API ficarão imediatamente acessíveis:
```bash
npm run dev
```

Abra o seu navegador no link local emitido: [http://localhost:3000](http://localhost:3000/)

### Credenciais Padrão Iniciais:
- **Administrador:** `admin` | Senha: `admin123`
- **Gestor:** `gestor` | Senha: `gestor123`
- **Compras:** `compras`| Senha: `compras123`

---

## 🔒 Segurança Nativa do Sistema Instalado
1. **Sanitização Universal**: Cada Input passa por validadores lógicos antes de tocar na base de dados para impedir injeções de SQL. Utilização sistemática de Parametrização Better-SQLite3.
2. **Rate Limiting**: O Login é vigiado (Anti-Brute Force), cortando tentativas automatizadas em série.
3. **CORS Refinado**: Apenas cabeçalhos restritos à comunicação da aplicação passam para a API.
4. **RBAC Control (Role-Based)**: Rotas sensíveis (como a de Eliminar utilizadores ou Modificar configurações de Critérios) exigem que o token seja autenticado especificamente no papel de *Administrator*.

*(Para detalhes da Utilização e Interface visual, por favor consulte o documento `USER_GUIDE.md` incluído na pasta do projecto).*
