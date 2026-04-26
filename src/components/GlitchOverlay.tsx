import * as React from 'react';
import { useEffect, useRef } from 'react';

interface GlitchOverlayProps {
  active: boolean;
  intensity?: number;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ active, intensity = 0.3 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    
    const render = () => {
      const w = canvas.width = window.innerWidth;
      const h = canvas.height = window.innerHeight;
      
      ctx.clearRect(0, 0, w, h);

      if (Math.random() < intensity) {
        // Horizontal slice displacement
        const y = Math.random() * h;
        const sliceH = Math.random() * 50 + 10;
        const xOffset = (Math.random() - 0.5) * 100 * intensity;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${0.1 * intensity})`;
        ctx.fillRect(0, y, w, sliceH);
        
        // Random digital blocks
        if (Math.random() < 0.2) {
           ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 255, 0.2)' : 'rgba(0, 255, 0, 0.2)';
           ctx.fillRect(Math.random() * w, Math.random() * h, 50 * intensity, 10);
        }
      }

      // Static noise burst
      if (Math.random() < 0.05 * intensity) {
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
          ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 200, 1);
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [active, intensity]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[600] mix-blend-screen opacity-40"
    />
  );
};
