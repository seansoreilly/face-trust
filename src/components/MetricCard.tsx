import { Card } from "@/components/ui/card";
import { getScoreColor } from "@/lib/scoring";

interface MetricCardProps {
  label: string;
  value: number;
  description: string;
  show: boolean;
  delayClassName?: string;
}

const MetricCard = ({ label, value, description, show, delayClassName = "" }: MetricCardProps) => {
  return (
    <Card className="p-5 bg-slate-800/50 border-slate-700 backdrop-blur-sm text-center">
      <h3 className="text-md font-medium text-gray-300 mb-2">{label}</h3>
      <div
        className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(value)} bg-clip-text text-transparent mb-2 transition-all duration-1000 motion-reduce:transition-none motion-reduce:duration-0 ${delayClassName} ${show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
      >
        {show ? value : 0}
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full transition-all duration-2000 ease-out motion-reduce:transition-none motion-reduce:duration-0 bg-gradient-to-r ${getScoreColor(value)}`}
          style={{ width: show ? `${value}%` : '0%' }}
        ></div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </Card>
  );
};

export default MetricCard;
