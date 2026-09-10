const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Give 3-dot buttons / menu buttons the Sato-Rang style
content = content.replace(/<MoreVertical\s+size=\{18\}\s+className="text-gray-[0-9]+"\s*\/>/g, '<MoreVertical size={22} className="text-white drop-shadow-[0_0_10px_#fff]" />');
content = content.replace(/className="p-1.5 hover:bg-transparent rounded-lg transition-colors"/g, 'className="p-1.5 rounded-lg transition-all border-[3px] border-transparent animate-satorang-border shadow-[0_0_15px_rgba(255,255,255,0.4)]"');
content = content.replace(/className="p-2 bg-transparent hover:bg-transparent rounded-full transition-colors"/g, 'className="p-2 rounded-xl transition-all border-2 animate-satorang-border shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110"');

// 2. Enhance panel card text and visuals
// Since bg-transparent was applied heavily, let's make sure the text is readable by adding heavy drop shadows
content = content.replace(/text-white font-black text-sm uppercase tracking-wide truncate/g, 'text-white font-black text-base uppercase tracking-wider truncate drop-shadow-[0_0_8px_#000]');
content = content.replace(/text-cyan-400 font-bold/g, 'text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff]');
content = content.replace(/text-gray-300 font-bold/g, 'text-white font-bold drop-shadow-[0_0_6px_#000]');

// 3. Make all main buttons Sato-Rang
content = content.replace(/bg-gradient-to-r from-emerald-[^ ]+ to-teal-[^ ]+/g, 'bg-rainbow-animated border-2 border-white');
content = content.replace(/bg-gradient-to-r from-amber-[^ ]+ to-yellow-[^ ]+/g, 'bg-rainbow-animated border-2 border-white');
content = content.replace(/bg-gradient-to-r from-cyan-[^ ]+ to-blue-[^ ]+/g, 'bg-rainbow-animated border-2 border-white');
content = content.replace(/bg-gradient-to-r from-fuchsia-[^ ]+ to-purple-[^ ]+/g, 'bg-rainbow-animated border-2 border-white');
content = content.replace(/bg-cyan-500 hover:bg-cyan-400/g, 'bg-rainbow-animated border-2 border-white');
content = content.replace(/bg-emerald-500 hover:bg-emerald-400/g, 'bg-rainbow-animated border-2 border-white');
content = content.replace(/bg-yellow-500 hover:bg-yellow-400/g, 'bg-rainbow-animated border-2 border-white');

// 4. Modals and Drawers: 
// Drawer background should be a slightly tinted Satorang glass instead of completely invisible (since text would be unreadable)
content = content.replace(/className={`fixed top-0 left-0 h-full w-72 bg-transparent   border-r border-white\/15 z-\[70\]/g, 'className={`fixed top-0 left-0 h-full w-72 bg-black/60 border-r-[4px] animate-satorang-border z-[70]');
content = content.replace(/className="fixed inset-0 bg-transparent  z-\[60\] transition-opacity"/g, 'className="fixed inset-0 bg-black/40 z-[60] transition-opacity"');
content = content.replace(/className="fixed inset-0 z-\[60\] flex items-center justify-center p-4 bg-transparent  animate-in fade-in duration-200"/g, 'className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"');
content = content.replace(/className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent  animate-in fade-in duration-200"/g, 'className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"');
content = content.replace(/className="fixed inset-0 z-\[70\] flex items-center justify-center p-4 bg-transparent  animate-in fade-in duration-300"/g, 'className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300"');

// Restore some panel legibility for inner sections (but keeping the outer box Kamra transparent)
// The user said "Kamra" (outer box) transparent.
// The main panel container: <div className="bg-transparent rounded-[14px] p-3
content = content.replace(/className="bg-transparent rounded-\[14px\] p-3 flex flex-col gap-2.5 h-full w-full relative z-10 transition-colors"/g, 'className="bg-transparent border-[3px] animate-satorang-border rounded-[14px] p-3 flex flex-col gap-2 h-full w-full relative z-10"');

fs.writeFileSync('src/App.tsx', content);
console.log("Applied Satorang enhancements.");
