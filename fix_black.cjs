const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Modals and solid black colors
content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-white/10 backdrop-blur-2xl');
content = content.replace(/bg-\[#1a1a1a\]/g, 'bg-white/5 backdrop-blur-md');
content = content.replace(/bg-\[#090c16\]\/95/g, 'bg-white/10 backdrop-blur-2xl');

// Translucent black classes (UI elements)
// Careful with bg-black/60 and bg-black/80 which are used for screen overlays.
// Overlays should probably remain dark but maybe less dark.
content = content.replace(/bg-black\/15/g, 'bg-white/5');
content = content.replace(/bg-black\/20/g, 'bg-white/5');
content = content.replace(/bg-black\/30/g, 'bg-white/10');
content = content.replace(/bg-black\/40/g, 'bg-white/10');
content = content.replace(/bg-black\/70/g, 'bg-white/10');
// Drawer backdrop and modal backdrop
content = content.replace(/bg-black\/60 backdrop-blur-md/g, 'bg-black/20 backdrop-blur-sm');
content = content.replace(/bg-black\/80 backdrop-blur-sm/g, 'bg-black/20 backdrop-blur-sm');

// Replace dslr-rgb-box background from rgba(0, 0, 0, 0.4) to rgba(255, 255, 255, 0.1)
content = content.replace(/background: rgba\(0, 0, 0, 0\.4\);/g, 'background: rgba(255, 255, 255, 0.05);');
content = content.replace(/box-shadow: 0 0 50px rgba\(0, 0, 0, 0\.8\)/g, 'box-shadow: 0 0 30px rgba(0, 0, 0, 0.3)');
content = content.replace(/background: rgba\(0, 0, 0, 0\.15\);/g, 'background: rgba(255, 255, 255, 0.1);');

// Save
fs.writeFileSync('src/App.tsx', content);
console.log("Replaced black backgrounds with transparent white glass.");
