"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Clock,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  CreditCard,
  Ticket,
  ImageIcon,
  AlertCircle,
  Truck,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Box,
  CornerDownRight,
  Sparkles,
  X,
  Layers,
  Activity
} from "lucide-react";
import { updateOrderStatus } from "../../dashboard/action";
import { sileo } from "sileo";

export default function OrderView({ initialOrder }) {
  const [currentStatus, setCurrentStatus] = useState(initialOrder?.status || "Pending");
  const [updating, setUpdating] = useState(false);

  // 🌟 Modal State Managers
  const [activeMediaGallery, setActiveMediaGallery] = useState(null); 
  const [modalMainImage, setModalMainImage] = useState("");
  const [showShipmentModal, setShowShipmentModal] = useState(false); // ◄ Tracking Ledger Modal Toggle State Trigger

  if (!initialOrder || !initialOrder.id) {
    return (
      <div className="p-16 text-center space-y-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm max-w-md mx-auto mt-20 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
          <AlertCircle size={24} className="animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Order Reference Lost</h3>
          <p className="text-xs text-slate-400 leading-relaxed">Fulfillment token context data is corrupted, invalid, or missing from the stream.</p>
        </div>
        <Link href="/dashboard/orders" className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white px-5 h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors w-full">
          Return to Queue
        </Link>
      </div>
    );
  }

  const handleStatusShift = async (targetState) => {
    try {
      setUpdating(true);
      const res = await updateOrderStatus(initialOrder.id, targetState);
      if (res.success) {
        setCurrentStatus(targetState);
        sileo.success({ title: "Fulfillment Managed", description: res.message, fill: "black" });
      } else {
        sileo.error({ title: "Transition Denied", description: res.message, fill: "black" });
      }
    } catch (err) {
      console.error(err);
      sileo.error({ title: "Internal Runtime Error", fill: "black" });
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateShipment = async () => {
    try {
      setUpdating(true);
      const response = await fetch("/api/cron/create-shipment", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        sileo.success({ title: "Shipment Created", description: data.message, fill: "black" });
      } else {
        sileo.error({ title: "Shipment Creation Failed", description: data.message, fill: "black" });
      }
    } catch (error) {
      console.error(error);
      sileo.error({ title: "Internal Error", description: "Failed to create shipment.", fill: "black" });
    } finally {
      setUpdating(false);
    }
  };

  const totalUnitsPacked = initialOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const shipment = initialOrder.shipment;
  const allShipments = initialOrder.shipments || [];

  const stages = ["Pending", "Processing", "Processed", "Dispatched", "Delivered"];
  const currentStageIndex = stages.indexOf(currentStatus);

  const triggerImageZoomPortal = (variantImages) => {
    if (!variantImages || variantImages.length === 0) return;
    setActiveMediaGallery(variantImages);
    setModalMainImage(variantImages[0]);
  };

  return (
    <div className="space-y-6 text-left pb-24 animate-in fade-in duration-500 relative select-none">
      
      {/* ─── LAYER 1: BRAND ACTION HEADER ─── */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <Link href="/dashboard/orders" className="group text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> 
            <span>Back to Orders Queue</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-serif font-black text-slate-900 select-text tracking-tight">#{initialOrder.order_id ? initialOrder.order_id.toUpperCase() : initialOrder.id.slice(0, 8).toUpperCase()}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
            {updating ? <Clock size={14} className="animate-spin text-primary" /> : <Box size={14} />}
            <span>Pipeline State:</span>
          </div>
          <select
            value={currentStatus}
            disabled={updating}
            onChange={(e) => handleStatusShift(e.target.value)}
            className="w-full md:w-auto h-11 text-sm px-4 text-primary font-black uppercase tracking-wider rounded-xl border border-slate-200 outline-none cursor-pointer transition-all shadow-sm hover:border-slate-300 focus:border-primary bg-white"
          >
            {stages.map((stage) => (
              <option key={stage} value={stage} className="text-slate-800">{stage} Route</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── LAYER 2: INTERACTIVE LIFECYCLE LINE TRACKER ─── */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between min-w-[640px] relative px-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500 ease-in-out" 
            style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
          />
          
          {stages.map((stage, index) => {
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center gap-2 group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                  isCompleted 
                    ? "bg-primary text-white ring-4 ring-primary/10" 
                    : "bg-white text-slate-300 border border-slate-200"
                }`}>
                  {isCompleted && !isCurrent ? <CheckCircle2 size={14} /> : <span className="text-xs font-mono font-black">{index + 1}</span>}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${isCurrent ? "text-primary font-black" : isCompleted ? "text-slate-500" : "text-slate-300"}`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── LAYER 3: FOUR-COLUMN OPERATIONAL SUMMARY GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Module A: Buyer Parameters */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
              <User size={14} className="text-slate-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buyer Core Info</h4>
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-black text-slate-900">{initialOrder.address?.full_name || "Boutique Customer"}</p>
              <p className="text-slate-400 font-mono text-[11px] truncate">{initialOrder.address?.email || "No Email Available"}</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 h-9 flex items-center gap-2 border border-slate-100/60 mt-auto">
            <Phone size={12} className="text-slate-400" />
            <span className="font-mono text-[11px] font-bold text-slate-700">{initialOrder.address?.phone_number || "No Contact Link"}</span>
          </div>
        </div>

        {/* Module B: Logistics Destination */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
            <MapPin size={14} className="text-slate-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logistics Drop-point</h4>
          </div>
          {initialOrder.address ? (
            <div className="text-xs text-slate-600 font-medium space-y-0.5 leading-relaxed">
              <p className="truncate font-black text-slate-900">{initialOrder.address.address_line1}</p>
              <p className="truncate text-slate-400 font-bold">{initialOrder.address.city}, {initialOrder.address.state}</p>
              <div className="inline-flex text-[9px] font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-black text-slate-600 uppercase tracking-wider">
                PIN {initialOrder.address.pincode}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-300 italic">No coordinates stored.</p>
          )}
        </div>

        {/* Module C: Carrier Engine Manifest */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-slate-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">eKart Integration</h4>
              </div>
              {shipment && (
                <button 
                  onClick={() => setShowShipmentModal(true)}
                  className="px-2 py-0.5 rounded text-[8px] font-mono font-black border bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer flex items-center gap-1"
                >
                  <Activity size={8} />
                  <span>View History ({allShipments.length})</span>
                </button>
              )}
            </div>

            {shipment ? (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-2.5 h-9">
                <span className="font-mono text-xs font-black tracking-wider text-slate-800 truncate">{shipment.tracking_number}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => window.open(`https://www.ekartlogistics.com/track/${shipment.tracking_number}`, '_blank')} className="text-slate-400 hover:text-primary p-1 transition-colors cursor-pointer">
                    <ExternalLink size={12} />
                  </button>
                  <button onClick={handleCreateShipment} className="text-slate-400 hover:text-primary p-1 transition-colors cursor-pointer" title="Sync API">
                    <Clock size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-9 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Awaiting Sync Trigger</span>
              </div>
            )}
          </div>

          {shipment?.estimated_delivery && (
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[9px] pt-1">
              <Calendar size={10} />
              <span>Est Delivery: <b className="text-slate-700">{new Date(shipment.estimated_delivery).toLocaleDateString("en-IN", { dateStyle: "short" })}</b></span>
            </div>
          )}
        </div>

        {/* Module D: Financial Ledger */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
              <div className="flex items-center gap-2">
                <CreditCard size={14} className="text-slate-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Ledger</h4>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black border ${
                initialOrder.payment_status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
              }`}>
                {initialOrder.payment_status === "paid" ? "Captured" : "Unpaid"}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gate Total</span>
              <h3 className="text-xl font-black text-slate-900 font-mono">
                ₹{initialOrder.payable_amount?.toLocaleString("en-IN")}
              </h3>
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-400 border-t border-slate-50 pt-2 flex justify-between">
            <span>Route: {initialOrder.payment_mode || "Prepaid"}</span>
            <span>Shipping Fee: {initialOrder.shipping_cost ? `₹${initialOrder.shipping_cost}` : "Free Tier"}</span>
          </div>
        </div>

      </div>

      {/* ─── LAYER 4: DETAILED ITEM BASKET CANVAS ─── */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={15} className="text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Itemized Basket Breakdown ({totalUnitsPacked} units)
            </h3>
          </div>
          <span className="text-[10px] font-mono bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-md font-bold">
            SKU Package Units
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {!initialOrder.items || initialOrder.items.length === 0 ? (
            <div className="py-16 text-center text-slate-300 space-y-2">
              <AlertCircle size={32} className="mx-auto stroke-1" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">No Linked Variants Captured</p>
            </div>
          ) : (
            initialOrder.items.map((item, idx) => {
              const variant = item.product_variants;
              const product = variant?.products;
              const previewAssetUrl = variant?.variant_image?.[0];
              const allVariantImages = variant?.variant_image || [];

              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-5 first:pt-0 last:pb-0 gap-6 group hover:bg-slate-50/30 rounded-xl transition-colors px-1">
                  <div className="flex gap-4 items-center text-left">
                    <div 
                      onClick={() => allVariantImages.length > 0 && triggerImageZoomPortal(allVariantImages)}
                      className={`relative w-14 h-16 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shrink-0 shadow-sm transition-all ${
                        allVariantImages.length > 0 ? "cursor-zoom-in group-hover:scale-[1.04] active:scale-[0.98]" : ""
                      }`}
                    >
                      {previewAssetUrl ? (
                        <Image src={previewAssetUrl} alt="Variant view" fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                          <ImageIcon size={16} />
                        </div>
                      )}
                      {allVariantImages.length > 1 && (
                        <div className="absolute bottom-0.5 right-0.5 bg-slate-900/70 text-white font-mono text-[7px] font-bold px-1 rounded-sm select-none">
                          +{allVariantImages.length - 1}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">
                        {product?.name || "Boutique Apparel Unit"}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-mono tracking-wider">SKU: {variant?.sku || "N/A"}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-600 uppercase text-[9px]">Size: {variant?.size || "U"}</span>
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-600 uppercase text-[9px]">Color: {variant?.color || "N/A"}</span>
                          <div 
                            className="w-4 h-4 rounded-full border border-slate-200 shadow-inner shrink-0 ml-0.5" 
                            style={{ backgroundColor: variant?.color_hex || "#CCCCCC" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-slate-50/50 sm:bg-transparent p-3 sm:p-0 rounded-xl gap-1">
                    <div className="text-[10px] text-slate-400 font-medium font-mono">
                      ₹{Number(item.price).toLocaleString("en-IN")} × {item.quantity}
                    </div>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      ₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── LAYER 5: PROMOTIONAL FOOTNOTES ─── */}
      {initialOrder.coupon && (
        <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-[2rem] p-5 flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
              <Ticket size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Promotional Adjustment Rules Applied</h4>
                <span className="font-mono text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">{initialOrder.coupon.code}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                <CornerDownRight size={10} className="text-emerald-500" />
                Ledger deducted: <b className="text-emerald-800 font-mono font-black">{initialOrder.coupon.discount_value}{initialOrder.coupon.discount_type === "percentage" ? "%" : " ₹"}</b> off wholesale lines.
              </p>
            </div>
          </div>
          <Sparkles size={16} className="text-emerald-600/30 shrink-0 hidden sm:block animate-pulse" />
        </div>
      )}

      {/* ─── LAYER 6: MULTI-IMAGE LIGHTBOX PREVIEW MODAL GATEWAY ─── */}
      {activeMediaGallery && (
        <div 
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex flex-col md:flex-row items-center justify-center p-4 md:p-8 select-none animate-in fade-in duration-200"
          onClick={() => setActiveMediaGallery(null)}
        >
          <button 
            type="button"
            onClick={() => setActiveMediaGallery(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all cursor-pointer z-50 shadow-lg hover:scale-105"
          >
            <X size={16} />
          </button>

          <div 
            className="w-full max-w-4xl bg-white border border-slate-100 rounded-[2.5rem] p-4 md:p-6 shadow-2xl flex flex-col md:flex-row gap-6 items-stretch animate-in zoom-in-95 duration-200 text-left max-h-[90vh] md:max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 relative aspect-[3/4] md:h-[65vh] bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
              <Image src={modalMainImage} alt="Enlarged variant package image frame" fill className="object-contain p-2 animate-in fade-in duration-150" priority />
            </div>

            {activeMediaGallery.length > 1 && (
              <div className="md:w-32 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pr-0 md:pr-1 no-scrollbar shrink-0 h-16 md:h-auto py-1 justify-start">
                {activeMediaGallery.map((imgUrl, thumbIdx) => {
                  const isCurrentThumb = imgUrl === modalMainImage;
                  return (
                    <div 
                      key={thumbIdx}
                      onClick={() => setModalMainImage(imgUrl)}
                      className={`relative w-12 h-14 md:w-full md:aspect-[3/4] bg-slate-50 border rounded-xl overflow-hidden cursor-pointer transition-all shrink-0 shadow-sm ${
                        isCurrentThumb ? "border-primary ring-2 ring-primary/10 scale-95" : "border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <Image src={imgUrl} alt="Gallery catalog item navigation" fill className="object-cover" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 🌟 LAYER 7: NEW ACTIVE SHIPMENTS HISTORY LEDGER MODAL ─── */}
      {showShipmentModal && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowShipmentModal(false)}
        >
          <div 
            className="bg-white border border-slate-100 shadow-2xl rounded-[2.5rem] p-6 w-full max-w-2xl text-left max-h-[85vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2 text-primary">
                <Truck size={16} />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Shipment Fulfillment Timeline Matrix</h3>
              </div>
              <button 
                onClick={() => setShowShipmentModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {allShipments.length === 0 ? (
                <p className="text-xs font-medium text-slate-400 text-center py-8">No historical tracking runs available for this workspace target.</p>
              ) : (
                allShipments.map((ship, idx) => (
                  <div key={ship.id || idx} className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-3 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-1 bg-primary/20" />
                    
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Carrier Identifier</span>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-wide">{ship.carrier_name || "eKart Logistics"}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black border uppercase ${
                        ship.delivery_status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-primary/5 text-primary border-primary/20'
                      }`}>
                        {ship.delivery_status || "Dispatched"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100/60 text-xs">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block">Waybill Tracking Reference</span>
                        <span className="font-mono font-bold text-slate-800">{ship.tracking_number || "Awaiting Token"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block">Est Delivery Threshold</span>
                        <span className="font-sans font-bold text-slate-700">
                          {ship.estimated_delivery ? new Date(ship.estimated_delivery).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1">
                      <span>RUN LOG ID: {String(ship.id).slice(0, 8).toUpperCase()}</span>
                      <span>Synced: {new Date(ship.created_at).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}