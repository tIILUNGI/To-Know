import { FileText, Send, ClipboardCheck, Scale, CheckCircle, Bell, BarChart2, RefreshCw } from "lucide-react";

const STEPS = [
  { id: 1, name: "Rascunho", icon: FileText },
  { id: 2, name: "Submetido", icon: Send },
  { id: 3, name: "Validação Documental", icon: ClipboardCheck },
  { id: 4, name: "Avaliação Técnica/Comercial", icon: Scale },
  { id: 5, name: "Em Aprovação", icon: CheckCircle },
  { id: 6, name: "Aprovado/Reprovado", icon: Bell },
  { id: 7, name: "Comunicação do Resultado", icon: BarChart2 },
  { id: 8, name: "Em Monitorização", icon: RefreshCw },
];

interface WorkflowStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  showLabels?: boolean;
}

export default function WorkflowStepper({ currentStep, onStepClick, showLabels = true }: WorkflowStepperProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {STEPS.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const Icon = step.icon;
        
        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div
              className={`flex flex-col items-center cursor-pointer transition-all ${isActive ? "scale-105" : ""}`}
              onClick={() => onStepClick?.(step.id)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                isActive ? "bg-blue-50 border-blue-500 text-blue-600" :
                "bg-gray-50 border-gray-200 text-gray-400"
              }`}>
                <Icon size={18} />
              </div>
              {showLabels && (
                <span className={`text-[10px] font-bold mt-1.5 text-center whitespace-nowrap ${
                  isActive ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-gray-400"
                }`}>
                  {step.name}
                </span>
              )}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 transition-all ${
                isCompleted ? "bg-emerald-500" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}