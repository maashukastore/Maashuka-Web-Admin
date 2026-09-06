"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, Edit3, Layers, Package, Percent, Calendar, 
  Eye, EyeOff, ShieldCheck, AlertCircle, Info, Image as ImageIcon, X 
} from "lucide-react";

export default function ProductView({ product }) {
  const [variantFilter, setVariantFilter] = useState("all"); // "all" | "active" | "inactive"
  
  // 🌟 State parameters handling full screen image lightbox viewport modals
  const [activeLargeImage, setActiveLargeImage] = useState(null);

  // Filter variant list rows dynamically based on chosen status filters
  const filteredVariants = product.product_variants?.filter(v => {
    if (variantFilter === "active") return v.is_active === true;
    if (variantFilter === "inactive") return v.is_active === false;
    return true;
  }) || [];

  const totalStockPool = product.product_variants?.reduce((acc, v) => acc + v.stock_quantity, 0) || 0;

  return (
    <div className="space-y-10 text-left pb-20 animate-in fade-in duration-300 relative">
      
      {/* TOP HEADER CONTROLS ACTIONS HUB */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400">
            <Link href="/dashboard/products" className="hover:text-primary transition-colors flex items-center gap-1 text-xs font-medium">
              <ArrowLeft size={14} /> <span>Back to Standard Catalog</span>
            </Link>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Product Blueprint Profile</h1>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className={`h-11 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm ${
            product.is_active 
              ? "bg-emerald-50/60 text-emerald-700 border-emerald-200" 
              : "bg-rose-50 text-rose-600 border-rose-200"
          }`}>
            {product.is_active ? <Eye size={14} className="text-emerald-600" /> : <EyeOff size={14} />}
            <span>{product.is_active ? "Live on Storefront" : "Archived / Hidden"}</span>
          </span>

          <Link
            href={`/dashboard/products/edit/${product.id}`}
            className="h-11 px-5 bg-primary hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 cursor-pointer grow sm:grow-0"
          >
            <Edit3 size={14} />
            <span>Modify Sheet</span>
          </Link>
        </div>
      </div>

      {/* TWO-COLUMN MASTER SPECIFICATIONS DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COMPONENT COLUMN: CORE MASTER PARAMETERS MAP (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Info size={15} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Baseline Data Fields</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Identity Name</span>
                <p className="text-sm font-bold text-slate-800">{product.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Mapping Node</span>
                <span className="inline-block bg-slate-50 border border-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider mt-0.5">
                  {product.categories?.name || "Uncategorized"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Editorial Copy Description</span>
              <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                {product.description || "No customized content description summary provided for this sheet entry."}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-50 text-[11px] font-medium">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Baseline Price</span>
                <p className="text-sm font-black text-slate-900 font-mono">₹{product.base_price?.toLocaleString("en-IN")}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Promo Running</span>
                <p className={`text-xs font-extrabold uppercase ${product.on_sale ? "text-rose-600" : "text-slate-400"}`}>
                  {product.on_sale ? `₹${product.sale_price} Active` : "None"}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Creation Logs</span>
                <p className="text-slate-600 font-mono text-[10px]">
                  {new Date(product.created_at).toLocaleDateString("en-IN", { dateStyle: "short" })}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Catalog Balance</span>
                <p className={`text-xs font-bold ${totalStockPool === 0 ? "text-rose-600" : "text-slate-800"}`}>
                  {totalStockPool} Units Left
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT COLUMN: MASTER FALLBACK MEDIA CANVAS STRIP (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <ImageIcon size={15} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Master Blueprint Media fallback Array</h3>
          </div>

          {!product.images || product.images.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
              <Package size={32} strokeWidth={1.5} />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1.5">No Base Images Bound</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {product.images.map((url, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveLargeImage(url)}
                  className="relative aspect-[3/4] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-sm group cursor-zoom-in active:scale-[0.98] transition-transform"
                >
                  <Image src={url} alt="Master asset node index" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* LOWER SECTION AREA: THE ADVANCED VARIATIONS INSPECTION DESK */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">SKU Multi-Dimensional Variations Rows Matrix</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tracks localized inventory balances, custom price structures, and standalone R2 gallery files mapping loops.</p>
            </div>
          </div>

          <div className="flex p-0.5 bg-slate-100 border border-slate-200/60 rounded-xl self-start sm:self-auto select-none">
            {[
              { id: "all", label: "Show All" },
              { id: "active", label: "Active Matrix" },
              { id: "inactive", label: "Archived / Inactive" }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setVariantFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  variantFilter === tab.id ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredVariants.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border border-dashed border-slate-100 rounded-2xl">
              <AlertCircle size={24} className="mx-auto text-slate-300 mb-1.5" />
              <p className="text-xs font-bold uppercase tracking-wider">No SKU variant matches found</p>
            </div>
          ) : (
            filteredVariants.map((variant) => (
              <div 
                key={variant.id} 
                className={`p-5 border rounded-2xl grid grid-cols-1 xl:grid-cols-12 gap-6 items-start transition-all ${
                  variant.is_active 
                    ? "bg-slate-50/40 border-slate-100" 
                    : "bg-rose-50/20 border-rose-100/60 opacity-80"
                }`}
              >
                
                {/* Variant Info Details Matrix Pane (Col 4) */}
                <div className="xl:col-span-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-5 h-5 rounded-full border border-slate-200 shadow-inner shrink-0" 
                      style={{ backgroundColor: variant.color_hex || "#CCCCCC" }}
                    />
                    <div className="truncate">
                      <h4 className="font-mono text-sm font-black text-slate-900 uppercase tracking-wide truncate">{variant.sku}</h4>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">ROW TOKEN ID: {variant.id}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-500 bg-white p-3 border border-slate-100 rounded-xl shadow-sm">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Palette Shade</span>
                      <span className="text-slate-800 font-bold">{variant.color}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Sizing Segment</span>
                      <span className="text-slate-800 font-bold">{variant.size}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border flex items-center gap-1 ${
                      variant.is_active 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}>
                      {variant.is_active ? <ShieldCheck size={11} className="text-emerald-600" /> : <EyeOff size={11} />}
                      <span>{variant.is_active ? "Active Matrix" : "Disabled Row"}</span>
                    </span>

                    <span className={`text-[9px] font-mono font-black px-2.5 py-1 rounded border ${
                      variant.stock_quantity === 0 
                        ? "bg-rose-50 text-rose-600 border-rose-100" 
                        : variant.stock_quantity < 5 
                        ? "bg-amber-50 text-amber-600 border-amber-100" 
                        : "bg-slate-50 text-slate-700 border-slate-100"
                    }`}>
                      {variant.stock_quantity} Units left
                    </span>
                  </div>
                </div>

                {/* Variant-Specific Gallery Media Viewport Module (Col 8) */}
                <div className="xl:col-span-8 space-y-2">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Dedicated Variant Media Strip (R2 Storage Paths)</span>
                  
                  {!variant.variant_image || variant.variant_image.length === 0 ? (
                    <div className="p-6 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-slate-400 font-medium text-xs shadow-inner">
                      <ImageIcon size={14} className="text-slate-300" />
                      <span>No explicit asset images mapped to this color line. Falling back to parent catalog configurations.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 bg-white p-3 border border-slate-100 rounded-xl shadow-sm">
                      {variant.variant_image.map((mediaUrl, mIdx) => (
                        <div 
                          key={mIdx} 
                          onClick={() => setActiveLargeImage(mediaUrl)}
                          className="relative aspect-[3/4] w-full bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shadow-sm group cursor-zoom-in active:scale-[0.98] transition-transform"
                        >
                          <Image 
                            src={mediaUrl} 
                            alt={`${variant.sku} asset thumbnail iteration`} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* 🌟 FULL SCREEN LIGHTBOX MODAL PORTAL PORT WRAPPER */}
      {activeLargeImage && (
        <div 
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setActiveLargeImage(null)}
        >
          <button 
            type="button"
            onClick={() => setActiveLargeImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all shadow cursor-pointer border border-white/10 hover:scale-105"
            title="Close Preview"
          >
            <X size={18} />
          </button>
          
          <div 
            className="relative w-full max-w-3xl aspect-[3/4] sm:max-h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 bg-slate-950 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevents accidental closing when clicking image card surface
          >
            <Image 
              src={activeLargeImage} 
              alt="High resolution blueprint node view" 
              fill 
              className="object-contain p-2"
              priority
            />
          </div>
        </div>
      )}

    </div>
  );
}