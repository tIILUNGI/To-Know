# 📋 TOKNOW - Documentação Técnica Completa

## Índice
1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Módulos e Funcionalidades](#3-módulos-e-funcionalidades)
4. [Base de Dados](#4-base-de-dados)
5. [API Endpoints](#5-api-endpoints)
6. [Autenticação e Segurança](#6-autenticação-e-segurança)
7. [Guia de Instalação](#7-guia-de-instalação)
8. [Configuração de Ambiente](#8-configuração-de-ambiente)
9. [Fluxo de Trabalho](#9-fluxo-de-trabalho)
10. [Guia de Administração](#10-guia-de-administração)

---

## 1. Visão Geral

### 1.1 Descrição do Sistema
**TOKNOW** é uma plataforma corporativa de **Gestão de Conformidade e Avaliação de Risco** desenvolvida para apoiar organizações na verificação diligente (Due Diligence), homologação de entidades e mapeamento de métricas operacionais. O sistema serve como componente essencial de auditoria para o gerenciamento de fornecedores, clientes e colaboradores.

### 1.2 Escopo do Sistema
O sistema abrange as seguintes áreas:
- **Gestão de Entidades**: Fornecedores, Clientes e Colaboradores
- **Processos de Aprovação**: Due diligence com workflow estruturado
- **Avaliações de Performance**: Sistema de pontuação e classificação
- **Documentação Legal**: Controle de vencimentos e alertas
- **360° Evaluation**: Avaliação multidimensional de colaboradores
- **Rescisão de Contratos**: Processo formal de terminação de relacionamento

### 1.3 Público-Alvo
- Compliance Managers
- Gestores de Compras
- Auditores internos
- Diretores e Administradores

---

## 2. Arquitetura do Sistema

### 2.1 Stack Tecnológica

#### Frontend
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| React | 19 | Framework de interface reativa |
| Vite | 6 | Build tool e HMR ultrarrápido |
| Tailwind CSS | 4 | Framework CSS utilitário |
| React Router Dom | 7 | Roteamento SPA |
| Lucide React | - | Biblioteca de ícones |
| Recharts | - | Visualização de gráficos |

#### Backend
| Tecnologia | Finalidade |
|------------|------------|
| Node.js (Express) | API REST e orquestração |
| Better-Sqlite3 | Base de dados SQL transaccional |
| BCrypt | Encriptação de senhas |
| JSON Web Tokens | Autenticação stateless |
| Multer | Upload de ficheiros |

### 2.2 Estrutura de Diretórios
```
To Know/
├── src/
│   ├── components/           # Componentes React
│   │   ├── admin/           # Administração
│   │   ├── common/          # Componentes compartilhados
│   │   ├── dashboard/       # Painel principal
│   │   ├── employees/       # Gestão de colaboradores
│   │   ├── entities/        # Fornecedores/Clientes
│   │   ├── evaluations/     # Sistema de avaliações
│   │   ├── legal/           # Documentação legal
│   │   ├── processes/       # Workflow de processos
│   │   ├── profile/         # Perfil de utilizador
│   │   ├── reports/         # Relatórios
│   │   └── users/           # Gestão de utilizadores
│   ├── context/            # Contextos React (Auth, Language, Toast)
│   ├── lib/                # Bibliotecas auxiliares
│   ├── types/              # Tipos TypeScript
│   ├── App.tsx             # Componente raiz
│   └── main.tsx            # Entry point
├── server.ts               # Servidor Express
├── toknow.db              # Base de dados SQLite
└── uploads/               # Ficheiros carregados
```

---

## 3. Módulos e Funcionalidades

### 3.1 Dashboard (Painel de Gestão)
- **KPIs Principais**: Total de processos, pendentes, aprovados, reprovados
- **Gráficos de Performance**: Scores de conformidade, progresso de workflow
- **Filtros de Período**: Todo período, último trimestre, mês atual
- **Notificações**: Alertas em tempo real

### 3.2 Gestão de Entidades
#### Fornecedores
- **Validação automática**: NIF, contrato, certidões
- **Scoring de risco**: 6 dimensões (Financeiro, Legal, Operacional, Reputacional, Fraude, Sanções)
- **Status de relacionamento**: Elegível, Restrito, Inelegível

#### Clientes
- **Classificação de risco**: Baseado em volume e criticidade
- **Histórico comercial**: Volume, frequência, ticket médio
- **Due diligence**: Verificação de documentação

#### Colaboradores
- **Dados completos**: Cargo, departamento, gestor directo
- **Avaliações 360°**: Autoavaliação, pares, gestão
- **Formação**: Cursos e certificações

### 3.3 Processos de Aprovação
#### Estados do Workflow
```
1. Rascunho → 2. Submetido → 3. Validação Documental 
   → 4. Avaliação Técnica/Comercial → 5. Em Aprovação 
   → 6. Aprovado/Reprovado → 7. Comunicação do Resultado 
   → 8. Em Monitorização
```

#### Tipos de Processo
- **Aprovação**: Due diligence de novos parceiros
- **Avaliação**: Performance de entidades existentes
- **Reavaliação**: Reavaliação periódica
- **Auditoria**: Verificação de conformidade
- **Homologação**: Certificação formal
- **Rescisão**: Terminação de contrato

### 3.4 Sistema de Avaliações
#### Critérios de Avaliação
| Código | Nome | Peso | Máximo |
|--------|------|------|--------|
| CRIT-001 | Qualidade | 10 | 5 |
| CRIT-002 | Prazo | 8 | 5 |
| CRIT-003 | Compliance | 10 | 5 |
| CRIT-004 | Preço | 10 | 5 |

#### Classificação de Resultados
| Percentagem | Classificação |
|-------------|---------------|
| ≥ 90% | Excelente |
| ≥ 75% | Bom |
| ≥ 60% | Satisfatório |
| ≥ 40% | Insatisfatório |
| < 40% | Crítico |

### 3.5 Avaliação 360°
#### Secções
1. **Autoavaliação do Funcionário** (5 perguntas)
2. **Avaliação de Colega** (5 perguntas)
3. **Avaliação do Gestor** (5 perguntas)
4. **Avaliação do Colaborador (Gestor)** (4 perguntas)

#### Escala de Resposta
1. Discordo Totalmente
2. Discordo
3. Neutro
4. Concordo
5. Concordo Totalmente

### 3.6 Rescisão de Contrato
#### Campos Obrigatórios
- **Entidade**: Colaborador/Cliente/Fornecedor
- **Motivo da Rescisão**: Descrição detalhada
- **Data da Rescisão**: Quando entra em vigor
- **Tipo de Rescisão**: Acordo mútuo, Justa causa, Iniciativa própria
- **Registo/Documento**: Certidão ou referência legal
- **Departamento de Atendimento**: RH, Jurídico, Administração

---

## 4. Base de Dados

### 4.1 Esquema de Tabelas Principais

#### users
```sql
id, username, password, name, role, email, created_at
```
Roles: Administrator, Compliance Manager, Procurement, Viewer

#### entities
```sql
id, code, name, trade_name, entity_type, status, 
tax_id, relationship_status, sector, operational_impact,
criticality, final_risk_rating, observations
```

#### employees
```sql
id, user_id, name, email, position, department, 
hire_date, status, manager_id
```

#### processes
```sql
id, process_number, type, status, opener_id, entity_id,
current_step, result_percentage, classification,
termination_reason, termination_date, document_type,
registration, service_area
```

#### criteria
```sql
id, code, name, description, entity_type, process_type,
weight, min_score, max_score, is_required
```

#### evaluations
```sql
id, entity_id, type, evaluation_number, evaluation_date,
overall_score, percentage, classification
```

#### legal_documents
```sql
id, name, type, expiration_date, file_url
```

---

## 5. API Endpoints

### 5.1 Autenticação
```
POST /api/auth/login       # Autenticação de utilizador
POST /api/auth/register    # Registo de novo utilizador
POST /api/auth/forgot      # Recuperação de senha
```

### 5.2 Entidades
```
GET    /api/entities              # Listar entidades (filtros: type, status)
GET    /api/entities/:id          # Detalhes da entidade
POST   /api/entities              # Criar entidade
PUT    /api/entities/:id          # Atualizar entidade
DELETE /api/entities/:id          # Eliminar entidade
GET    /api/employees             # Listar colaboradores
```

### 5.3 Processos
```
GET    /api/processes             # Listar processos
GET    /api/processes/:id         # Detalhes do processo
POST   /api/processes             # Criar processo
PUT    /api/processes/:id/transition  # Avançar workflow
PUT    /api/processes/:id/score   # Guardar pontuações
POST   /api/processes/:id/approve # Decisão de aprovação
DELETE /api/processes/:id         # Eliminar processo
GET    /api/process-types         # Tipos de processo
```

### 5.4 Avaliações
```
GET    /api/evaluations           # Listar avaliações
GET    /api/evaluations/:id       # Detalhes da avaliação
POST   /api/evaluations           # Criar avaliação
GET    /api/criteria              # Listar critérios
```

### 5.5 Documentação Legal
```
GET    /api/legal-documents       # Listar documentos
POST   /api/legal-documents       # Criar documento
DELETE /api/legal-documents/:id  # Eliminar documento
```

### 5.6 360° Evaluation
```
GET    /api/collaboration/forms           # Formulários 360°
GET    /api/collaboration/360/submissions/:token  # Resposta por token
POST   /api/collaboration/360/respond/:token      # Submeter resposta
```

---

## 6. Autenticação e Segurança

### 6.1 Autenticação JWT
- Token emitido após login válido
- Validade configurável via `JWT_SECRET`
- Inclui role do utilizador para autorização

### 6.2 Controlo de Acesso (RBAC)
| Role | Permissões |
|------|------------|
| Administrator | Full access, configurações, eliminação |
| Compliance Manager | Gestão de processos e avaliações |
| Procurement | Fornecedores e aprovações |
| Viewer | Apenas leitura |

### 6.3 Segurança Implementada
- **Rate Limiting**: 10 tentativas por 15 minutos no login
- **Sanitização**: Validação de inputs para prevenir SQL injection
- **CORS Refinado**: Headers restritos à origem da aplicação
- **BCrypt**: Encriptação de senhas com salt

---

## 7. Guia de Instalação

### 7.1 Requisitos
- Node.js v20+
- NPM v10+
- SQLite3

### 7.2 Instalação
```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com JWT_SECRET

# 3. Inicializar base de dados
npx tsx init_db.ts

# 4. Executar aplicação
npm run dev
```

### 7.3 Credenciais Padrão
| Utilizador | Senha | Role |
|------------|-------|------|
| admin | admin123 | Administrator |
| gestor | gestor123 | Compliance Manager |
| compras | compras123 | Procurement |

---

## 8. Configuração de Ambiente

### 8.1 Variáveis de Sistema (.env)
```env
PORT=3000
JWT_SECRET=sua_chave_secreta_aqui
```

### 8.2 Configurações de Produção
- Ativar HTTPS
- Configurar proxy reverso (Nginx/Apache)
- Backup automático da base de dados
- Logs estruturados

---

## 9. Fluxo de Trabalho

### 9.1 Processo de Aprovação Standard
```
1. Criar Processo → Selecionar Tipo e Entidade
2. Preencher Cabeçalho → Justificativa, Prioridade, Área
3. Adicionar Critérios → Selecionar e atribuir pesos
4. Submeter → Estado: "Submetido"
5. Validação Documental → Verificar documentos
6. Avaliação Técnica → Preencher scores
7. Aprovação → Decisão final
8. Comunicação → Notificar decisão
```

### 9.2 Fluxo de Rescisão
```
1. Clicar "Rescisão de Contrato"
2. Selecionar Tipo de Entidade (Colaborador/Cliente/Fornecedor)
3. Selecionar Entidade específica
4. Preencher Motivo da Rescisão
5. Indicar Data e Tipo de Rescisão
6. Criar Processo → Termina relacionamento
```

---

## 10. Guia de Administração

### 10.1 Gestão de Critérios
- Aceder a Configurações → Critérios
- Criar novo: Código, Nome, Peso, Máximo, Tipo de Entidade
- Editar existentes para adaptar a políticas internas

### 10.2 Monitorização
- Dashboard para acompanhar KPIs
- Alertas de documentos a vencer
- Relatórios de conformidade

### 10.3 Manutenção
- Backup diário de `toknow.db`
- Limpeza de ficheiros em `uploads/`
- Atualização de dependências via `npm update`