import { useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { 
  Mail, Download, Printer, CheckCircle2, 
  TrendingUp, Users, User, ShieldCheck
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Section = {
  key: string;
  title: string;
  description: string;
};

type SubmissionDetail = {
  submission: {
    token: string;
    employee_name: string;
    employee_email?: string | null;
    recipient_email?: string | null;
    percentage: number;
    classification: string;
    used_at?: string | null;
    manager_score?: number | null;
    manager_comment?: string | null;
  };
  sections: Section[];
  scale: { value: number; label: string }[];
  responses: Array<{
    question_id: number;
    question_text: string;
    score: number;
    section_key: string;
    peer_name?: string | null;
  }>;
};

export default function Evaluation360Dashboard({ detail }: { detail: SubmissionDetail }) {
  const { submission, sections, responses } = detail;

  const sectionAverages = useMemo(() => {
    return sections.map(section => {
      const sectionResponses = responses.filter(r => r.section_key === section.key);
      const avg = sectionResponses.length > 0 
        ? sectionResponses.reduce((sum, r) => sum + r.score, 0) / sectionResponses.length
        : 0;
      return {
        key: section.key,
        title: section.title,
        avg: Number(avg.toFixed(2))
      };
    });
  }, [sections, responses]);

  const chartData = useMemo(() => {
    const keys = ['self', 'peer', 'manager', 'manager_eval'];
    return keys.map((key, i) => {
      const avg = sectionAverages.find(s => s.key === key)?.avg || 0;
      const title = sections.find(s => s.key === key)?.title || `Parte ${i+1}`;
      return {
        name: key === 'self' ? 'P1' : key === 'peer' ? 'P2' : key === 'manager' ? 'P3' : 'P4',
        fullName: title,
        score: avg
      };
    });
  }, [sectionAverages, sections]);

  const overallAvg = (sectionAverages.reduce((sum, s) => sum + s.avg, 0) / sectionAverages.length).toFixed(2);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Relatório de Avaliação 360° - ${submission.employee_name}`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Pontuação Geral: ${overallAvg} de 5.00`, 20, 35);
    doc.text(`Classificação: ${submission.classification}`, 20, 42);

    const tableData = responses.map(r => [
      r.section_key,
      r.question_text,
      r.score,
      r.peer_name || ""
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Seção', 'Pergunta', 'Nota', 'Detalhe']],
      body: tableData,
    });

    doc.save(`Avaliacao_360_${submission.employee_name}.pdf`);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Relatório de Avaliação 360° - ${submission.employee_name}`);
    const body = encodeURIComponent(
      `Olá,\n\nSegue em anexo o relatório de avaliação 360° de ${submission.employee_name}.\n\nPontuação Geral: ${overallAvg} de 5.00\nClassificação: ${submission.classification}\n\nAtenciosamente.`
    );
    window.location.href = `mailto:${submission.employee_email || submission.recipient_email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#fdfaf4] p-6 rounded-3xl border border-[#eadfcd]">
        <div>
          <h2 className="text-xl font-bold text-[#5e4428] flex items-center gap-2">
            <TrendingUp size={24} className="text-[#a17e58]" />
            Dashboard Final - Avaliação 360°
          </h2>
          <p className="text-sm text-[#8a6b49] mt-1">
            {submission.employee_name} ({submission.employee_email || submission.recipient_email})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSendEmail}
            className="btn bg-white border-[#eadfcd] text-[#5e4428] hover:bg-[#fbf7ef] flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            <Mail size={16} /> Enviar por Email
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="btn bg-[#a17e58] text-white hover:bg-[#8a6b49] flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl"
          >
            <Download size={16} /> Baixar PDF
          </button>
        </div>
      </div>

      {/* Main Score */}
      <div className="bg-[#fdfaf4] p-8 rounded-3xl border border-[#eadfcd] text-center">
        <p className="text-sm font-bold text-[#8a6b49] uppercase tracking-widest mb-2">Pontuação Geral</p>
        <div className="flex flex-col items-center">
          <span className="text-7xl font-black text-[#5e4428]">{overallAvg}</span>
          <span className="text-[#8a6b49] text-lg font-medium">de 5.00</span>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
          <CheckCircle2 size={16} /> {submission.classification}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card p-6 bg-white border-[#eadfcd]">
          <h3 className="text-sm font-bold text-[#5e4428] mb-6 uppercase tracking-wider">Comparação por Seção</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8a6b49', fontSize: 12}} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#8a6b49', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#fbf7ef'}} 
                  contentStyle={{borderRadius: '12px', border: '1px solid #eadfcd', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="score" fill="#a17e58" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="card p-6 bg-white border-[#eadfcd]">
          <h3 className="text-sm font-bold text-[#5e4428] mb-6 uppercase tracking-wider">Visão Radar</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="fullName" tick={{fill: '#8a6b49', fontSize: 10}} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name="Pontuação"
                  dataKey="score"
                  stroke="#a17e58"
                  fill="#a17e58"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section Scores Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sectionAverages.map((s, idx) => (
          <div key={s.key} className="card p-4 bg-white border-[#eadfcd] text-center hover:bg-[#fbf7ef] transition-colors">
            <p className="text-[10px] font-bold text-[#8a6b49] uppercase mb-1">Parte {idx + 1}</p>
            <p className="text-2xl font-black text-[#5e4428]">{s.avg.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Details Accordion Placeholder */}
      <div className="card border-[#eadfcd] bg-white overflow-hidden">
        <div className="p-4 bg-[#fbf7ef] border-b border-[#eadfcd]">
          <h3 className="text-sm font-bold text-[#5e4428]">Pré-visualização das Respostas</h3>
        </div>
        <div className="p-4 space-y-8">
          {sections.map(section => (
            <div key={section.key} className="space-y-4">
              <h4 className="text-sm font-bold text-[#a17e58] border-l-4 border-[#a17e58] pl-3">
                {section.title}
              </h4>
              <div className="space-y-3">
                {responses.filter(r => r.section_key === section.key).map((r, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-end gap-4">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {idx + 1}. {r.question_text}
                      </p>
                      <span className="text-xs font-bold text-[#a17e58] whitespace-nowrap">
                        {r.score === 1 ? 'Discordo Totalmente' : r.score === 2 ? 'Discordo' : r.score === 3 ? 'Neutro' : r.score === 4 ? 'Concordo' : 'Concordo Totalmente'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#a17e58] rounded-full" 
                        style={{ width: `${(r.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
