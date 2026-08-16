import { useState, useEffect } from 'react';

const NAMES = ['Rahul', 'Amit', 'Priya', 'Sneha', 'Vijay', 'Rohit', 'Anjali', 'Deepak'];
const ACTIONS = ['purchased VIP key', 'added money to wallet', 'won in spin'];

export function LiveNotifications() {
  const [notification, setNotification] = useState({ name: 'Rahul', action: 'purchased VIP key' });

  useEffect(() => {
    const playNotificationSound = () => {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    };

    const interval = setInterval(() => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      setNotification({ name, action });
      playNotificationSound();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-0 w-full flex justify-center z-[9999] pointer-events-none">
      <style>{`
        @keyframes rainbow-text {
          0% { color: #ff0000; }
          14% { color: #ff7f00; }
          28% { color: #ffff00; }
          42% { color: #00ff00; }
          56% { color: #0000ff; }
          70% { color: #4b0082; }
          84% { color: #9400d3; }
          100% { color: #ff0000; }
        }
        .animate-rainbow-text {
          animation: rainbow-text 7s linear infinite;
        }
      `}</style>
      <span className="text-sm font-medium italic tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] animate-rainbow-text">
        {notification.name} {notification.action}
      </span>
    </div>
  );
}
