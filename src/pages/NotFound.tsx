import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Disclaimer from "@/components/Disclaimer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          FaceTrust
        </span>
      </div>

      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-gray-300 mb-8">
          This face isn't one we recognize. The page you're looking for doesn't exist.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <a href="/">Return to Home</a>
        </Button>
      </div>

      <Disclaimer />
    </div>
  );
};

export default NotFound;
