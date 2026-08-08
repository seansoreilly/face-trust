
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Shield, Sparkles } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { prepareImage } from "@/utils/prepareImage";
import { env } from "@/lib/env";

const ANALYSIS_STATUS_MESSAGES = [
  "Measuring zygomatic activation…",
  "Checking micro-expressions…",
  "Evaluating gaze steadiness…",
  "Mapping facial symmetry…",
  "Reading eyebrow tension…",
  "Cross-referencing smile authenticity…",
];

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusIndex, setStatusIndex] = useState(0);
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (!isProcessing) {
      setStatusIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % ANALYSIS_STATUS_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleFileSelect = (file: File) => {
    setSelectedImage(file);
    setErrorMessage("");

    // Track file selection
    trackEvent({
      action: 'file_selected',
      category: 'face_analysis',
      label: file.type
    });
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMessage("Please select an image first");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    // Track analysis start
    trackEvent({
      action: 'analysis_started',
      category: 'face_analysis'
    });

    try {
      const result = await analyzeWithAI(selectedImage);

      // Track successful analysis
      trackEvent({
        action: 'analysis_completed',
        category: 'face_analysis',
        value: result.score
      });

      navigate("/results", {
        state: {
          score: result.score,
          label: result.explanation,
          emoji: getEmoji(result.score),
          imageUrl: URL.createObjectURL(selectedImage),
          honesty: result.honesty,
          reliability: result.reliability
        }
      });
    } catch (error) {
      if (env.DEBUG) {
        console.error('Analysis error:', error);
      }

      // Track analysis error
      trackEvent({
        action: 'analysis_error',
        category: 'face_analysis',
        label: error instanceof Error ? error.message : 'Unknown error'
      });

      setErrorMessage(error instanceof Error ? error.message : "Failed to analyze image. Please try again.");
      setIsProcessing(false);
    }
  };

  const analyzeWithAI = async (imageFile: File): Promise<{
    score: number;
    honesty: number;
    reliability: number;
    explanation: string;
  }> => {
    // Downscale + validate the image client-side before sending it on.
    const base64Image = await prepareImage(imageFile);

    const response = await fetch('/api/analyze-face', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data || typeof data.score !== 'number') {
      throw new Error('Invalid response format from analysis service');
    }

    if (data.degraded === true) {
      throw new Error("Analysis couldn't complete this time. Please try again.");
    }

    return {
      score: data.score,
      honesty: data.honesty,
      reliability: data.reliability,
      explanation: data.explanation
    };
  };

  const getEmoji = (score: number) => {
    if (score > 85) return "🌟";
    if (score > 70) return "😊";
    if (score > 55) return "🙂";
    if (score > 40) return "😐";
    return "🤔";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              FaceTrust
            </h1>
          </div>
          
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            How trustworthy does this face look? Upload a photo and get an AI-powered trust score.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Powered</span>
            </div>
          </div>
        </div>

        {/* Main Upload Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <ImageUpload
              onFileSelect={handleFileSelect}
              selectedImage={selectedImage}
              isProcessing={isProcessing}
            />
            
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{errorMessage}</p>
                <Button
                  onClick={handleAnalyze}
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                >
                  Try Again
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Button
                onClick={handleAnalyze}
                disabled={!selectedImage || isProcessing}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold transition-all duration-200 hover:scale-105"
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin motion-reduce:animate-none" />
                      Analyzing Face...
                    </div>
                    <span className="text-xs font-normal text-white/70 motion-reduce:transition-none transition-opacity duration-300">
                      {ANALYSIS_STATUS_MESSAGES[statusIndex]}
                    </span>
                  </div>
                ) : (
                  "Analyze This Face"
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
              <p className="text-gray-400 text-sm">Advanced facial expression analysis using machine learning</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
              <p className="text-gray-400 text-sm">Photos are processed securely and not stored</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Instant Results</h3>
              <p className="text-gray-400 text-sm">Get trust scores in seconds with detailed insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
