const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `                      </div>
                    );
                  })()}
              </div>
              
              {/* PAYMENT HISTORY */}`;

const replace1 = `                      </div>
                    );
                  })()}
                </div>
              
              {/* PAYMENT HISTORY */}`;

code = code.replace(target1, replace1);
fs.writeFileSync('src/App.tsx', code);
