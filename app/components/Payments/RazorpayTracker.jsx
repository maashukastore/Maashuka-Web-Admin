"use client";
import { useState } from "react";
import { 
  Search, Loader2, CreditCard, User, Mail, Phone, 
  Calendar, Landmark, Coins, AlertCircle, Layers, CheckCircle2 
} from "lucide-react";
import { sileo } from "sileo";

export default function RazorpayTracker() {
  const [lookupType, setLookupType] = useState("payment"); // "payment" | "order"
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [activePaymentIndex, setActivePaymentIndex] = useState(0);

  const executeLookup = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setPayments([]);
    setActivePaymentIndex(0);

    const payload = lookupType === "payment" 
      ? { paymentId: inputValue.trim() } 
      : { orderId: inputValue.trim() };

    try {
      const res = await fetch("/api/razorpay/payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success && result.data && result.data.length > 0) {
        setPayments(result.data);
        sileo.success({ 
          title: "Node Mapped", 
          description: `Located ${result.data.length} transaction entries connected to this token.`,
          fill: "black" 
        });
      } else {
        sileo.error({ title: "Fetch Denied", description: result.message || "No ledger entries found.", fill: "black" });
      }
    } catch (err) {
      console.error(err);
      sileo.error({ title: "System Failure", description: "Could not execute background route updates.", fill: "black" });
    } finally {
      setLoading(false);
    }
  };

  const currentRecord = payments[activePaymentIndex];

  return (
    <div className="space-y-6">
      
      {/* FILTER SEARCH TYPE TOGGLE SYSTEM */}
      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-xl max-w-fit no-scrollbar select-none">
        <button
          type="button"
          onClick={() => { setLookupType("payment"); setInputValue(""); setPayments([]); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            lookupType === "payment" ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          Payment Token ID
        </button>
        <button
          type="button"
          onClick={() => { setLookupType("order"); setInputValue(""); setPayments([]); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            lookupType === "order" ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          Razorpay Order ID
        </button>
      </div>

      {/* INPUT CONTROLS ROW */}
      <form onSubmit={executeLookup} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl focus-within:border-primary transition-all flex-1 shadow-sm">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder={lookupType === "payment" ? "Search Payment ID (pay_SumTHx...)" : "Search Order ID (order_SumQ7i...)"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="bg-transparent text-xs font-medium w-full outline-none text-slate-800 placeholder-slate-400 font-mono"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="h-[44px] px-6 bg-primary hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-50 disabled:text-slate-300 cursor-pointer shrink-0"
        >
          {loading ? <Loader2 size={14} className="animate-spin text-white" /> : <span>Inspect Token</span>}
        </button>
      </form>

      {/* MULTIPLE TRANSACTIONS SELECTOR BAR (Shows if Order ID contains multiple logs) */}
      {payments.length > 1 && (
        <div className="bg-slate-100/60 border border-slate-200/40 p-3 rounded-2xl flex flex-wrap items-center gap-3 animate-in fade-in">
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
            <Layers size={12} /> Transactions Found:
          </span>
          <div className="flex flex-wrap gap-2">
            {payments.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePaymentIndex(idx)}
                className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                  activePaymentIndex === idx 
                    ? "bg-slate-900 text-white border-slate-900" 
                    : p.status === 'captured' 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" 
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {p.id.slice(-6)} ({p.status})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RENDER ACTIVE PAYMENT ELEMENT SHEET */}
      {currentRecord && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* LEFT SECTION: MATRIX LOGS CANVAS (Col 8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={15} className="text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Payment Authorization Parameters</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black border uppercase tracking-wider ${
                  currentRecord.status === "captured" ? "bg-emerald-50 text-emerald-700 border-emerald-100/60" : "bg-rose-50 text-rose-700 border-rose-100"
                }`}>
                  {currentRecord.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transaction Token (Payment ID)</span>
                  <p className="font-mono font-black text-slate-900 text-sm tracking-wide select-all">{currentRecord.id}</p>
                </div>
                {currentRecord.order_id && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Merchant Order ID</span>
                    <p className="font-mono font-black text-slate-800 text-sm tracking-wide select-all">{currentRecord.order_id}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settle Channels Method</span>
                  <span className="inline-block bg-primary/5 border border-primary/10 px-2.5 py-0.5 rounded font-mono text-[10px] font-black text-primary uppercase tracking-wide">
                    {currentRecord.method} channel
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Card Sub-Object Property Decryption */}
            {currentRecord.method === "card" && currentRecord.card && (
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
                  <Landmark size={15} className="text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Card Vault Infrastructure Properties</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Card Issuer</span>
                    <p className="font-black text-slate-800 text-sm font-sans uppercase">{currentRecord.card.issuer || "Generic Institution"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Network Rail</span>
                    <p className="font-bold text-slate-700 uppercase">{currentRecord.card.network}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Funding Class</span>
                    <p className="font-mono text-slate-600 capitalize font-bold text-[11px]">{currentRecord.card.type || "N/A"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Masked Account Sequence</span>
                    <p className="font-mono font-black text-slate-900 text-sm">•••• •••• •••• {currentRecord.card.last4 || "••••"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SECTION: SPLITS LEDGER (Col 4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <User size={14} className="text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Buyer Metadata</h3>
              </div>
              <div className="space-y-2 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100/60 p-3 rounded-xl">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate font-mono text-slate-700 select-all">{currentRecord.email}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100/60 p-3 rounded-xl">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-700 select-all">{currentRecord.contact}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] pt-1">
                  <Calendar size={12} />
                  <span>Authorized: {new Date(currentRecord.created_at * 1000).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Coins size={14} className="text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Payout Splits Reconciliation</h3>
              </div>

              <div className="space-y-2.5 text-xs border-b border-slate-50 pb-3.5 font-medium text-slate-500 font-mono">
                <div className="flex justify-between">
                  <span>Gross Charge Amount</span>
                  <span className="text-slate-800 font-bold">₹{currentRecord.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Gateway Platform Fee</span>
                  <span>-₹{currentRecord.fee?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Service Tax Goods (GST)</span>
                  <span>-₹{currentRecord.tax?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Net Store Payout</span>
                  <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Ready to settle
                  </span>
                </div>
                <h3 className="text-xl font-black text-emerald-600 font-mono tracking-tight">
                  ₹{(currentRecord.amount - (currentRecord.fee + currentRecord.tax))?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}