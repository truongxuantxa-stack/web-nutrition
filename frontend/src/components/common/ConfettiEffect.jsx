import { useEffect, useRef } from 'react';

/**
 * ConfettiEffect — Hiệu ứng confetti CSS animation thuần khi đóng góp thành công.
 * Tự cleanup sau khi animation kết thúc.
 * Không cần thư viện ngoài.
 */
export default function ConfettiEffect() {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const colors = ['#4ade80', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa', '#34d399'];
        const count = 60;
        const pieces = [];

        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 4; // 4-12px
            const left = Math.random() * 100; // 0-100%
            const delay = Math.random() * 0.8; // 0-0.8s
            const duration = Math.random() * 1.5 + 1.5; // 1.5-3s
            const rotate = Math.random() * 720 - 360;

            el.style.cssText = `
                position: absolute;
                top: -20px;
                left: ${left}%;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                animation: confetti-fall ${duration}s ease-in ${delay}s forwards;
                transform: rotate(0deg);
                opacity: 1;
                pointer-events: none;
            `;
            container.appendChild(el);
            pieces.push(el);
        }

        // Inject keyframes vào document nếu chưa có
        const styleId = 'confetti-keyframes';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes confetti-fall {
                    0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(300px) rotate(720deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // Cleanup sau 4s
        const timer = setTimeout(() => {
            pieces.forEach(p => p.remove());
        }, 4000);

        return () => {
            clearTimeout(timer);
            pieces.forEach(p => p.remove());
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ zIndex: 50 }}
        />
    );
}
