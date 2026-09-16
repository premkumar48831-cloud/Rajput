const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix the typo and add the payment mode selector
const target1 = `              {/* Steps Container for Manual */}/
                <div className="bg-transparent  border border-white/10 rounded-[24px] p-4 sm:p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]  relative overflow-hidden flex flex-col items-center w-[92%] mx-auto mt-2">`;

const replace1 = `              {/* Payment Mode Selector */}
              <div className="flex gap-2 w-[92%] mx-auto bg-white/5 p-1.5 rounded-[20px] border border-white/10 shadow-inner">
                <button
                  onClick={() => setPaymentMode("manual")}
                  className={\`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 \${
                    paymentMode === "manual"
                      ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }\`}
                >
                  Manual UPI
                </button>
                <button
                  onClick={() => {
                    if (isAutoUpiLocked) {
                      alert("🔒 Auto Pay abhi temporary band (LOCKED) hai!\\n\\nKripya Manual UPI ka upyog karein.");
                    } else {
                      setPaymentMode("auto");
                    }
                  }}
                  className={\`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 \${
                    paymentMode === "auto"
                      ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]"
                      : isAutoUpiLocked
                        ? "bg-red-950/40 border border-red-500/40 text-red-300 opacity-70 hover:opacity-100 cursor-not-allowed"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                  }\`}
                  title={isAutoUpiLocked ? "Auto Pay is locked and blocked" : "Select Auto Pay"}
                >
                  {isAutoUpiLocked ? <Lock size={13} className="text-red-400" /> : <Zap size={13} className={paymentMode === "auto" ? "text-yellow-400" : "text-gray-400"} />}
                  <span>Auto Pay</span>
                  {isAutoUpiLocked && (
                    <span className="text-[9px] bg-red-600/30 text-red-300 px-1.5 py-0.5 rounded font-mono border border-red-500/40 font-bold tracking-wider">
                      LOCKED
                    </span>
                  )}
                </button>
              </div>

              {paymentMode === "manual" && (
                /* Steps Container for Manual */
                <div className="bg-transparent  border border-white/10 rounded-[24px] p-4 sm:p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]  relative overflow-hidden flex flex-col items-center w-[92%] mx-auto mt-2">`;

code = code.replace(target1, replace1);

// 2. Close the manual container and add the auto container
const target2 = `                      </div>
                    );
                  })()}
                </div>
              
              {/* PAYMENT HISTORY */}`;

const replace2 = `                      </div>
                    );
                  })()}
                </div>
              )}

              {paymentMode === "auto" && isAutoUpiLocked && (
                <div className="bg-[#0e0707]/90 border border-red-500/40 rounded-[24px] p-6 sm:p-8 shadow-[0_0_30px_rgba(239,68,68,0.25)] text-center flex flex-col items-center w-[92%] mx-auto mt-2 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-red-500/15 border border-red-500/40 rounded-2xl flex items-center justify-center mb-3 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
                    Auto Pay <span className="text-red-400">Blocked / Locked</span>
                  </h3>
                  <p className="text-sm text-red-300/80 mb-6 font-medium">
                    Auto Pay abhi temporary band (locked) kar di gayi hai. Is par click karne par payment open nahi hogi. Kripya <strong>Manual UPI</strong> se payment karein.
                  </p>
                  <button
                    onClick={() => setPaymentMode("manual")}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 py-2.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    Go to Manual UPI
                  </button>
                </div>
              )}

              {paymentMode === "auto" && !isAutoUpiLocked && (
                <div className="bg-[#090d16]/80 backdrop-blur-md border border-cyan-400/30 rounded-[24px] p-6 sm:p-8 shadow-[0_10px_40px_rgba(6,182,212,0.15)] relative overflow-hidden flex flex-col items-center w-[92%] mx-auto mt-2 animate-in zoom-in-95 duration-300">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
                  
                  <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-4">
                    <Zap size={32} className="text-yellow-400" />
                  </div>
                  
                  <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 uppercase tracking-wider mb-1 text-center drop-shadow-[0_2px_10px_rgba(6,182,212,0.5)]">
                    Auto Pay Checkout
                  </h3>
                  <p className="text-xs text-cyan-200/70 text-center mb-6 max-w-[280px]">
                    Fast & secure automatic payment processing. Amount will be added to your wallet instantly.
                  </p>

                  <div className="w-full max-w-[280px] flex flex-col gap-4 relative z-10">
                    <div>
                      <label className="text-cyan-400 font-bold text-[10px] tracking-wider mb-1 block uppercase">
                        Amount (₹) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={autoAmount}
                          onChange={(e) => setAutoAmount(e.target.value)}
                          placeholder="Enter Amount"
                          className="w-full bg-black/40 border border-cyan-500/30 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-cyan-400 font-bold text-[10px] tracking-wider mb-1 block uppercase flex justify-between">
                        <span>WhatsApp No. <span className="text-red-400">*</span></span>
                        <span className="text-gray-500 lowercase">(10 digits)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 font-bold">+91</span>
                        <input
                          type="tel"
                          value={autoWhatsapp}
                          onChange={(e) => setAutoWhatsapp(e.target.value.replace(/\\D/g, '').slice(0, 10))}
                          placeholder="Enter WhatsApp"
                          className="w-full bg-black/40 border border-cyan-500/30 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-400 shadow-inner"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!autoAmount || Number(autoAmount) <= 0) {
                          alert("⚠️ Please enter a valid amount!");
                          return;
                        }
                        const cleanWhatsapp = autoWhatsapp.replace(/\\D/g, "");
                        if (cleanWhatsapp.length !== 10) {
                          alert("⚠️ Please enter a valid 10-digit WhatsApp number!");
                          return;
                        }

                        const amt = Number(autoAmount);
                        const newTxId = Date.now();
                        const curEmail = userProfile.email || "";
                        const curPhone = userProfile.phone || "";
                        const curPassword = userProfile.password || "";
                        const curWalletBal = userProfile.walletBalance || 0;
                        const keysCount = userProfile.keysBoughtCount || 0;
                        const totalPaid = userProfile.totalPaid || 0;
                        const accKey = getAccountKey(curEmail, curPhone);
                        
                        const regUser = registeredUsers[accKey];

                        const newAutoPayment = {
                          id: newTxId,
                          amount: amt,
                          whatsapp: cleanWhatsapp,
                          status: "PENDING_AUTO",
                          date: new Date().toLocaleString(),
                          userEmail: curEmail || regUser?.email || "N/A",
                          userPhone: cleanWhatsapp || curPhone || regUser?.phone || "N/A",
                          userPassword: curPassword || regUser?.password || "N/A",
                          userName: userProfile.name || regUser?.name || curEmail?.split("@")[0] || "User",
                          userAvatar: userProfile.avatar || regUser?.avatar || "",
                          userJoinDate: regUser?.joinDate || userProfile.joinDate || new Date().toLocaleDateString(),
                          userLastLogin: regUser?.lastLogin || new Date().toLocaleString(),
                          userBalance: curWalletBal,
                          keysBoughtCount: keysCount,
                          totalPaid: totalPaid,
                          userAccountKey: accKey,
                        };

                        setAutoPaymentHistory((prev) => [newAutoPayment, ...(Array.isArray(prev) ? prev : [])]);
                        setPaymentHistory((prev) => [newAutoPayment, ...(Array.isArray(prev) ? prev : [])]);
                        setCurrentTxId(newTxId);

                        if (paymentSettings.activeGateway === "cashfree" && paymentSettings.cashfreeAppId && paymentSettings.cashfreeCode) {
                          try {
                            const executePayment = new Function('amount', 'whatsapp', 'appId', 'secretKey', paymentSettings.cashfreeCode);
                            executePayment(amt, cleanWhatsapp, paymentSettings.cashfreeAppId, paymentSettings.cashfreeSecretKey);
                          } catch (err) {
                            alert("Error launching Cashfree gateway: " + err.message);
                          }
                        } else if (paymentSettings.activeGateway === "razorpay" && paymentSettings.razorpayAppId && paymentSettings.razorpayCode) {
                          try {
                            const executePayment = new Function('amount', 'whatsapp', 'appId', 'secretKey', paymentSettings.razorpayCode);
                            executePayment(amt, cleanWhatsapp, paymentSettings.razorpayAppId, paymentSettings.razorpaySecretKey);
                          } catch (err) {
                            alert("Error launching Razorpay gateway: " + err.message);
                          }
                        } else {
                          // Fallback
                          setIsRazorpayModalOpen(true);
                        }
                      }}
                      className="w-full mt-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-sm sm:text-base py-4 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 cursor-pointer border border-cyan-300/40"
                    >
                      <Zap size={18} className="text-yellow-300 fill-yellow-300" />
                      Payment Request (Open Gateway)
                    </button>
                  </div>
                </div>
              )}
              
              {/* PAYMENT HISTORY */}`;

code = code.replace(target2, replace2);

fs.writeFileSync('src/App.tsx', code);
