
import { useCallback, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  selectedImage: File | null;
  isProcessing: boolean;
}

const ImageUpload = ({ onFileSelect, selectedImage, isProcessing }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const { toast } = useToast();

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find(file => file.type.startsWith('image/'));

      if (imageFile) {
        onFileSelect(imageFile);
      } else if (files.length > 0) {
        toast({
          title: "That doesn't look like an image",
          description: "Please drop a JPEG or PNG photo.",
          variant: "destructive",
        });
      }
    },
    [onFileSelect, toast]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "That doesn't look like an image",
        description: "Please choose a JPEG or PNG photo.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 motion-reduce:transition-none motion-reduce:scale-100 ${
          isProcessing
            ? "border-gray-600 bg-gray-800/30"
            : isDragging
            ? "border-solid border-blue-400 bg-blue-500/10 scale-[1.02]"
            : "border-gray-600 hover:border-blue-500 bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          disabled={isProcessing}
          aria-label="Upload a photo for face trust analysis"
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
              {isProcessing ? "Processing..." : isDragging ? "Drop it here" : "Drop your photo here"}
            </p>
            <p className={`text-sm ${isProcessing ? "text-gray-500" : "text-gray-400"}`}>
              or click to browse (JPG, PNG)
            </p>
          </div>
        </div>
      </div>

      {/* Mobile camera capture */}
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileInput}
          disabled={isProcessing}
          aria-label="Take a selfie for face trust analysis"
          id="camera-capture-input"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <label
          htmlFor="camera-capture-input"
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            isProcessing
              ? "border-gray-700 text-gray-500 cursor-not-allowed"
              : "border-slate-600 text-gray-300 hover:border-blue-500 hover:text-white cursor-pointer"
          }`}
        >
          <Camera className="w-4 h-4" />
          Take a selfie
        </label>
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
