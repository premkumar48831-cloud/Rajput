const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Patch 1: add type="button" and fix alert
const targetStr = `<button
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
                        }`;

const replacementStr = `<button
                      type="button"
                      id="autoPaySubmitBtn"
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!autoAmount || Number(autoAmount) <= 0) {
                          alert("⚠️ Please enter a valid amount!");
                          return;
                        }
                        const cleanWhatsapp = autoWhatsapp.replace(/\\D/g, "");
                        if (cleanWhatsapp.length !== 10) {
                          alert("⚠️ Please enter a valid 10-digit WhatsApp number!");
                          return;
                        }`;

code = code.replace(targetStr, replacementStr);

const targetError = `                          const orderData = await orderRes.json();
                          if (!orderData.order_id) {
                            alert("❌ Order creation failed!");
                            if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                            return;
                          }`;

const replaceError = `                          const orderData = await orderRes.json();
                          if (!orderData.order_id) {
                            alert("❌ Order creation failed: " + (orderData.error || "Unknown error"));
                            if (btnText) btnText.innerText = "Payment Request (Open Gateway)";
                            return;
                          }`;

code = code.replace(targetError, replaceError);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx Auto Pay button.");
