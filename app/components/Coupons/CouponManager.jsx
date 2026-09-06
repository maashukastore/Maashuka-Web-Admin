"use client";
import { useState } from "react";
import { 
  Ticket, Plus, Search, Percent, IndianRupee, 
  Calendar, Eye, EyeOff, Loader2, DollarSign, hash 
} from "lucide-react";
import { toggleCouponStatus, createNewCoupon } from "../../dashboard/action";
import { sileo } from "sileo";

export default function CouponsManager({ initialCoupons }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [searchTerm, setSearchTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Form State initialized to match your exact DB data points
  const [formState, setFormState] = useState({
    code: "",
    discount_type: "percentage", // 'percentage' | 'fixed_amount'
    discount_value: "",
    min_order_amount: "0",
    usage_limit: "",
    end_date: "",
    max_discount_amount: ""
  });

  const handleToggleState = async (id, currentActiveStatus) => {
    setProcessingId(id);
    const targetState = !currentActiveStatus;
    
    try {
      const response = await toggleCouponStatus(id, targetState);
      if (response.success) {
        sileo.success({ title: "Visibility Updated", description: response.message, fill: "black" });
        setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: targetState } : c));
      } else {
        sileo.error({ title: "Action Blocked", description: response.message });
      }
    } catch (err) {
      console.error(err);
      sileo.error({ title: "Runtime Error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    if (!formState.end_date) {
      return sileo.error({ title: "Validation Error", description: "Please map an explicit campaign end date threshold." });
    }

    setCreating(true);
    try {
      const response = await createNewCoupon(formState);
      if (response.success) {
        sileo.success({ title: "Coupon Generated", description: response.message, fill: "black" });
        setCoupons([response.data, ...coupons]);
        setFormState({
          code: "",
          discount_type: "percentage",
          discount_value: "",
          min_order_amount: "0",
          usage_limit: "",
          end_date: "",
          max_discount_amount: ""
        });
      } else {
        sileo.error({ title: "Validation Refused", description: response.message });
      }
    } catch (err) {
      console.error(err);
      sileo.error({ title: "Execution Failure" });
    } finally {
      setCreating(false);
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 text-left pb-24 animate-in fade-in duration-300">
      
      {/* HEADER SECTION CONTROLS MAIN TOP BAR */}
      <div className="border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Ticket size={14} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Campaign Manifest</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-slate-900">Boutique Promo Coupons</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">Configure active customer rewards channels, manage discount rates parameters, and toggle checkout accessibility switches instantly.</p>
      </div>

      {/* SPLIT COLUMN DECK WORKFLOW WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN PANEL: FORM BUILDER BOX MODULE (Col 5) */}
        <form onSubmit={handlePublishSubmit} className="lg:col-span-5 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <Plus size={15} className="text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Deploy Code Token</h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Promo Code Key</label>
            <input
              type="text"
              placeholder="e.g., FESTIVE50"
              value={formState.code}
              onChange={(e) => setFormState({ ...formState, code: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-slate-900 focus:bg-white rounded-xl text-xs font-mono font-black tracking-widest text-slate-800 uppercase outline-none transition-all"
              required
              disabled={creating}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount Strategy Allocation</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 border border-slate-200/60 rounded-xl select-none">
              <button
                type="button"
                onClick={() => setFormState({ ...formState, discount_type: "percentage" })}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  formState.discount_type === "percentage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Percent size={11} /> <span>Percentage</span>
              </button>
              <button
                type="button"
                // 💡 Production Change: Sets exactly 'fixed_amount' string token to pass DB constraints rule
                onClick={() => setFormState({ ...formState, discount_type: "fixed_amount" })}
                className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  formState.discount_type === "fixed_amount" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <IndianRupee size={11} /> <span>Fixed Amount</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount Value Amount</label>
            <input
              type="number"
              placeholder={formState.discount_type === "percentage" ? "15" : "500"}
              value={formState.discount_value}
              onChange={(e) => setFormState({ ...formState, discount_value: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-slate-900 focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-800 outline-none transition-all"
              min="1"
              required
              disabled={creating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min Purchase Required (₹)</label>
              <input
                type="number"
                value={formState.min_order_amount}
                onChange={(e) => setFormState({ ...formState, min_order_amount: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                min="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global Usage Limit</label>
              <input
                type="number"
                placeholder="Unlimited"
                value={formState.usage_limit}
                onChange={(e) => setFormState({ ...formState, usage_limit: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                min="1"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max Discount Amount (₹)</label>
              <input
                type="number"
                placeholder="500"
                value={formState.max_discount_amount}
                onChange={(e) => setFormState({ ...formState, max_discount_amount: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white"
                min="1"
              />
            </div>
          </div>

          {/* 💡 MANDATORY END_DATE FIELD BLOCK */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">Campaign Expiration Deadline Date</label>
            <input
              type="date"
              value={formState.end_date}
              onChange={(e) => setFormState({ ...formState, end_date: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none focus:border-slate-900 focus:bg-white cursor-pointer"
              required
              disabled={creating}
            />
          </div>

          <button
            type="submit"
            disabled={creating || !formState.code.trim() || !formState.discount_value || !formState.end_date}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-slate-50 disabled:text-slate-300 shadow-sm cursor-pointer pt-0.5"
          >
            {creating ? (
              <>
                <Loader2 size={13} className="animate-spin text-slate-400" />
                <span>Injecting Coupon into master schema...</span>
              </>
            ) : (
              <span>Deploy Coupon Code</span>
            )}
          </button>
        </form>

        {/* RIGHT COLUMN PANEL: GRID TRACKER DATATABLE (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Active Coupon System Map ({filteredCoupons.length})
            </h3>
            
            <div className="relative w-full sm:w-60">
              <Search size={13} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search active Coupon logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 focus:border-slate-900 focus:bg-white rounded-xl text-xs font-medium text-slate-800 outline-none transition-all"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto pr-1 no-scrollbar">
            {filteredCoupons.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Ticket size={24} className="mx-auto text-slate-200 mb-1.5" />
                <p className="text-xs font-bold uppercase tracking-wider">No Coupon Matches Found</p>
              </div>
            ) : (
              filteredCoupons.map((coupon) => (
                <div 
                  key={coupon.id} 
                  className={`p-4 my-2 border rounded-2xl space-y-3 transition-all ${
                    coupon.is_active 
                      ? "bg-slate-50/40 border-slate-100/80" 
                      : "bg-rose-50/10 border-rose-100/40 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 truncate">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        coupon.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        {coupon.discount_type === "percentage" ? <Percent size={13} /> : <IndianRupee size={13} />}
                      </div>
                      
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono text-sm font-black text-slate-900 uppercase tracking-wider">{coupon.code}</p>
                          <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-mono font-black">
                            {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 block mt-0.5">MIN REQ: ₹{coupon.min_order_amount}</span>
                      </div>
                    </div>

                    {/* INTERACTIVE ACTIONS SLIDER SWITCH */}
                    <button
                      type="button"
                      disabled={processingId === coupon.id}
                      onClick={() => handleToggleState(coupon.id, coupon.is_active)}
                      className={`h-8 px-3 cursor-pointer rounded-lg border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        coupon.is_active
                          ? "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                      }`}
                    >
                      {processingId === coupon.id ? (
                        <Loader2 size={10} className="animate-spin text-slate-400" />
                      ) : coupon.is_active ? (
                        <EyeOff size={10} className="text-rose-700" />
                      ) : (
                        <Eye size={10} className="text-emerald-700" />
                      )}
                      <span>{coupon.is_active ? "Disable" : "Enable"}</span>
                    </button>
                  </div>

                  {/* Secondary Parameters Metadata Info strip footer */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} className="text-slate-300" />
                      <span>Expires: {new Date(coupon.end_date).toLocaleDateString("en-IN", { dateStyle: "short" })}</span>
                    </div>
                    <div className="text-right">
                      <span>Usage Pool: <b className="text-slate-700">{coupon.used_count || 0}</b> / {coupon.usage_limit || "∞"}</span>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}