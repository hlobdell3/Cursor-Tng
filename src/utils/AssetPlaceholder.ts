/**
 * This utility generates placeholder canvas elements that can be used as temporary
 * assets during development. In a production environment, these would be replaced
 * with actual image and video assets.
 */
export class AssetPlaceholder {
  /**
   * Create a discipline placeholder image
   */
  static createDisciplinePlaceholder(
    discipline: string,
    width: number = 200,
    height: number = 200
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return canvas;
    
    // Set background color based on discipline
    ctx.fillStyle = this.getDisciplineColor(discipline);
    ctx.fillRect(0, 0, width, height);
    
    // Add discipline name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(discipline.toUpperCase(), width / 2, height / 2);
    
    // Add some animation-like elements
    this.drawAnimationElements(ctx, discipline, width, height);
    
    return canvas;
  }
  
  /**
   * Create a spell effect placeholder
   */
  static createSpellEffectPlaceholder(
    spellName: string,
    effectType: 'casting' | 'impact',
    width: number = 200,
    height: number = 200
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return canvas;
    
    // Base style
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, width, height);
    
    // Effect style
    if (effectType === 'casting') {
      // Casting effect - radiating circles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 20 + i * 15, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Impact effect - starburst
      ctx.fillStyle = 'rgba(255, 200, 50, 0.7)';
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const innerRadius = 20;
        const outerRadius = 80;
        
        const xInner = width / 2 + innerRadius * Math.cos(angle);
        const yInner = height / 2 + innerRadius * Math.sin(angle);
        const xOuter = width / 2 + outerRadius * Math.cos(angle);
        const yOuter = height / 2 + outerRadius * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(xOuter, yOuter);
        } else {
          ctx.lineTo(xInner, yInner);
          ctx.lineTo(xOuter, yOuter);
        }
      }
      ctx.fill();
    }
    
    // Add spell name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${spellName} (${effectType})`, width / 2, height / 2);
    
    return canvas;
  }
  
  /**
   * Create a data URL from a canvas for use as a src attribute
   */
  static canvasToDataURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/png');
  }
  
  /**
   * Get a color based on discipline
   */
  private static getDisciplineColor(discipline: string): string {
    const disciplineColors: Record<string, string> = {
      fire: '#FF5722',
      water: '#2196F3',
      air: '#BBDEFB',
      earth: '#795548',
      lightning: '#673AB7',
      shadow: '#424242'
    };
    
    return disciplineColors[discipline.toLowerCase()] || '#9E9E9E';
  }
  
  /**
   * Draw animation elements based on discipline
   */
  private static drawAnimationElements(
    ctx: CanvasRenderingContext2D,
    discipline: string,
    width: number,
    height: number
  ): void {
    const disciplineLower = discipline.toLowerCase();
    
    switch (disciplineLower) {
      case 'fire':
        // Draw flame-like shapes
        ctx.fillStyle = 'rgba(255, 200, 50, 0.7)';
        for (let i = 0; i < 5; i++) {
          const x = width / 2 + (Math.random() - 0.5) * 50;
          const y = height / 2 + (Math.random() - 0.5) * 50;
          this.drawFlame(ctx, x, y, 20 + Math.random() * 20);
        }
        break;
        
      case 'water':
        // Draw wave-like shapes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const y = height / 3 + i * (height / 4);
          this.drawWave(ctx, 0, y, width, 10, 5);
        }
        break;
        
      case 'lightning':
        // Draw lightning bolts
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const startX = width / 2 + (Math.random() - 0.5) * 50;
          const startY = 20;
          this.drawLightning(ctx, startX, startY, width / 2, height - 20);
        }
        break;
        
      case 'earth':
        // Draw rock-like shapes
        ctx.fillStyle = 'rgba(150, 100, 50, 0.7)';
        for (let i = 0; i < 8; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = 10 + Math.random() * 15;
          this.drawRock(ctx, x, y, size);
        }
        break;
        
      case 'air':
        // Draw swirl patterns
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        this.drawSwirl(ctx, width / 2, height / 2, Math.min(width, height) / 3, 3);
        break;
        
      case 'shadow':
        // Draw shadowy tendrils
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          this.drawTendril(ctx, width / 2, height / 2, 30 + Math.random() * 50, angle);
        }
        break;
    }
  }
  
  private static drawFlame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    
    // Left curve
    ctx.quadraticCurveTo(
      x - size / 2, y + size / 2,
      x, y - size / 2
    );
    
    // Right curve
    ctx.quadraticCurveTo(
      x + size / 2, y + size / 2,
      x, y + size
    );
    
    ctx.fill();
  }
  
  private static drawWave(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    width: number,
    amplitude: number,
    frequency: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    for (let x = 0; x < width; x += 5) {
      const y = startY + Math.sin(x * frequency * 0.01) * amplitude;
      ctx.lineTo(startX + x, y);
    }
    
    ctx.stroke();
  }
  
  private static drawLightning(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    const segments = 5 + Math.floor(Math.random() * 3);
    const segmentLength = (endY - startY) / segments;
    
    let currentX = startX;
    let currentY = startY;
    
    for (let i = 0; i < segments; i++) {
      currentY += segmentLength;
      currentX += (Math.random() - 0.5) * 30;
      ctx.lineTo(currentX, currentY);
    }
    
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  
  private static drawRock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    
    // Create an irregular polygon for the rock
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const radius = size / 2 + (Math.random() - 0.5) * (size / 4);
      const pointX = x + Math.cos(angle) * radius;
      const pointY = y + Math.sin(angle) * radius;
      ctx.lineTo(pointX, pointY);
    }
    
    ctx.closePath();
    ctx.fill();
  }
  
  private static drawSwirl(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    turns: number
  ): void {
    ctx.beginPath();
    
    const totalAngle = Math.PI * 2 * turns;
    const points = 100;
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * totalAngle;
      const distance = (i / points) * radius;
      
      const pointX = x + Math.cos(angle) * distance;
      const pointY = y + Math.sin(angle) * distance;
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    
    ctx.stroke();
  }
  
  private static drawTendril(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    length: number,
    angle: number
  ): void {
    ctx.beginPath();
    
    const startX = x;
    const startY = y;
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;
    
    // Control points for the curve
    const cp1x = x + Math.cos(angle + 0.5) * (length / 3);
    const cp1y = y + Math.sin(angle + 0.5) * (length / 3);
    const cp2x = x + Math.cos(angle - 0.5) * (length * 2 / 3);
    const cp2y = y + Math.sin(angle - 0.5) * (length * 2 / 3);
    
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Add some smaller tendrils
    if (length > 20) {
      this.drawTendril(
        ctx,
        cp1x, cp1y,
        length / 3,
        angle + Math.PI / 4
      );
      this.drawTendril(
        ctx,
        cp2x, cp2y,
        length / 3,
        angle - Math.PI / 4
      );
    }
  }
} 