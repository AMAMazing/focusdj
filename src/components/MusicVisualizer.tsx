import React, { useEffect, useRef } from 'react';

export const MusicVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 50;
    const barWidth = canvas.width / bars;
    
    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < bars; i++) {
        const height = Math.random() * 50;
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - height);
        gradient.addColorStop(0, '#1DB954');
        gradient.addColorStop(1, '#1ed760');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          i * barWidth,
          canvas.height - height,
          barWidth - 2,
          height
        );
      }
      
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={60}
      className="mx-auto"
    />
  );
};