const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const checkoutModalStart = content.indexOf('{/* BUY KEY CHECKOUT MODAL */}');
const mainEnd = content.indexOf('</main>');

if (checkoutModalStart !== -1 && mainEnd !== -1) {
  const replacement = `{/* STANDALONE PAGE 1: BUY KEY CHECKOUT PAGE (Isolated Full Screen View) */}
          {checkoutData && (
            <div className="fixed inset-0 z-[99999] bg-[#07090e] text-white flex flex-col w-full h-full overflow-y-auto animate-in fade-in duration-200">
              {/* Standalone Header */}
              <div className="sticky top-0 z-30 bg-[#0c101a] border-b border-white/15 px-4 py-3.5 flex items-center justify-between shadow-2xl">
                <button
                  onClick={() => setCheckoutData(null)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all border border-white/20 active:scale-95 shadow-md"
                >
                  <ArrowLeft size={18} className="text-cyan-400" />
                  <span>STORE PAR WAPAS JAYEIN</span>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                    <ShoppingBag size={18} className="text-fuchsia-400" />
                  </div>
                  <h2 className="text-white font-black text-base sm:text-lg tracking-wider uppercase drop-shadow-[0_0_10px_#fff]">
                    BUY KEY <span className="text-transparent bg-clip-text bg-rainbow-animated">CHECKOUT</span>
                  </h2>
                </div>
                <button
                  onClick={() => setCheckoutData(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/10 active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Checkout Standalone Content */}
              <div className="max-w-lg mx-auto w-full p-4 sm:p-6 flex flex-col gap-6 my-auto">
                {/* 3D Sato-Rang Order Summary Box */}
                <div className="bg-[#0f1523] border-[3px] animate-satorang-border rounded-3xl p-5 sm:p-6 shadow-[0_0_40px_rgba(217,70,239,0.25)] flex flex-col gap-4 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-cyan-400 font-black text-xs tracking-widest uppercase flex items-center gap-1.5">
                      <ShoppingBag size={14} /> ORDER SUMMARY
                    </span>
                    <span className="bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(217,70,239,0.4)]">
                      CONFIRM ORDER
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-400 font-black text-xs uppercase tracking-wider w-1/3 pt-0.5">PANEL NAME:</span>
                    <span className="text-fuchsia-400 font-black text-base uppercase text-right w-2/3 leading-tight drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
                      {checkoutData.panelTitle}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-400 font-black text-xs uppercase tracking-wider">PLAN DETAILS:</span>
                    <span className="text-transparent bg-clip-text bg-rainbow-animated font-black drop-shadow-[0_0_10px_#fff] text-sm">
                      {checkoutData.planLabel}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-400 font-black text-xs uppercase tracking-wider">ORIGINAL PRICE:</span>
                    <span className="text-white font-black text-base font-mono">₹{checkoutData.originalPrice}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                      <span className="text-emerald-400 font-black text-xs uppercase flex items-center gap-1">
                        <Tag size={12} /> DISCOUNT (COUPON: {appliedCoupon.code}):
                      </span>
                      <span className="text-emerald-400 font-black text-base font-mono">-₹{appliedCoupon.discount}</span>
                    </div>
                  )}

                  <div className="w-full h-px bg-white/10 my-1"></div>

                  <div className="flex justify-between items-center bg-yellow-500/10 border border-yellow-400/40 p-4 rounded-2xl shadow-inner">
                    <span className="text-yellow-400 font-black text-sm tracking-wider uppercase flex items-center gap-1.5">
                      <Sparkles size={16} /> TOTAL PAYMENT:
                    </span>
                    <span className="text-yellow-400 font-black text-2xl sm:text-3xl font-mono drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                      ₹{Math.max(0, checkoutData.originalPrice - (appliedCoupon ? appliedCoupon.discount : 0))}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="bg-[#0f1523] border border-cyan-500/30 rounded-3xl p-5 shadow-lg flex flex-col gap-3.5">
                  <div className="flex items-center gap-2">
                    <Gift size={16} className="text-cyan-400" />
                    <span className="text-cyan-400 font-black text-xs tracking-wider uppercase">
                      HAVE A DISCOUNT COUPON CODE?
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInputCode}
                      onChange={(e) => setCouponInputCode(e.target.value.toUpperCase())}
                      placeholder="ENTER COUPON CODE"
                      className="flex-1 bg-black/50 border border-white/20 focus:border-fuchsia-400 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-black text-white placeholder:text-gray-500 focus:outline-none transition-all uppercase shadow-inner"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="bg-rainbow-animated border-2 border-white text-black font-black text-xs px-6 py-3.5 rounded-2xl uppercase tracking-wider shadow-[0_0_15px_rgba(217,70,239,0.4)] transition-all active:scale-95 shrink-0"
                    >
                      APPLY
                    </button>
                  </div>

                  {userCoupons.filter((c) => !c.used).length > 0 && (
                    <div className="mt-2 bg-fuchsia-950/30 border border-fuchsia-500/30 rounded-2xl p-3.5 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-fuchsia-300 font-black text-[10px] uppercase tracking-wider">
                        <Tag size={12} /> YOUR AVAILABLE ACTIVE COUPONS (TAP TO APPLY):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userCoupons
                          .filter((c) => !c.used)
                          .map((coupon) => (
                            <button
                              key={"checkout-coupon-" + coupon.code}
                              onClick={() => {
                                setCouponInputCode(coupon.code);
                              }}
                              className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-[0_0_10px_rgba(217,70,239,0.4)] transition-all active:scale-95 border border-white/20"
                            >
                              <span>{coupon.code}</span>
                              <span className="bg-yellow-400 text-black px-1.5 py-0.2 rounded font-black text-[10px]">
                                ₹{coupon.discount} OFF
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {couponErrorMsg && (
                    <p className="text-red-400 text-xs font-black mt-1 flex items-center gap-1">
                      ⚠️ {couponErrorMsg}
                    </p>
                  )}
                  {couponSuccessMsg && (
                    <p className="text-emerald-400 text-xs font-black mt-1 flex items-center gap-1">
                      ✅ {couponSuccessMsg}
                    </p>
                  )}
                </div>

                {/* Account & Wallet Info */}
                <div className="bg-[#0f1523] border border-white/15 rounded-2xl py-3.5 px-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-bold shadow-inner">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    👤 Account: <span className="text-white font-black">{userProfile.email || "pramk9992@gmail.com"}</span>
                  </span>
                  <span className="text-gray-300 flex items-center gap-1.5">
                    💰 Available Wallet:{" "}
                    <span className="text-transparent bg-clip-text bg-rainbow-animated font-black text-sm font-mono drop-shadow-[0_0_10px_#fff]">
                      ₹{resellerUser.isLoggedIn && resellerUser.isApproved ? resellerUser.balance : userBalance}
                    </span>
                  </span>
                </div>

                {/* Confirm & Pay Button */}
                <button
                  onClick={handleRequestKey}
                  className="w-full bg-rainbow-animated border-2 border-white text-black font-black py-4.5 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center justify-center gap-2 uppercase tracking-wider text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <CheckCircle size={22} className="text-black" />
                  <span>
                    CONFIRM & ORDER KEY (₹
                    {Math.max(
                      0,
                      checkoutData.originalPrice -
                        (appliedCoupon ? appliedCoupon.discount : 0)
                    )}
                    )
                  </span>
                </button>

                {/* Return to store link */}
                <button
                  onClick={() => setCheckoutData(null)}
                  className="w-full text-center text-xs font-black text-gray-400 hover:text-white uppercase tracking-widest py-2 transition-colors border-t border-white/10 mt-2"
                >
                  ← CANCEL & RETURN TO STORE
                </button>
              </div>
            </div>
          )}

          {/* STANDALONE PAGE 2: BUY SUCCESSFUL / ORDER PENDING PAGE (Isolated Full Screen View) */}
          {showBuySuccessPendingModal && (
            <div className="fixed inset-0 z-[99999] bg-[#07090e] text-white flex flex-col w-full h-full overflow-y-auto animate-in fade-in duration-300">
              {/* Standalone Header */}
              <div className="sticky top-0 z-30 bg-[#0c101a] border-b border-white/15 px-4 py-3.5 flex items-center justify-between shadow-2xl">
                <button
                  onClick={() => {
                    setShowBuySuccessPendingModal(false);
                    setCurrentView("home");
                  }}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all border border-white/20 active:scale-95 shadow-md"
                >
                  <ArrowLeft size={18} className="text-cyan-400" />
                  <span>STORE PAR WAPAS JAYEIN</span>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    <Check size={20} className="text-emerald-400" />
                  </div>
                  <h2 className="text-emerald-400 font-black text-base sm:text-lg tracking-wider uppercase drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                    ORDER CONFIRMATION
                  </h2>
                </div>
                <button
                  onClick={() => setShowBuySuccessPendingModal(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all border border-white/10 active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Success Standalone Content */}
              <div className="max-w-lg mx-auto w-full p-4 sm:p-6 flex flex-col items-center justify-center my-auto text-center gap-6">
                {/* Big Animated Icon */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full border-4 border-emerald-400 bg-emerald-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.6)] relative">
                    <Check size={48} className="text-emerald-400 relative z-10" strokeWidth={3.5} />
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)] uppercase tracking-widest mt-2">
                    BUY SUCCESSFUL!
                  </h2>
                </div>

                {/* Detailed Status Card */}
                <div className="w-full bg-[#0f1523] border-[3px] animate-satorang-border rounded-3xl p-6 sm:p-7 shadow-[0_0_40px_rgba(249,115,22,0.25)] flex flex-col items-center text-center gap-4 relative">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                    <Clock size={22} className="text-orange-400 animate-pulse" />
                  </div>
                  
                  <h3 className="text-orange-400 font-black text-lg sm:text-xl tracking-wide uppercase">
                    ORDER IS PENDING DELIVERY!
                  </h3>

                  <p className="text-gray-200 text-xs sm:text-sm font-bold leading-relaxed">
                    Stock available nahi tha isliye aapka order Admin ke paas bhej diya gaya hai.
                  </p>

                  <p className="text-emerald-300 font-black text-xs sm:text-sm leading-relaxed bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl w-full">
                    ✅ Admin aapko thodi der me manually key deliver karenge.
                  </p>

                  <p className="text-gray-400 text-xs">
                    Aap niche button par click karke 'My Keys' page me apni key status check kar sakte hain.
                  </p>
                </div>

                {/* Action Navigation Buttons */}
                <div className="w-full flex flex-col gap-3.5">
                  <button
                    onClick={() => {
                      setShowBuySuccessPendingModal(false);
                      setCurrentView("myKeys");
                    }}
                    className="w-full bg-rainbow-animated border-2 border-white text-black font-black py-4.5 rounded-2xl uppercase tracking-wider text-sm sm:text-base shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Key size={20} className="text-black" />
                    <span>VIEW MY KEYS (की देखें)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowBuySuccessPendingModal(false);
                      setCurrentView("home");
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black py-3.5 rounded-2xl uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Home size={16} />
                    <span>RETURN TO HOME STORE (होम पेज)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        `;

  content = content.slice(0, checkoutModalStart) + replacement + '\n' + content.slice(mainEnd);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Successfully replaced with standalone isolated full-screen Buy Key pages!");
} else {
  console.error("Could not find start or end tags!");
}
