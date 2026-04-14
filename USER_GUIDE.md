# 📘 Manual de Utilização Completo - TOKNOW

Bem-vindo ao **TOKNOW Compliance & Risk Management Sistema**. 
Este manual guia-o exaustivamente pelas diferentes funções da plataforma corporativa – do ecrã de login ao fecho de processos de avaliação de parceiros de negócio.

---

## 1. O Ecrã de Acesso (Login)
Na tela principal encontra um ambiente moderno e corporativo responsável pelo acolhimento fechado do grupo de trabalho:

- **Autenticação**: Insira o seu utilizador (ex: `admin`) e senha. Carregue em *Entrar* do lado direito.
- **Esqueceu a Senha / Criar Conta**: Ao clicar nos acessos em baixo ou subscritos ao login, aparecerão janelas transicionais fluidas. *Atenção:* Sendo um sistema restrito, a criação de contas emite uma submissão pendente de autorização que os Administradores deverão aprovar no interior do sistema, bem como os pedidos de recuperação.

*(A página é protegida com Rate Limiting: errar o Log-in excessivamente levará ao bloqueio temporário por motivos anti-brute force).*

---

## 2. Interface Principal e Painel de Gestão (Dashboard)
Ao entrar, o TOKNOW apresentará a base estatuária de todo o risco processado.

### A Barra Superior (Header)
1. **Menu Hambúrguer (Mobile)**: Caso utilize num ecrã pequeno celular ou tablet, o menu ficará aglomerado e oculto ao lado para desobstruir e não o impedir de trabalhar nas tabelas complexas do dia-a-dia. 
2. **Barra de Pesquisa (Busca Global)**: Escreva acima de 2 letras (ex: "Silva") e verá num dropdown quase imediato todas as empresas ou relatórios emitidos. (Clicar encaminha directamente a página).
3. **Notificações 🔔**: O ícone do sino aponta avisos importantes com badges encarnados vivos quando possui itens não lidos (ex. *"Fatura e Processo Aprovado"*). Tem a capacidade manual de limpar ("Lidas") os alertas. 
4. **O seu Perfil**: Imagem que dá acesso aos menus do modo escuro.

### Os Gráficos Estatísticos (KPIs)
O Dashboard (Painel de Gestão Central) atualiza e constrói dinamicamente:
- **Cartões (Top-Cards)**: Traduzem as realidades mais cruciais (Número atual de Aprovações Pendentes vs Fornecedores Activos e Avaliações estagnadas em risco).
- **Caixa de Selecção Período**: O filtro "Todo o período / Último Trimestre / Mês actual" altera todo o contexto matemático da janela. Re-chama os dados centralmente do servidor. 
- **Scores**: Gráficos complexos dissecam a pontuação das parcerias, gerando Índices com Barras Progressivas Circulares da Performance actual dos Parceiros e transações aprovadas no último ano. 

---

## 3. Gestão Pessoal e Dark Mode

### O Ecrã do Perfil ("Meu Perfil")
No topo do sistema abra o seu perfil e aceda ao **"Meu Perfil"**:
1. Verá o seu Cargo (`Administrator` / `Auditor` / `Manager`) com a letra principal em estandarte.
2. Está livre para alterar o *Nome Completo* de visão interna, o seu Email Base. 
3. Painel adjacente exclusivo para **Modificação Criptográfica da Senha:** exige a senha natuaral e as credenciais novas com segurança (mínimo de 6 caratéres em tempo real).

### Alterador "Modo Escuro" (Dark / Light Mode) 🌗
No menu do utilizador e da engrenagem do topo há um interruptor (toggle). 
Este botão troca instantânea toda a interface corporativa para **Cores Negativas Anti-Fadiga**, alinhando-se a preferência visual sem obrigar à recarregação da plataforma ou quebra técnica nos formulários ou gráficos complexos de React. 

---

## 4. Gestão Rápida de Entidades (Fornecedores e Clientes)
O sistema concentra dois blocos paralelos independentes - Clientes e Fornecedores na barra lateral.

- **Listagem Segura em Tabela**: Desenhado com a técnica moderna adaptativa `overflow-X-auto` não corrói o site em tablets mas deixa o utilizador deslizar caso a tela seja pequena. Apresenta Riscos Gerais via Tags coloridas redondas e o NIF correspondente.
- **Criar NIF's**: Os sub-menus apresentam "Novo Registo". Encontra documentação exaustiva e campos específicos (incluindo upload do PDF central / Certidão Permanente que ficam selados no disco do servidor).
- **Eliminação Restrita (`Trash Icon`)**: Só passível através da modal vermelha de perigo que lhe questiona o re-agendamento e impede os acidentes típicos (`ConfirmModal`).

---

## 5. Workflow Avançado: Processos e Avaliações

O "Coração Auditivo" operado pela framework. 

### A - O Workflow Global (`ProcessWorkflow`)
- Visualize todos os processos recém gerados pela sua equipa. 
- O menu flutuante em cima tem caixas rápidas de selecção que filtram apenas os relatórios *"Pendentes"*, *"Ressalvas"* em tempo imediato. 

### B - O Ecrã de Aprovação (Detail View e Decisão)
Caso abra um processo gerado de Fornecedor:
1. **Menu de Topo Superior**: Identifica a entidade a bold negro intenso, e emite duas portas (*"Submeter"*, ou, se estiver nos estagiados - *"Decidir"*).
2. O botão verde vivo **Decidir** descerra dinamicamente em pop-out nativo os campos essenciais à governação do Director:
   - "Aprovar em conformidade" / "Rejeitar a Emissão"
   - Campo para Condições anexas a anexar à vida da submissão 
   - Prazo Limitador em calendário.
3. No corpo inferior tem a parametrização crua com os multiplicadores de pesos por métricas a avaliar! 

### C - Avaliações Fechadas (Módulo Avaliações)
Apresenta sumários das resoluções consolidadas na vida de uma entidade já com notas de conformidade convertidas (%) e exportação para relatórios base.

---

## 6. Módulos Auxiliares: Relatórios de Integração

1. Ao entrar no Ecrã respectivo "Relatórios", conseguirá ver matrizes de ranking - A Plataforma TOKNOW exibe num palanque consolidado "O Fornecedor Nº 1 vs Nº Excluído".
2. **Exportação Central (`CSV`)**: Qualquer ranking visível suportado ao clique directo e instântâneo gera documentos CSV padronizados compatíveis exaustivamente pelo Microsoft Excel com codificação europeia (`UTF-8 BOM`). Todos os dados partem directamente do ecossistema actual em bruto.

---

## 7. Parametrização Admin (Critérios Custom)

(Visualizações restritas exclusivas apenas à Direção / Papel "Administrator".)

Visite a aba **Configurações**:
- Encontra em tempo real o Quadro Central de *Pesos Exclusivos de Avaliação* da sua empresa e regras de risco.
- **Popup de Gestão**: 
  1. Clique no botão azul "Novo Critério". Surge o Modal de submissões.
  2. Defina `Código` (ex. FINA-001), `Nome`, `Peso Acumulativo de Escalão`, e `Domínio de Intersecção` (É de Homologação? Diligence?).
  3. Ou clique no icon `Lápis` perante os Critérios actuais da sua BD para refazer os valores e readaptá-los aos actuais quadros fiscais, sem necessitar da equipa de devs.

---

## FAQ Rápidas de Operação

**1. O layout está descompensado ou algumas partes não estão a abrir perfeitamente num ecrã do portátil?**  
- O site é totalmente fluído na filosofia `min-w`, no entanto, se os limites do site do browser ou resoluções do seu display não conseguem alocar tabelas imensamente densas (tabelas listativas), passe o dedo ou o cursor sobre a tabela - esta responde ao comando de navegação adaptado que esconde sem descalibrar os dados e menus anexos da esquerda. 

**2. A minha password tem limite ou há impedimento às imagens?**  
- Requer mais de 6 caracteres minimamente. Uploads de PDFs/doc em Entidades são limpas do HDD se apagar a ficha total nativa.

**3. Como reinicio o cache geral das aprovações se estagnar perante o erro do servidor?**
- É impossível uma vez que cada submissão, log-out e exportação obedece puramente do REST Server Nodejs reescrevendo sem localStorage interinos. Reflexão integral do que está perpetuádo no Better-SQLite3 em tempo real. Pressione refrescar `(F5)` para confirmar as contagens absolutas se achar que outra área administrativa aprovou durante o seu percurso a plataforma! 
