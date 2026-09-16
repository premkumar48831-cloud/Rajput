const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                    <button
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
                    </button>`;

const replacementStr = `                    <button
                      id="autoPaySubmitBtn"
                      onClick={async (e) => {
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
                        const btnText = document.getElementById("autoPayBtnText");
                        if (btnText) btnText.innerText = "⏳ Creating secure order...";

                        try {
                          // 1. Order ID generate
                          const orderRes = await fetch('/api/razorpay/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ amount: amt, currency: "INR" }) 
                          });
                          
                          const orderData = await orderRes.json();
                          if (!orderData.order_id) {
                            alert("❌ Order creation failed!");
                            if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                            return;
                          }

                          // Ensure Razorpay SDK is loaded
                          if (typeof (window as any).Razorpay === "undefined") {
                            await new Promise((resolve, reject) => {
                              const script = document.createElement("script");
                              script.src = "https://checkout.razorpay.com/v1/checkout.js";
                              script.onload = () => resolve(true);
                              script.onerror = () => reject(new Error("Failed to load Razorpay"));
                              document.body.appendChild(script);
                            });
                          }

                          // 2. Razorpay configuration
                          const options = {
                              "key": orderData.key_id || "rzp_test_TZUwf1FLBoMyDe",
                              "amount": orderData.amount,
                              "currency": "INR",
                              "name": "Auto UPI Payment",
                              "description": "Instant Order Payment",
                              "order_id": orderData.order_id, 
                              "handler": async function (paymentResponse: any) {
                                  if (btnText) btnText.innerText = "⚡ Verifying payment status...";
                                  
                                  // 3. Verify Payment
                                  const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                          razorpay_order_id: paymentResponse.razorpay_order_id,
                                          razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                          razorpay_signature: paymentResponse.razorpay_signature,
                                          amount: amt
                                      })
                                  });

                                  const verifyData = await verifyResponse.json();
                                  if (verifyData.status === true || verifyData.status === "success") {
                                      alert("🎉 Success! Payment Verified. Amount added to wallet.");
                                      
                                      // Wallet Credit Logic
                                      const curEmail = userProfile.email || "";
                                      const curPhone = userProfile.phone || "";
                                      const accKey = getAccountKey(curEmail, curPhone);
                                      const regUser = registeredUsers[accKey];
                                      
                                      setUserBalance((prev) => (prev || 0) + amt);
                                      setUserWallets((prev) => ({
                                        ...prev,
                                        [accKey]: (prev[accKey] ?? userBalance ?? 0) + amt,
                                      }));

                                      // History Update
                                      const newTxId = Date.now();
                                      const newAutoPayment = {
                                        id: newTxId,
                                        amount: amt,
                                        whatsapp: cleanWhatsapp,
                                        status: "SUCCESS",
                                        date: new Date().toLocaleString(),
                                        utr: paymentResponse.razorpay_payment_id,
                                        userEmail: curEmail || regUser?.email || "N/A",
                                        userPhone: curPhone || regUser?.phone || "N/A",
                                        userName: userProfile.name || regUser?.name || curEmail?.split("@")[0] || "User",
                                        userAccountKey: accKey,
                                      };
                                      
                                      setAutoPaymentHistory((prev) => [newAutoPayment, ...(Array.isArray(prev) ? prev : [])]);
                                      setPaymentHistory((prev) => [newAutoPayment, ...(Array.isArray(prev) ? prev : [])]);
                                      
                                  } else {
                                      alert("❌ Verification Failed.");
                                  }
                                  if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                              },
                              "prefill": {
                                  "contact": cleanWhatsapp,
                                  "email": userProfile.email || ""
                              },
                              "theme": { "color": "#2563eb" }
                          };

                          const rzp = new (window as any).Razorpay(options);
                          rzp.open();

                          rzp.on('payment.failed', function (err: any) {
                              alert("❌ Payment Failed: " + err.error.description);
                              if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                          });

                        } catch (err) {
                          alert("❌ Connection error.");
                          console.error(err);
                          if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                        }
                      }}
                      className="w-full mt-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-sm sm:text-base py-4 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 cursor-pointer border border-cyan-300/40"
                    >
                      <Zap size={18} className="text-yellow-300 fill-yellow-300" />
                      <span id="autoPayBtnText">Payment Request (Open Gateway)</span>
                    </button>`;

if (code.includes('if (!autoAmount || Number(autoAmount) <= 0) {')) {
  const newCode = code.replace(targetStr, replacementStr);
  fs.writeFileSync('src/App.tsx', newCode);
  console.log("Successfully patched App.tsx with direct Razorpay logic.");
} else {
  console.log("Could not find the target code in App.tsx.");
}
