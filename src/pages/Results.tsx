
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ScoreMeter from "@/components/ScoreMeter";
import { ArrowLeft, RotateCcw, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ResultState {
  score: number;
  label: string;
  emoji: string;
  imageUrl: string;
  honesty: number;
  reliability: number;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showScore, setShowScore] = useState(false);
  
  const state = location.state as ResultState;

  useEffect(() => {
    if (!state) {
      navigate("/");
      return;
    }
    
    // Animate score reveal
    const timer = setTimeout(() => {
      setShowScore(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const handleRetry = () => {
    navigate("/");
  };

  const getScoreColor = (score: number) => {
    if (score > 80) return "from-green-400 to-emerald-500";
    if (score > 60) return "from-blue-400 to-cyan-500";
    if (score > 40) return "from-yellow-400 to-orange-500";
    return "from-red-400 to-pink-500";
  };

  const getScoreCategory = (score: number) => {
    if (score > 85) return "Highly Trustworthy";
    if (score > 70) return "Very Trustworthy";
    if (score > 55) return "Trustworthy";
    if (score > 40) return "Neutral";
    return "Guarded";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="text-gray-300 hover:text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Trust Score Results
          </h1>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Face Image */}
          <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-700 mb-4">
              <img
                src={state.imageUrl}
                alt="Analyzed face"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-center">
              <p className="text-gray-300 text-sm">Analyzed Photo</p>
            </div>
          </Card>

          {/* Score Results */}
          <div className="space-y-6">
            {/* Score Display */}
            <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm text-center">
              <div className="mb-6">
                <div className={`text-6xl mb-2 transition-all duration-1000 ${showScore ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                  {state.emoji}
                </div>
                
                <div className={`transition-all duration-1000 delay-300 ${showScore ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                  <div className={`text-6xl font-bold bg-gradient-to-r ${getScoreColor(state.score)} bg-clip-text text-transparent mb-2`}>
                    {showScore ? state.score : 0}
                  </div>
                  <div className="text-gray-400 text-sm mb-1">out of 100</div>
                  <div className={`text-xl font-semibold bg-gradient-to-r ${getScoreColor(state.score)} bg-clip-text text-transparent`}>
                    {getScoreCategory(state.score)}
                  </div>
                </div>
              </div>

              <ScoreMeter score={showScore ? state.score : 0} />
            </Card>

            {/* Sub-metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Honesty Sub-metric */}
              <Card className="p-5 bg-slate-800/50 border-slate-700 backdrop-blur-sm text-center">
                <h3 className="text-md font-medium text-gray-300 mb-2">Honesty</h3>
                <div className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(state.honesty)} bg-clip-text text-transparent mb-2 transition-all duration-1000 ${showScore ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                  {showScore ? state.honesty : 0}
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
                  <div 
                    className={`h-2 rounded-full transition-all duration-2000 ease-out bg-gradient-to-r ${getScoreColor(state.honesty)}`} 
                    style={{ width: showScore ? `${state.honesty}%` : '0%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Perceived truthfulness</p>
              </Card>

              {/* Reliability Sub-metric */}
              <Card className="p-5 bg-slate-800/50 border-slate-700 backdrop-blur-sm text-center">
                <h3 className="text-md font-medium text-gray-300 mb-2">Reliability</h3>
                <div className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(state.reliability)} bg-clip-text text-transparent mb-2 transition-all duration-1000 ${showScore ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                  {showScore ? state.reliability : 0}
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-1">
                  <div 
                    className={`h-2 rounded-full transition-all duration-2000 ease-out bg-gradient-to-r ${getScoreColor(state.reliability)}`} 
                    style={{ width: showScore ? `${state.reliability}%` : '0%' }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Perceived dependability</p>
              </Card>
            </div>

            {/* Score Description */}
            <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-3">Analysis</h3>
              <p className="text-gray-300 leading-relaxed">
                {state.label}
              </p>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleRetry}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Analyze Another Photo
              </Button>
              
              <Button
                variant="outline"
                className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <Card className="mt-12 max-w-4xl mx-auto p-6 bg-slate-800/30 border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">💡 Tips for Better Scores</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">Facial Expression</h4>
              <ul className="space-y-1">
                <li>• Relaxed, genuine smile</li>
                <li>• Open, confident posture</li>
                <li>• Direct eye contact with camera</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Photo Quality</h4>
              <ul className="space-y-1">
                <li>• Good lighting on face</li>
                <li>• Clear, high-resolution image</li>
                <li>• Face centered and unobstructed</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Results;
