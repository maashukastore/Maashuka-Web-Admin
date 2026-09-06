// app/dashboard/refunds/page.jsx
import RefundManager from "../../../components/Payments/RefundManager";
import { RefreshCw } from "lucide-react";

export const metadata = {
  title: "Fulfillment Remittance & Refunds | Maashuka Control",
};

export default function RefundManagementPage() {
  return (
    <div className="space-y-8 text-left pb-16 animate-in fade-in duration-500">
      
      {/* SECTION HEADER TYPOGRAPHY PANEL */}
      <div className="border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-primary mb-1">
          <RefreshCw size={14} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Accounting Remittance Ledger</span>
        </div>
        <h1 className="text-xl font-serif font-black text-slate-900 tracking-tight">Initiate Gateway Refunds</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Query customer transaction manifests directly to process custom per-item adjustments or entire order transaction balance cancellations safely across live Razorpay networks.
        </p>
      </div>

      {/* INJECT INTERACTIVE MANAGEMENT ENGINE WORKSPACE */}
      <RefundManager />

    </div>
  );
}