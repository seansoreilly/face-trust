
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ImageUpload from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

    try {
      const result = await analyzeWithAI(selectedImage);
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
      console.error('Analysis error:', error);
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
    try {
      // Convert image to base64
      const base64Image = await convertToBase64(imageFile);
      
      console.log('Calling analyze-face function with image data...');
      
      const { data, error } = await supabase.functions.invoke('analyze-face', {
        body: { image: base64Image }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Analysis failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response data received from analysis');
      }

      // Validate the response data
      if (typeof data.score !== 'number' || typeof data.honesty !== 'number' || typeof data.reliability !== 'number') {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from analysis service');
      }

      return data;
    } catch (error) {
      console.error('Error in analyzeWithAI:', error);
      throw error;
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        reject(new Error('Failed to read image file'));
      };
    });
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
