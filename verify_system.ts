import axios from "axios";

const API_URL = "http://localhost:3000/api";

async function runTests() {
  console.log("🚀 Iniciando Testes do Sistema TOKNOW...");

  try {
    // 1. LOGIN
    console.log("\n1. Testando Login...");
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      username: "admin",
      password: "admin123"
    });
    const token = loginRes.data.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log("✅ Login realizado com sucesso.");

    // 2. CREATE ENTITY
    console.log("\n2. Criando novo Fornecedor...");
    const entityRes = await axios.post(`${API_URL}/entities`, {
      name: "Fornecedor Beta",
      entity_type: "Supplier",
      tax_id: "500123456",
      status: "In Analysis"
    }, authHeaders);
    const entityId = entityRes.data.id;
    console.log(`✅ Fornecedor criado com ID: ${entityId}`);

    // 3. START PROCESS
    console.log("\n3. Iniciando Processo de Aprovação...");
    const processRes = await axios.post(`${API_URL}/processes`, {
      entity_id: entityId,
      type: "Approval",
      priority: "High",
      area: "Compras",
      justification: "Novo parceiro estratégico"
    }, authHeaders);
    const processId = processRes.data.id;
    console.log(`✅ Processo criado: ${processRes.data.process_number}`);

    // 4. SCORE CRITERIA
    console.log("\n4. Atribuindo pontuação aos critérios...");
    const processDetails = await axios.get(`${API_URL}/processes/${processId}`, authHeaders);
    const criteria = processDetails.data.criteria;
    const scores = criteria.map(c => ({
      criteria_id: c.criteria_id,
      score: 8,
      evidence: "Documentação validada",
      comments: "Atende aos requisitos"
    }));
    
    await axios.put(`${API_URL}/processes/${processId}/score`, { scores }, authHeaders);
    console.log("✅ Critérios pontuados.");

    // 5. SUBMIT EVALUATION
    console.log("\n5. Enviando avaliação de performance...");
    const evalRes = await axios.post(`${API_URL}/evaluations`, {
      entity_id: entityId,
      type: "Performance",
      period: "2024.01",
      responses: [
        { criterion_name: "Qualidade", score: 4, group_name: "Geral" },
        { criterion_name: "Prazo", score: 5, group_name: "Geral" }
      ]
    }, authHeaders);
    console.log(`✅ Avaliação concluída com classification: ${evalRes.data.classification}`);

    // 6. DASHBOARD
    console.log("\n6. Verificando Dashboard...");
    const dashRes = await axios.get(`${API_URL}/reports/dashboard`, authHeaders);
    console.log(`✅ Dashboard carregado. Total de fornecedores: ${dashRes.data.totals.suppliers.count}`);

    console.log("\n✨ TODOS OS TESTES PASSARAM COM SUCESSO!");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ ERRO NOS TESTES:");
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
