import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Định nghĩa interface cho particle
interface WindParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

import { type LayerType } from './WeatherLayerControl';

interface WindyLayerProps {
  activeLayer: LayerType;
  onHover: (value: any) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

const WindyLayer = ({ activeLayer }: WindyLayerProps) => {
  const map = useMap();

  useEffect(() => {
    if (activeLayer !== 'wind') return;
    // Tạo custom overlay class
    class WindOverlay extends L.Layer {
      private _container: HTMLCanvasElement | null = null;
      private _ctx: CanvasRenderingContext2D | null = null;
      private _particles: WindParticle[] = [];
      private _animationId: number | null = null;

      onAdd(map: L.Map): this {
        const container = L.DomUtil.create('canvas', 'leaflet-zoom-animated');
        const size = map.getSize();
        container.width = size.x;
        container.height = size.y;
        container.style.position = 'absolute';
        container.style.zIndex = '50';

        this._container = container;
        this._ctx = container.getContext('2d');

        map.getPanes().overlayPane?.appendChild(container);

        // Khởi tạo particles
        this._initParticles();

        map.on('moveend zoom', this._reset, this);
        this._reset();

        return this;
      }

      onRemove(map: L.Map): this {
        if (this._animationId) {
          cancelAnimationFrame(this._animationId);
          this._animationId = null;
        }
        if (this._container) {
          L.DomUtil.remove(this._container);
          this._container = null;
        }
        this._ctx = null;
        map.off('moveend zoom', this._reset, this);
        return this;
      }

      private _reset = (): void => {
        if (!this._container) return;

        // Sử dụng this._map từ lớp cha Leaflet
        const map = this._map as L.Map;
        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._container, topLeft);

        const size = map.getSize();
        this._container.width = size.x;
        this._container.height = size.y;

        this._initParticles();
      }

      private _initParticles(): void {
        if (!this._ctx || !this._container) return;

        const canvas = this._container;
        this._particles = [];

        // Tạo particles với số lượng phù hợp
        const numParticles = Math.min(2000, (canvas.width * canvas.height) / 500);

        for (let i = 0; i < numParticles; i++) {
          this._particles.push(this._createParticle(canvas));
        }

        // Bắt đầu animation nếu chưa có
        if (!this._animationId) {
          this._animate();
        }
      }

      private _createParticle(canvas: HTMLCanvasElement): WindParticle {
        const speed = 0.5 + Math.random() * 2;
        const angle = Math.random() * Math.PI * 2;

        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 50 + Math.random() * 50,
          maxLife: 100 + Math.random() * 50,
          size: 1 + Math.random() * 2
        };
      }

      private _animate = (): void => {
        if (!this._ctx || !this._container) return;

        const ctx = this._ctx;
        const canvas = this._container;

        // Clear canvas với màu trong suốt nhẹ
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        this._particles.forEach((particle: WindParticle) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life--;

          // Thêm nhiễu nhẹ để tạo chuyển động tự nhiên
          particle.vx += (Math.random() - 0.5) * 0.1;
          particle.vy += (Math.random() - 0.5) * 0.1;

          // Giới hạn tốc độ
          const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
          const maxSpeed = 3;
          if (speed > maxSpeed) {
            particle.vx = (particle.vx / speed) * maxSpeed;
            particle.vy = (particle.vy / speed) * maxSpeed;
          }

          // Reset particle nếu ra ngoài hoặc hết life
          if (
            particle.x < -10 ||
            particle.x > canvas.width + 10 ||
            particle.y < -10 ||
            particle.y > canvas.height + 10 ||
            particle.life <= 0
          ) {
            Object.assign(particle, this._createParticle(canvas));
          }

          // Vẽ particle với gradient màu
          const lifeRatio = particle.life / particle.maxLife;
          const alpha = lifeRatio * 0.8;

          // Màu sắc thay đổi theo life (từ trắng sang xanh nhạt)
          const hue = 200 + (1 - lifeRatio) * 40; // 200-240 (xanh nhạt)
          ctx.fillStyle = `hsla(${hue}, 70%, 70%, ${alpha})`;

          // Vẽ particle dạng hình tròn
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();

          // Vẽ đuôi particle
          if (lifeRatio > 0.3) {
            ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
            ctx.stroke();
          }
        });

        // Tiếp tục animation
        if (this._container && this._container.parentNode) {
          this._animationId = requestAnimationFrame(this._animate);
        }
      }
    }

    // Thêm layer vào map
    const windLayer = new WindOverlay();
    map.addLayer(windLayer);

    // Cleanup
    return () => {
      if (windLayer && map.hasLayer(windLayer)) {
        map.removeLayer(windLayer);
      }
    };
  }, [map, activeLayer]);

  return null;
};

export default WindyLayer;