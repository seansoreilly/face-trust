
import { useEffect, useState } from "react";
import { getScoreHexColor } from "@/lib/scoring";

interface ScoreMeterProps {
  score: number;
}

const ScoreMeter = ({ score }: ScoreMeterProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 800);

    return () => clearTimeout(timer);
  }, [score]);

  const radius = 80;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#374151"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          
          {/* Progress circle */}
          <circle
            stroke={getScoreHexColor(animatedScore)}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 2s ease-in-out, stroke 0.5s ease'
            }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        
        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {Math.round(animatedScore)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScoreMeter;
