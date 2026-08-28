import re

# 1. Update src/index.css
css_addition = """
/* 🌟 ULTRA HD DSLR CRYSTAL CLEAR TEXT & MODALS */
.dslr-hd-card {
  background: #090b10 !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border-width: 2px !important;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.95), inset 0 0 20px rgba(255, 255, 255, 0.03) !important;
}

@keyframes satorang-all-cycle {
  0% { border-color: #ff0055; color: #ff0055; filter: hue-rotate(0deg); }
  14% { border-color: #ff6600; color: #ff6600; filter: hue-rotate(50deg); }
  28% { border-color: #ffdd00; color: #ffdd00; filter: hue-rotate(100deg); }
  42% { border-color: #00e676; color: #00e676; filter: hue-rotate(180deg); }
  57% { border-color: #00e5ff; color: #00e5ff; filter: hue-rotate(220deg); }
  71% { border-color: #7c4dff; color: #7c4dff; filter: hue-rotate(280deg); }
  85% { border-color: #f50057; color: #f50057; filter: hue-rotate(320deg); }
  100% { border-color: #ff0055; color: #ff0055; filter: hue-rotate(360deg); }
}

.animate-satorang-live {
  animation: satorang-all-cycle 1s linear infinite;
}
"""

with open("src/index.css", "r", encoding="utf-8") as f:
    css_content = f.read()

if "dslr-hd-card" not in css_content:
    with open("src/index.css", "a", encoding="utf-8") as f:
        f.write(css_content + "\n" + css_addition)
    print("Updated index.css")

with open("src/App.tsx", "r", encoding="utf-8", errors="replace") as f:
    text = f.read()

# 2. Wrap Important Notice Modal in rainbow-box-container and dslr-hd-card
# Let us find where Important Notice Modal is rendered in App.tsx
old_notice_modal = """{showImportantNoticeModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-fuchsia-500 rounded-3xl p-6 shadow-2xl relative flex flex-col gap-4 text-white font-sans">"""

new_notice_modal = """{showImportantNoticeModal && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md rainbow-box-container shadow-[0_30px_100px_rgba(0,0,0,0.99)]">
            <div className="rainbow-box-content dslr-hd-card p-6 flex flex-col gap-5 relative overflow-hidden text-white font-sans">"""

if old_notice_modal in text:
    text = text.replace(old_notice_modal, new_notice_modal)
    print("Updated Important Notice Modal")

# 3. Update Checkout Modal to be crystal clear DSLR HD inside rainbow-box-container
old_checkout = """      {checkoutData && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-fuchsia-600 rounded-3xl p-5 shadow-2xl relative flex flex-col gap-4 text-white font-sans">"""

new_checkout = """      {checkoutData && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-md rainbow-box-container shadow-[0_30px_100px_rgba(0,0,0,0.99)]">
            <div className="rainbow-box-content dslr-hd-card p-6 flex flex-col gap-5 relative overflow-hidden text-white font-sans">"""

if old_checkout in text:
    text = text.replace(old_checkout, new_checkout)
    print("Updated Checkout Modal")

# 4. Update Buy Successful Pending Modal to be crystal clear DSLR HD inside rainbow-box-container
old_success_modal = """      {showBuySuccessPendingModal && (
        <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-sm bg-black border border-cyan-500 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,229,255,0.2)] flex flex-col gap-5 text-center text-white relative overflow-hidden">"""

new_success_modal = """      {showBuySuccessPendingModal && (
        <div className="fixed inset-0 z-[1100] bg-black/95 flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-md rainbow-box-container shadow-[0_30px_100px_rgba(0,0,0,0.99)]">
            <div className="rainbow-box-content dslr-hd-card p-6 flex flex-col gap-6 relative overflow-hidden text-center text-white font-sans">"""

if old_success_modal in text:
    text = text.replace(old_success_modal, new_success_modal)
    print("Updated Buy Successful Pending Modal")

# 5. Update Connect Website Making banner to have rainbow-box-container or live 7-color animation
old_connect = """                <span className="animate-satorang-text text-[11px] font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center justify-center gap-1">
                  ✦ CONNECT WEBSITE MAKING ✦
                </span>"""

new_connect = """                <div className="rainbow-box-container inline-block mx-auto mb-2 shadow-[0_0_20px_rgba(255,0,85,0.4)]">
                  <div className="rainbow-box-content bg-black/80 px-4 py-2 rounded-2xl flex items-center justify-center">
                    <span className="animate-satorang-text text-xs sm:text-sm font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center justify-center gap-1.5">
                      ✦ CONNECT WEBSITE MAKING ✦
                    </span>
                  </div>
                </div>"""

if old_connect in text:
    text = text.replace(old_connect, new_connect)
    print("Updated Connect Website Making banner")

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("SUCCESS updating App.tsx and index.css")
