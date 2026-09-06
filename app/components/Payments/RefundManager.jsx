"use client";
import { useState } from "react";
import { Search, Loader2, Package, Layers, ShieldCheck, Coins, Square, CheckCircle2, History } from "lucide-react";
import { getOrderRefundContext, submitRefundMutation } from "../../controllers/payments/action";
import { sileo } from "sileo";

export default function RefundManager() {
  const [orderQuery, setOrderQuery] = useState("");
  const [fetching, setFetching] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const [order, setOrder] = useState(null);
  const [historicRefunds, setHistoricRefunds] = useState([]);
  const [refundScope, setRefundScope] = useState("full");
  const [selectedItems, setSelectedItems] = useState({}); // { [order_item_id]: { qty, price } }

  const handleFetchOrderData = async (e) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    setFetching(true);
    setOrder(null);
    setHistoricRefunds([]);
    setSelectedItems({});

    try {
      const result = await getOrderRefundContext(orderQuery.trim());

      if (result.success && result.order) {
        const refundsData = result.historicRefunds || [];
        const dynamicHasFullRefund = refundsData.some(r => r.type === "full");
        const dynamicHasPartialRefund = refundsData.some(r => r.type === "partial");

        setOrder(result.order);
        setHistoricRefunds(refundsData);
        
        if (dynamicHasFullRefund) {
          setRefundScope("full");
        } else if (dynamicHasPartialRefund) {
          setRefundScope("partial");
        } else {
          setRefundScope("full");
        }

        sileo.success({ title: "Manifest Synced", description: "Order allocations decrypted.", fill: "black" });
      } else {
        sileo.error({ title: "Fetch Aborted", description: result.message || "Invalid order entry query.", fill: "black" });
      }
    } catch (err) {
      sileo.error({ title: "Fetch Aborted", description: "Internal client pipeline tracking failure.", fill: "black" });
    } finally {
      setFetching(false);
    }
  };

  const toggleItemSelection = (itemId, maxAvailableQty, price) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      if (updated[itemId]) {
        delete updated[itemId];
      } else {
        updated[itemId] = { qty: 1, maxQty: maxAvailableQty, price: Number(price) };
      }
      return updated;
    });
  };

  const adjustPartialQuantity = (itemId, increment) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      if (!updated[itemId]) return prev;
      
      const nextQty = updated[itemId].qty + increment;
      if (nextQty >= 1 && nextQty <= updated[itemId].maxQty) {
        updated[itemId].qty = nextQty;
      }
      return updated;
    });
  };

  const isOrderFullyRefunded = historicRefunds.some(r => r.type === "full");
  const isOrderPartiallyRefunded = historicRefunds.some(r => r.type === "partial");

  // Filter list rows to expose remaining items with un-refunded units
  const processableItemsList = order?.items?.map(item => {
    const totalUnitsPreviouslyRefunded = item.refund_items?.reduce((acc, r) => acc + r.quantity, 0) || 0;
    const netRemainingUnrefundedUnits = item.quantity - totalUnitsPreviouslyRefunded;
    return { ...item, remainingUnits: netRemainingUnrefundedUnits };
  }).filter(item => item.remainingUnits > 0) || [];

  // 💡 FIX: Unify calculation metrics to ensure full and partial algorithms yield perfectly matching values
  const computedFullValue = processableItemsList.reduce((sum, item) => sum + (Number(item.price) * item.remainingUnits), 0);
  const computedPartialValue = Object.values(selectedItems).reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  const finalCalculatedRefundVal = refundScope === "full" ? computedFullValue : computedPartialValue;

  const handleProcessRefundExecution = async () => {
    if (!order) return;
    setProcessing(true);

    // If it's a full refund, construct the payload matching the complete remaining items context
    const itemsPayload = refundScope === "full" 
      ? processableItemsList.reduce((acc, item) => {
          acc[item.id] = { qty: item.remainingUnits, price: item.price };
          return acc;
        }, {})
      : selectedItems;

    try {
    console.log("Submitting Refund Mutation with Payload:", {
      orderId: order.id,
      paymentId: order.payment_id,
      refundType: refundScope,
      refundAmount: finalCalculatedRefundVal,
      itemsRefunded: itemsPayload
    });
      const payload = {
        orderId: order.id,
        paymentId: order.payment_id,
        refundType: refundScope,
        refundAmount: finalCalculatedRefundVal,
        itemsRefunded: itemsPayload
      };

      const res = await fetch(`/api/razorpay/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
      // const result = await submitRefundMutation({
      //   orderId: order.id,
      //   paymentId: "pay_SumTHxPLSPErIr", 
      //   refundType: refundScope,
      //   refundAmount: finalCalculatedRefundVal,
      //   itemsRefunded: itemsPayload
      // });
      const result = await res.json();

      if (result.success) {
        sileo.success({ title: "Ledger Settled", description: result.message, fill: "black" });
        setOrder(null);
        setOrderQuery("");
      } else {
        sileo.error({ title: "Execution Refused", description: result.message, fill: "black" });
      }
    } catch (err) {
      sileo.error({ title: "Runtime Exception", description: "Internal API channel crash.", fill: "black" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SELECTION LOOKUP FORM CONTROLS BAR */}
      <form onSubmit={handleFetchOrderData} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl focus-within:border-primary transition-all flex-1 shadow-sm">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search order hash token to inspect refunds..."
            value={orderQuery}
            onChange={(e) => setOrderQuery(e.target.value)}
            className="bg-transparent text-xs font-medium w-full outline-none text-slate-800 font-mono focus:bg-white"
            required
            disabled={fetching || processing}
          />
        </div>
        <button
          type="submit"
          disabled={fetching || !orderQuery.trim() || processing}
          className="h-[44px] px-6 bg-primary hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-50 disabled:text-slate-300 cursor-pointer shrink-0 animate-in fade-in"
        >
          {fetching ? <Loader2 size={14} className="animate-spin text-white" /> : <span>Inspect Order</span>}
        </button>
      </form>

      {/* RENDER MASTER WORKSPACE ENGINE SLICES */}
      {order && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
          
          {/* LEFT LAYOUT TILES SHEET: CORE INTERACTION SPACE (Col 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Condition 1: Full Refund Already Locked Banner */}
            {isOrderFullyRefunded && (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-[2rem] flex items-center gap-3 text-emerald-900 text-xs font-medium border-emerald-100">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-black uppercase tracking-wider text-[10px] text-emerald-800">This order has already recorded for refund. </p>
                  {/* <p className="text-slate-500 mt-0.5">This order has already recorded for refund. <br></br> */}
                    <span className="font-bold text-primary">Current status:</span><span className="font-bold text-primary uppercase"> {` ${historicRefunds.find(r => r.type === "full")?.status || "unknown"}`}</span>

                  {/* </p> */}
                </div>
              </div>
            )}

            {/* Scope Allocation Matrix Tabs Selector Controls */}
            {!isOrderFullyRefunded && (
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4 hover:border-slate-200/60 transition-colors">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <Layers size={14} className="text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Allocation Scope Selection Matrix</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isOrderPartiallyRefunded}
                    onClick={() => setRefundScope("full")}
                    className={`p-4 border rounded-2xl text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      refundScope === "full" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-wide">Full Order Refund</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {isOrderPartiallyRefunded ? "Disabled: Partial logs found" : "Revert total order line balances entirely."}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundScope("partial")}
                    className={`p-4 border rounded-2xl text-left transition-all cursor-pointer ${
                      refundScope === "partial" ? "border-primary bg-primary/5 text-primary" : "border-slate-100 hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    <p className="text-xs font-black uppercase tracking-wide">Partial Itemized Split</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Isolate specific, non-refunded retail variant components.</p>
                  </button>
                </div>
              </div>
            )}

            {/* Itemized Variant Selection Grid Deck */}
            {!isOrderFullyRefunded && (
              <div className={`bg-white border rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6 transition-all duration-300 ${
                refundScope === "partial" ? "border-primary/20 ring-4 ring-primary/5" : "border-slate-100 opacity-50 pointer-events-none select-none"
              }`}>
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <Package size={15} className="text-slate-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Select Non-Refunded Item Target SKU Elements</h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {processableItemsList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 font-medium">No valid un-refunded item units remain in this order.</p>
                  ) : (
                    processableItemsList.map((item) => {
                      const isSelected = !!selectedItems[item.id];
                      const v = item.product_variants;

                      return (
                        <div key={item.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleItemSelection(item.id, item.remainingUnits, item.price)}
                              className="text-slate-400 hover:text-primary transition-colors mt-0.5 shrink-0 cursor-pointer"
                            >
                              {isSelected ? <CheckCircle2 size={18} className="text-primary fill-primary/10" /> : <Square size={18} />}
                            </button>
                            <div className="space-y-0.5 text-left truncate">
                              <h4 className="text-xs font-black text-slate-900 truncate">{v?.products?.name || "Boutique Apparel Unit"}</h4>
                              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tight block">
                                SKU: {v?.sku} • Size: {v?.size} / Color: {v?.color}
                              </span>
                            </div>
                          </div>

                          {/* Incrementor split */}
                          {isSelected && (
                            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200/50 p-1 rounded-xl animate-in zoom-in-95 duration-150 shrink-0">
                              <button type="button" onClick={() => adjustPartialQuantity(item.id, -1)} className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer">-</button>
                              <span className="font-mono text-xs font-black px-1 text-slate-800">{selectedItems[item.id].qty}</span>
                              <button type="button" onClick={() => adjustPartialQuantity(item.id, 1)} className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-xs font-black text-slate-700 cursor-pointer">+</button>
                            </div>
                          )}

                          <div className="text-right shrink-0 font-mono text-xs font-black text-slate-900 pl-2">
                            <span className="text-primary">₹{Number(item.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                            <span className="text-[9px] text-slate-400 block font-normal tracking-tight font-sans mt-0.5">{item.remainingUnits} units available</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Historic Processed Remittance Log List Panel */}
            {historicRefunds.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <History size={14} className="text-slate-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Historic Refund Adjustments History Logs</h4>
                </div>
                <div className="divide-y divide-slate-50 font-mono text-xs font-medium text-slate-600">
                  {historicRefunds.map((ref, rIdx) => (
                    <div key={rIdx} className="flex justify-between py-3 first:pt-0 last:pb-0 items-center">
                      <div className="space-y-0.5 text-left">
                        <p className="font-black text-slate-800 tracking-wide select-all">{ref.refund_id}</p>
                        <span className="text-[15px] font-sans font-bold text-slate-400 block">Scope Profile: <b className="text-primary uppercase">{ref.type}</b> • {new Date(ref.created_at).toLocaleDateString("en-IN")}</span>
                      </div>
                      <span className="font-black text-slate-900 font-mono">₹{ref.amount?.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT LAYOUT TILES SHEET: CLOSING RUNTIME CALCULATIONS (Col 4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Coins size={14} className="text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Refund Summary Reconciliation</h3>
              </div>

              <div className="space-y-3 text-xs font-medium font-mono text-slate-500 border-b border-slate-50 pb-4">
                <div className="flex justify-between">
                  <span>Net Itemized Scope</span>
                  <span className="text-slate-800 font-bold">₹{computedFullValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Execution Target Type</span>
                  <span className="text-primary font-bold uppercase tracking-wider">{refundScope} Type</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="space-y-0.5 text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Total Refund Balance</span>
                  <span className="text-[10px] text-slate-400 font-medium">Excluding shipping charges</span>
                </div>
                <h2 className="text-2xl font-black text-primary font-mono tracking-tight">
                  ₹{finalCalculatedRefundVal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleProcessRefundExecution}
                disabled={processing || finalCalculatedRefundVal <= 0 || isOrderFullyRefunded}
                className="w-full h-12 bg-primary hover:opacity-90 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all active:scale-[0.98] disabled:bg-slate-50 disabled:text-slate-300 flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Processing Database Nodes...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Confirm & Authorize Refund</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}