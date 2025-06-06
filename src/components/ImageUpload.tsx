
import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  selectedImage: File | null;
  isProcessing: boolean;
}

const ImageUpload = ({ onFileSelect, selectedImage, isProcessing }: ImageUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(file => file.type.startsWith('image/'));
      
      if (imageFile) {
        onFileSelect(imageFile);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isProcessing
            ? "border-gray-600 bg-gray-800/30"
            : "border-gray-600 hover:border-blue-500 bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            isProcessing ? "bg-gray-700" : "bg-slate-600"
          }`}>
            <Upload className={`w-8 h-8 ${isProcessing ? "text-gray-400" : "text-gray-300"}`} />
          </div>
          
          <div>
            <p className={`text-lg font-medium ${isProcessing ? "text-gray-400" : "text-gray-200"}`}>
              {isProcessing ? "Processing..." : "Drop your photo here"}
            </p>
            <p className={`text-sm ${isProcessing ? "text-gray-500" : "text-gray-400"}`}>
              or click to browse (JPG, PNG)
            </p>
          </div>
        </div>
      </div>

      {/* Image Preview */}
      {selectedImage && (
        <Card className="p-4 bg-slate-700/30 border-slate-600">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
              {selectedImage ? (
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{selectedImage.name}</p>
              <p className="text-gray-400 text-sm">
                {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            
            <div className="text-green-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImageUpload;
