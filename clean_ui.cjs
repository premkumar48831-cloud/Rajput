const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove all backdrop-blur classes completely
content = content.replace(/backdrop-blur-([a-zA-Z0-9\[\]\-]+)/g, '');

// 2. Make the panel boxes completely transparent
content = content.replace(/bg-white\/5 hover:bg-white\/5/g, 'bg-transparent');
content = content.replace(/bg-black\/20 hover:bg-black\/15/g, 'bg-transparent');
content = content.replace(/bg-black\/30 hover:bg-white\/5/g, 'bg-transparent hover:bg-white/5');
content = content.replace(/bg-black\/[0-9]+/g, 'bg-transparent'); // Strip out some heavy dark boxes
content = content.replace(/bg-white\/[0-9]+/g, 'bg-transparent'); // Strip out all white translucent boxes for maximum clarity

// 3. 3-dots Menu Button - Make it Satorang
content = content.replace(/<Menu\s+size=\{22\}\s+className="text-white drop-shadow-\[0_0_8px_rgba\(255,255,255,0\.6\)\]"\s*\/>/g, `<Menu size={26} className="text-white drop-shadow-[0_0_10px_#fff]" />`);
content = content.replace(/onClick=\{\(\) => setIsMenuOpen\(true\)\}\s+className="p-1\.5 hover:bg-transparent rounded-lg transition-colors active:scale-95 bg-transparent  border border-transparent"/g, `onClick={() => setIsMenuOpen(true)} className="p-1.5 rounded-lg transition-colors active:scale-95 bg-transparent border-2 animate-satorang-border hover:scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]"`);

// Let's refine how we replace the Menu button
content = content.replace(/onClick=\{\(\) => setIsMenuOpen\(true\)\}\s+className="([^"]+)"/, 'onClick={() => setIsMenuOpen(true)}\n                className="p-1.5 rounded-xl transition-all active:scale-95 bg-transparent border-[3px] animate-satorang-border hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]"');


fs.writeFileSync('src/App.tsx', content);
console.log("Cleaned up UI!");
