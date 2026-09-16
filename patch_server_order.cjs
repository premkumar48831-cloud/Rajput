const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `      } catch (rzpErr: any) {
        console.warn("Razorpay API order create error (fallback to verified client order):", rzpErr?.message);
        const fallbackOrderId = \`order_\${Date.now()}_\${Math.random().toString(36).substring(2, 9)}\`;
        return res.json({
          status: true,
          order_id: fallbackOrderId,
          amount: amountInPaise,
          currency: currency.toUpperCase(),
          receipt: orderReceipt,
          key_id: activeKeyId,
          isLive: true,
        });
      }
    } else {
      const demoOrderId = \`order_\${Date.now()}_\${Math.random().toString(36).substring(2, 9)}\`;
      return res.json({
        status: true,
        order_id: demoOrderId,
        amount: amountInPaise,
        currency: currency.toUpperCase(),
        receipt: orderReceipt,
        key_id: activeKeyId,
        isLive: true,
      });
    }`;

const replacementStr = `      } catch (rzpErr: any) {
        console.error("Razorpay API order create error:", rzpErr?.message);
        return res.status(400).json({
          status: false,
          error: "Invalid Razorpay Keys or API error: " + (rzpErr?.message || "")
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        error: "Razorpay keys are missing. Please configure valid Key ID and Secret in Admin panel."
      });
    }`;

if (code.includes('const fallbackOrderId')) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('server.ts', code);
    console.log("Patched server.ts successfully.");
} else {
    console.log("Could not find the target string.");
}
