"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, UploadCloud, Layers, ShieldCheck, Loader2, X, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { updateCatalogRecord } from "../../dashboard/action";
import { sileo } from "sileo";

export default function EditProductForm({ product, categories }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Core Form State initialization with is_active fallback support
  const [formState, setFormState] = useState({
    name: product.name || "",
    category_id: product.category_id || "",
    description: product.description || "",
    base_price: product.base_price || "",
    is_active: product.is_active !== undefined ? product.is_active : true, 
  });

  // Track variation lines array metrics mapping fields with explicit is_active states
  const [variants, setVariants] = useState(
    product.product_variants?.map(v => ({ 
      ...v, 
      localFiles: [], 
      isNew: false,
      is_active: v.is_active !== undefined ? v.is_active : true 
    })) || []
  );

  const updateVariantRowValue = (id, field, value) => {
    // Prevent activating a variant when the parent product is inactive
    if (field === "is_active" && value === true && !formState.is_active) {
      sileo.error({ title: "Product Inactive", description: "Activate the product before enabling variants.", fill: "black" });
      return;
    }
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const appendBlankVariantLine = () => {
    const temporaryId = `new-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setVariants([...variants, { id: temporaryId, sku: "", color: "", color_hex: "#000000", size: "Standard", variant_price: formState.base_price, stock_quantity: "", is_active: true, localFiles: [], variant_image: [], isNew: true }]);
  };

  const removeVariantRow = (id) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  // Inline array cleanups removing target URL files inside states
  const removeExistingVariantImage = (variantId, imagePath) => {
    setVariants(variants.map(v => {
      if (v.id === variantId) {
        return { ...v, variant_image: v.variant_image.filter(img => img !== imagePath) };
      }
      return v;
    }));
  };

  const handleMediaFileStack = (id, files) => {
    const freshArray = Array.from(files);
    setVariants(variants.map(v => v.id === id ? { ...v, localFiles: [...v.localFiles, ...freshArray] } : v));
  };

  // Core background network connection piping files straight to R2 buckets storage nodes
  const executeR2StorageUploadPipeline = async (files) => {
    const absoluteUrls = [];
    for (const file of files) {
      const tokenRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      const { signedUrl, publicUrl } = await tokenRes.json();

      await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      absoluteUrls.push(publicUrl);
    }
    return absoluteUrls;
  };

  const handleUpdateSubmission = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      sileo.success({ 
        title: "Sync Routine Initiated", 
        description: "Verifying binary updates across Cloudflare R2 partitions...",
        fill: "black"
      });
      
      const processedVariantsArray = [];
      const aggregateMasterImagesList = [];

      for (const variant of variants) {
        let activeUrlsList = [...(variant.variant_image || [])];
        
        if (variant.localFiles && variant.localFiles.length > 0) {
          const freshR2Paths = await executeR2StorageUploadPipeline(variant.localFiles);
          activeUrlsList.push(...freshR2Paths);
        }
        
        aggregateMasterImagesList.push(...activeUrlsList);
        processedVariantsArray.push({ ...variant, variant_image: activeUrlsList });
      }

      const response = await updateCatalogRecord(product.id, {
        ...formState,
        variants: processedVariantsArray,
        globalImages: aggregateMasterImagesList
      });

      if (response.success) {
        sileo.success({ title: "Catalog Synchronized", description: response.message, fill: "black" });
        router.push(`/dashboard/products/view/${product.id}`);
        router.refresh();
      } else {
        sileo.error({ title: "Update Refused", description: response.message });
      }
    } catch (err) {
      console.error("Mutation processing crash catch loops:", err);
      sileo.error({ title: "Transaction Crash", description: "Internal runtime failure encountered." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleUpdateSubmission} className="space-y-10 pb-24 font-sans text-left">
      
      {/* TRANSACTION CONTROLS TOP FLIGHT BUTTONS HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-0.5">
          {/* 🌟 Mapped link hover profile to primary layout colors */}
          <div className="flex items-center gap-2 text-slate-400">
            <Link href="/dashboard/products" className="hover:text-primary transition-colors"><ArrowLeft size={14} /></Link>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Catalog Manifest</span>
          </div>
          <h2 className="text-xl font-serif font-black text-slate-900 truncate max-w-md">Edit: {product.name}</h2>
        </div>
        
        {/* 🌟 Redesigned Commit Button with 'bg-primary' tokens */}
        <button
          type="submit"
          disabled={saving}
          className="h-12 px-6 bg-primary hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-slate-50 disabled:text-slate-300 shadow-sm cursor-pointer w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin text-white" />
              <span>Updating Storage Arrays...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              <span>Commit Changes</span>
            </>
          )}
        </button>
      </div>

      {/* TWO COLUMN SPECIFICATIONS EDITING BLOCKS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-3">Core Base parameters</h3>
          
          {/* 🌟 Interactive fields focus modified to focus:border-primary */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Public Title</label>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description Content Summary Copy</label>
            <textarea
              rows={5}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-primary focus:bg-white transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-3">Financial & Visibility Allocation</h3>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Taxonomy Assignment</label>
            <select
              value={formState.category_id}
              onChange={(e) => setFormState({ ...formState, category_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 rounded-xl outline-none focus:border-primary focus:bg-white"
              required
            >
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baseline Base Price (₹)</label>
            <input
              type="number"
              value={formState.base_price}
              onChange={(e) => setFormState({ ...formState, base_price: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-black text-slate-900 outline-none focus:border-primary focus:bg-white transition-all"
              required
            />
          </div>

          {/* GLOBAL PRODUCT CHANNEL VISIBILITY SLIDER */}
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Storefront Channel Availability</label>
            <button
              type="button"
              onClick={() => {
                const newActive = !formState.is_active;
                setFormState({ ...formState, is_active: newActive });
                if (!newActive) {
                  setVariants(prev => prev.map(v => ({ ...v, is_active: false })));
                }
              }}
              disabled={saving}
              className={`w-full px-4 py-3 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                formState.is_active 
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-800 font-bold" 
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                {formState.is_active ? <Eye size={14} className="text-emerald-600" /> : <EyeOff size={14} />}
                <span>{formState.is_active ? "Live & Active in Search" : "Archived / Hidden"}</span>
              </div>
              <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${formState.is_active ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${formState.is_active ? 'translate-x-3' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* MATRIX CONFIGURATION SEGMENT LAYER */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            {/* 🌟 Accent header icon customized to text-primary */}
            <Layers size={15} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">SKU Variants Architecture Matrix</h3>
          </div>
          {/* 🌟 Updated Add dimension link to hover with matching text-primary bounds */}
          <button
            type="button"
            onClick={appendBlankVariantLine}
            className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-primary hover:border-primary/20 transition-all rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} /> Add Dimension SKU
          </button>
        </div>

        <div className="space-y-6">
          {variants.map((variant, index) => (
            <div key={variant.id} className={`p-5 border rounded-2xl space-y-5 relative ${notVariantActive(variant) ? 'bg-rose-50/10 border-rose-100/70' : 'bg-slate-50/40 border-slate-100'}`}>
              <div className="absolute top-4 right-4 flex items-center gap-4">
                
                {/* 🌟 Individual checkbox updated with accent-primary controls */}
                <label className="flex items-center gap-1.5 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variant.is_active}
                    onChange={(e) => updateVariantRowValue(variant.id, "is_active", e.target.checked)}
                    className="w-3.5 h-3.5 accent-primary rounded cursor-pointer border-slate-300"
                    disabled={saving}
                  />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${variant.is_active ? "text-emerald-700" : "text-slate-400"}`}>
                    Variant Active
                  </span>
                </label>

                <div className="w-px h-3 bg-slate-200" />

                <span className="text-[9px] font-mono font-bold text-slate-300 uppercase">
                  {variant.isNew ? "New Entry Queue" : "Live Row Segment"}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariantRow(variant.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* INPUT FIELDS CELLS MATRIX STRIP */}
              {/* 🌟 Updated focus styles across all sub fields to reference focus:border-primary values */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">SKU String Identity Code</label>
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => updateVariantRowValue(variant.id, "sku", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Color Swatch Name Descriptor</label>
                  <input
                    type="text"
                    value={variant.color}
                    onChange={(e) => updateVariantRowValue(variant.id, "color", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Hex Swatch Interface Mapping</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={variant.color_hex}
                      onChange={(e) => updateVariantRowValue(variant.id, "color_hex", e.target.value)}
                      className="w-10 h-10 p-0.5 bg-white border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={variant.color_hex}
                      onChange={(e) => updateVariantRowValue(variant.id, "color_hex", e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Available Stock Threshold Pool</label>
                  <input
                    type="number"
                    value={variant.stock_quantity}
                    onChange={(e) => updateVariantRowValue(variant.id, "stock_quantity", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              {/* MEDIA GALLERY VISUAL MAP MANAGER ROW */}
              <div className="space-y-3.5">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Variant Media Asset Management Matrix (R2)</label>
                
                {/* Visual grid layout showing current active image blocks inside the bucket */}
                {variant.variant_image?.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-3">
                    {variant.variant_image.map((img, iIdx) => (
                      <div key={iIdx} className="relative aspect-[3/4] bg-white border border-slate-100 rounded-xl overflow-hidden group shadow-sm">
                        <Image src={img} alt="active variant visual block" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingVariantImage(variant.id, img)}
                          className="absolute inset-0 bg-rose-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-white cursor-pointer"
                          title="Purge Image Asset Path Reference"
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cloudflare Binary Append Upload Field Box */}
                {/* 🌟 Upload interface boundary shifts color on focus matching 'hover:border-primary' */}
                <div className="p-5 border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-xl bg-white flex flex-col items-center justify-center gap-1.5 transition-all relative cursor-pointer group">
                  <UploadCloud size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-primary transition-colors">Append fresh variant images straight into R2 partitions</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleMediaFileStack(variant.id, e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>

                {/* Local Choice Append Indicator Nodes */}
                {variant.localFiles?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {variant.localFiles.map((f, fIdx) => (
                      <span key={fIdx} className="bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/10 text-[9px] font-mono font-bold">
                        ➕ {f.name.slice(0, 12)}... ({(f.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

    </form>
  );

  // Status mapping layout checker helper
  function notVariantActive(v) {
    return v.is_active === false;
  }
}