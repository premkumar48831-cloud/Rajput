import React from "react";
import { Zap, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";

interface RazorpayButtonProps {
  buttonId?: string;
  className?: string;
  amount?: number | string;
  onClick?: () => void;
}

export const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  className = "",
  amount,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs sm:text-sm transition-all active:scale-95 cursor-pointer border border-cyan-300/40 ${className}`}
    >
      <Zap size={18} className="text-yellow-300 fill-yellow-300 shrink-0" />
      <span>
        Pay {amount && Number(amount) > 0 ? `₹${amount}` : ""} via Official Razorpay Gateway
      </span>
      <ArrowRight size={16} className="shrink-0" />
    </button>
  );
};
