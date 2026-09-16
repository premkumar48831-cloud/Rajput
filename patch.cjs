const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `                      </div>
                    );
                  })()}
                <div className="bg-[#0e0707]/90 border border-red-500/40 rounded-[24px] p-6 sm:p-8 shadow-[0_0_30px_rgba(239,68,68,0.25)] text-center flex flex-col items-center w-[92%] mx-auto mt-2 animate-in zoom-in-95 duration-200">
              {/* PAYMENT HISTORY */}`;

const replace1 = `                      </div>
                    );
                  })()}
              </div>
              
              {/* PAYMENT HISTORY */}`;

code = code.replace(target1, replace1);
fs.writeFileSync('src/App.tsx', code);
