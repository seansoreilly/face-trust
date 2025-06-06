
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Shield, Sparkles } from "lucide-react";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleFileSelect = (file: File) => {
    setSelectedImage(file);
    setErrorMessage("");
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMessage("Please select an image first");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    // Simulate API call with realistic delay
    try {
      const result = await getTrustScore(selectedImage);
      navigate("/results", { 
        state: { 
          score: result.score,
          label: result.label,
          emoji: result.emoji,
          imageUrl: result.croppedFaceUrl,
          honesty: result.honesty,
          reliability: result.reliability
        }
      });
    } catch (error) {
      setErrorMessage("Failed to analyze image. Please try again.");
      setIsProcessing(false);
    }
  };

  const getTrustScore = (imageFile: File): Promise<{
    score: number;
    label: string;
    emoji: string;
    croppedFaceUrl: string;
    honesty: number;
    reliability: number;
  }> => {
    return new Promise((resolve) => {
      const baseScore = 50;
      const randomAdjustment = Math.floor(Math.random() * 40); // 0–39
      const finalScore = Math.min(baseScore + randomAdjustment, 100);
      
      // Generate sub-metric scores with some variation from the main score
      const honestyVariation = Math.floor(Math.random() * 20) - 10; // -10 to 10
      const reliabilityVariation = Math.floor(Math.random() * 20) - 10; // -10 to 10
      
      const honesty = Math.min(Math.max(finalScore + honestyVariation, 10), 100);
      const reliability = Math.min(Math.max(finalScore + reliabilityVariation, 10), 100);
      
      const getScoreLabel = (score: number) => {
        if (score > 85) return "You appear highly trustworthy and charismatic! Your facial features and expression convey confidence, openness, and authenticity. People are likely to trust you easily on first impressions.";
        if (score > 70) return "You appear trustworthy and approachable. Your facial expression shows signs of openness and reliability. Most people would feel comfortable confiding in you based on first impressions.";
        if (score > 55) return "You appear calm and reliable. Your facial features suggest a balanced personality with moderate levels of openness and conscientiousness.";
        if (score > 40) return "You appear neutral and reserved. Your facial expression doesn't strongly convey either trustworthiness or untrustworthiness. People may need more interaction to form strong trust judgments.";
        return "You appear guarded or cautious. Your facial expression may come across as reserved or serious, which some might interpret as less approachable initially.";
      };

      const getEmoji = (score: number) => {
        if (score > 85) return "🌟";
        if (score > 70) return "😊";
        if (score > 55) return "🙂";
        if (score > 40) return "😐";
        return "🤔";
      };

      setTimeout(() => {
        resolve({
          score: finalScore,
          label: getScoreLabel(finalScore),
          emoji: getEmoji(finalScore),
          croppedFaceUrl: URL.createObjectURL(imageFile),
          honesty,
          reliability
        });
      }, 2500);
    });
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
            How trustworthy is your face? Upload a photo and get an AI-powered trust score based on your facial expression.
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
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Face...
                  </div>
                ) : (
                  "Analyze My Face"
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
              <p className="text-gray-400 text-sm">Your photos are processed securely and not stored</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Instant Results</h3>
              <p className="text-gray-400 text-sm">Get your trust score in seconds with detailed insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
