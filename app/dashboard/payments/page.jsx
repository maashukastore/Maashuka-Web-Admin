// app/dashboard/payments/page.jsx
import RazorpayTracker from "../../components/Payments/RazorpayTracker";
import { CreditCard } from "lucide-react";

export const metadata = {
  title: "Razorpay Ledger Inspection | Maashuka Console",
};

export default function RazorpayPaymentsPage() {
  return (
    <div className="space-y-8 text-left pb-16 animate-in fade-in duration-500">
      
      {/* TITLE VIEWPORT HEADER */}
      <div className="border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-primary mb-1">
          <CreditCard size={14} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Financial Settle Engine</span>
        </div>
        <h1 className="text-xl font-serif font-black text-slate-900 tracking-tight">Razorpay Token Inspection</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Query settlement tokens directly across production servers to verify checkout captures, transaction status states, and processing anomalies.
        </p>
      </div>

      {/* MASTER APPLICATION WORKSPACE */}
      <RazorpayTracker />

    </div>
  );
}