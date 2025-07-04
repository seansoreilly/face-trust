import { SITE_URL } from '@/lib/env';

interface ShareImageOptions {
  imageUrl: string;
  score: number;
  honesty: number;
  reliability: number;
  label: string;
  emoji: string;
}

export const generateShareImage = async (options: ShareImageOptions): Promise<Blob> => {
  const { imageUrl, score, honesty, reliability, label, emoji } = options;
  
  console.log('Generating share image with site URL:', SITE_URL);
  console.log('Image URL:', imageUrl);
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  
  // Calculate text height needed
  const calculateTextLines = (text: string, maxWidth: number, ctx: CanvasRenderingContext2D): number => {
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && line !== '') {
        lineCount++;
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) lineCount++; // Add the last line
    return lineCount;
  };
  
  // Calculate required width for text, then set canvas dimensions
  ctx.font = '22px Arial';
  const textMetrics = ctx.measureText(label);
  const maxTextWidth = Math.max(textMetrics.width, 800); // Minimum 800px width
  
  // Set canvas size with fixed height, variable width
  canvas.width = Math.min(Math.max(maxTextWidth + 200, 1080), 1400); // Between 1080-1400px width
  canvas.height = 1350;
  
  // Load and draw background
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      try {
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#581c87');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw user image (circular) with proper aspect ratio
        const imageSize = 380;
        const imageX = (canvas.width - imageSize) / 2;
        const imageY = 130;
        
        // Calculate aspect ratio and proper dimensions
        const imgAspect = img.width / img.height;
        console.log('Image dimensions:', img.width, 'x', img.height, 'aspect ratio:', imgAspect);
        
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let sourceX = 0;
        let sourceY = 0;
        
        // Crop to square (center crop)
        if (imgAspect > 1) {
          // Wide image - crop width
          sourceWidth = img.height;
          sourceX = (img.width - img.height) / 2;
        } else if (imgAspect < 1) {
          // Tall image - crop height
          sourceHeight = img.width;
          sourceY = (img.height - img.width) / 2;
        }
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(imageX + imageSize/2, imageY + imageSize/2, imageSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, imageX, imageY, imageSize, imageSize);
        ctx.restore();
        
        // Draw circular border
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(imageX + imageSize/2, imageY + imageSize/2, imageSize/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw site URL at top
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(SITE_URL, canvas.width / 2, 50);
        
        // Draw title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Face Trust Analysis', canvas.width / 2, 100);
        
        // Draw emoji
        ctx.font = '80px Arial';
        ctx.fillText(emoji, canvas.width / 2, 580);
        
        // Draw main score
        ctx.fillStyle = getScoreColor(score);
        ctx.font = 'bold 96px Arial';
        ctx.fillText(score.toString(), canvas.width / 2, 680);
        
        // Draw "out of 100"
        ctx.fillStyle = '#9ca3af';
        ctx.font = '28px Arial';
        ctx.fillText('out of 100', canvas.width / 2, 720);
        
        // Draw score category
        ctx.fillStyle = getScoreColor(score);
        ctx.font = 'bold 36px Arial';
        ctx.fillText(getScoreCategory(score), canvas.width / 2, 770);
        
        // Draw sub-metrics
        const metricsY = 840;
        const metricWidth = 400;
        const metricSpacing = 280;
        
        // Honesty
        drawMetric(ctx, 'Honesty', honesty, canvas.width / 2 - metricSpacing / 2, metricsY, metricWidth);
        
        // Reliability
        drawMetric(ctx, 'Reliability', reliability, canvas.width / 2 + metricSpacing / 2, metricsY, metricWidth);
        
        // Draw label (description) - fit within fixed height with variable width
        ctx.fillStyle = '#d1d5db';
        ctx.font = '22px Arial';
        ctx.textAlign = 'center';
        
        const words = label.split(' ');
        let line = '';
        let lineY = 980;
        const lineHeight = 30;
        const maxLineWidth = canvas.width - 100; // Use dynamic width with padding
        
        for (const word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          // Check if we have space for another line
          if (lineY + lineHeight > 1280) break; // Leave space for watermark
          
          if (testWidth > maxLineWidth && line !== '') {
            ctx.fillText(line, canvas.width / 2, lineY);
            line = word + ' ';
            lineY += lineHeight;
          } else {
            line = testLine;
          }
        }
        
        // Draw the last line if there's space
        if (lineY <= 1280) {
          ctx.fillText(line, canvas.width / 2, lineY);
        }
        
        // Draw watermark with site URL at fixed position
        ctx.fillStyle = '#64748b';
        ctx.font = '20px Arial';
        ctx.fillText(SITE_URL, canvas.width / 2, 1310); // Fixed position near bottom
        console.log('Added watermark with site URL:', SITE_URL);
        console.log('Canvas dimensions (variable width):', canvas.width, 'x', canvas.height);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate image'));
          }
        }, 'image/png');
        
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

const getScoreColor = (score: number): string => {
  if (score > 80) return '#10b981';
  if (score > 60) return '#06b6d4';
  if (score > 40) return '#f59e0b';
  return '#ef4444';
};

const getScoreCategory = (score: number): string => {
  if (score > 85) return 'Highly Trustworthy';
  if (score > 70) return 'Very Trustworthy';
  if (score > 55) return 'Trustworthy';
  if (score > 40) return 'Neutral';
  return 'Guarded';
};

const drawMetric = (
  ctx: CanvasRenderingContext2D,
  name: string,
  value: number,
  x: number,
  y: number,
  width: number
) => {
  // Draw metric name
  ctx.fillStyle = '#d1d5db';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y);
  
  // Draw metric value
  ctx.fillStyle = getScoreColor(value);
  ctx.font = 'bold 42px Arial';
  ctx.fillText(value.toString(), x, y + 50);
  
  // Draw progress bar
  const barWidth = width * 0.8;
  const barHeight = 12;
  const barX = x - barWidth / 2;
  const barY = y + 70;
  
  // Background bar
  ctx.fillStyle = '#374151';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Progress bar
  ctx.fillStyle = getScoreColor(value);
  ctx.fillRect(barX, barY, (barWidth * value) / 100, barHeight);
};