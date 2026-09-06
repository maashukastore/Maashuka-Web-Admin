"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, UploadCloud, Layers, ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { createCompleteProduct } from "../../dashboard/action";
import { createClient } from "@/lib/supabase/client";
import { sileo } from "sileo";

export default function AddNewProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  // Core Product Payload Fields State Map
  const [productForm, setProductForm] = useState({
    name: "",
    category_id: "",
    description: "",
    base_price: "",
    is_active: true, 
  });

  // Variants Form Array List Tracking Map
  const [variants, setVariants] = useState([
    { id: 1, sku: "", color: "", color_hex: "#000000", size: "", variant_price: "", stock_quantity: "", is_active: true, localFiles: [], uploadedUrls: [] }
  ]);

  useEffect(() => {
    async function loadTaxonomies() {
      const { data } = await supabase.from("categories").select("id, name");
      if (data) setCategories(data);
    }
    loadTaxonomies();
  }, [supabase]);

  const addNewVariantRow = () => {
    const nextId = variants.length > 0 ? Math.max(...variants.map(v => v.id)) + 1 : 1;
    setVariants([...variants, { id: nextId, sku: "", color: "", color_hex: "#000000", size: "", variant_price: "", stock_quantity: "", is_active: true, localFiles: [], uploadedUrls: [] }]);
  };

  const removeVariantRow = (id) => {
    if (variants.length === 1) return sileo.error({ title: "Operation Blocked", description: "Products require at least one SKU variant." });
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariantField = (id, field, value) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleFileSelectionChange = (id, fileList) => {
    const filesArray = Array.from(fileList);
    setVariants(variants.map(v => v.id === id ? { ...v, localFiles: [...v.localFiles, ...filesArray] } : v));
  };

  const uploadFilesToCloudflareR2 = async (files) => {
    const trackingUrls = [];
    for (const file of files) {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type })
      });
      const { signedUrl, publicUrl } = await res.json();

      await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      trackingUrls.push(publicUrl);
    }
    return trackingUrls;
  };

  const handleFormSubmission = async (e) => {
    e.preventDefault();
    if (!productForm.category_id) return sileo.error({ title: "Form Error", description: "Please map a specific target category." });

    setSaving(true);
    try {
      sileo.success({ title: "Asset Upload Active", description: "Pumping file structures directly into R2 blocks..." });
      
      const processedVariants = [];
      const globalImagesCollector = [];

      for (const variant of variants) {
        let uploadedUrls = [];
        if (variant.localFiles.length > 0) {
          uploadedUrls = await uploadFilesToCloudflareR2(variant.localFiles);
          globalImagesCollector.push(...uploadedUrls);
        }
        processedVariants.push({ ...variant, uploadedUrls });
      }

      const response = await createCompleteProduct({
        ...productForm,
        variants: processedVariants,
        globalImages: globalImagesCollector
      });

      if (response.success) {
        sileo.success({ title: "Catalog Updated", description: response.message });
        router.push("/dashboard/products");
        router.refresh();
      } else {
        sileo.error({ title: "Transaction Aborted", description: response.message });
      }

    } catch (err) {
      console.error("Critical transaction crash tracking loops:", err);
      sileo.error({ title: "Compilation Error", description: "Could not parse form stream metrics parameters." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmission} className="space-y-10 text-left pb-24 animate-in fade-in duration-300">
      
      {/* HEADER SECTION CONTROLS ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          {/* 🌟 Mapped back arrow links to primary theme colors */}
          <div className="flex items-center gap-2 text-slate-400">
            <Link href="/dashboard/products" className="hover:text-primary transition-colors"><ArrowLeft size={16} /></Link>
            <span className="text-xs font-medium font-mono">Catalog Controls</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Add Boutique Product</h1>
        </div>
        
        {/* 🌟 Redesigned dynamic publish button to match the theme primary color layout */}
        <button
          type="submit"
          disabled={saving}
          className="h-12 px-6 bg-primary hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-slate-50 disabled:text-slate-300 shadow-sm cursor-pointer w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin text-white" />
              <span>Publishing Catalog Node...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              <span>Save & Publish Product</span>
            </>
          )}
        </button>
      </div>

      {/* PARENT PARAMETERS ENTRY BOX GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-50 pb-3">Core Base Specifications</h2>
          
          {/* 🌟 Focused input wrappers mapped to focus:border-primary */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Product Public Name</label>
            <input
              type="text"
              placeholder="e.g., Banarasi Silk Crimson Saree"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white rounded-xl text-xs font-medium text-slate-800 outline-none transition-all"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Editorial Description Copy</label>
            <textarea
              rows={4}
              placeholder="Detail handloom warp threads structure profiles, specialized weave density vectors and fabric composition outlines..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white rounded-xl text-xs font-medium text-slate-800 outline-none transition-all resize-none"
              disabled={saving}
            />
          </div>
        </div>

        <div className="space-y-6 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-50 pb-3">Taxonomy & Economics</h2>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Category Tier Mapping</label>
            <select
              value={productForm.category_id}
              onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 rounded-xl outline-none focus:border-primary focus:bg-white"
              disabled={saving}
            >
              <option value="">-- SELECT TARGET CATEGORY NODE --</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Standard Baseline Retail Price (₹)</label>
            <input
              type="number"
              placeholder="4999"
              value={productForm.base_price}
              onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white rounded-xl text-xs font-mono font-bold text-slate-800 outline-none transition-all"
              required
              disabled={saving}
            />
          </div>

          {/* STOREFRONT CHANNELS WORKING SLIDER */}
          <div className="space-y-2 pt-2 border-t border-slate-50">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Storefront Availability Status</label>
            <button
              type="button"
              onClick={() => setProductForm({ ...productForm, is_active: !productForm.is_active })}
              disabled={saving}
              className={`w-full px-4 py-3 border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                productForm.is_active 
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-800 font-bold" 
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                {productForm.is_active ? <Eye size={14} className="text-emerald-600" /> : <EyeOff size={14} />}
                <span>{productForm.is_active ? "Live & Active on Catalog" : "Set as Inactive Draft"}</span>
              </div>
              <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${productForm.is_active ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${productForm.is_active ? 'translate-x-3' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOM INVENTORY SELECTION MATRIX LAYER CHUNKS */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-50 pb-4">
          <div className="flex items-center gap-2">
            {/* 🌟 Header Icon accented with text-primary */}
            <Layers size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Dynamic Dimensional SKU Variants Matrix</h2>
          </div>
          {/* 🌟 Append Matrix button updated to toggle hover color traits with primary tokens */}
          <button
            type="button"
            onClick={addNewVariantRow}
            disabled={saving}
            className="text-xs font-bold bg-slate-50 hover:bg-slate-100 hover:text-primary hover:border-primary/20 text-slate-800 px-4 py-2 rounded-xl transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
          >
            <Plus size={13} /> <span>Append Matrix SKU Line</span>
          </button>
        </div>

        <div className="space-y-6">
          {variants.map((variant, index) => (
            <div key={variant.id} className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-5 relative">
              <div className="absolute top-4 right-4 flex items-center gap-4">
                
                {/* 🌟 Embedded checkbox element accented with brand controls */}
                <label className="flex items-center gap-1.5 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variant.is_active}
                    onChange={(e) => updateVariantField(variant.id, "is_active", e.checked ?? e.target.checked)}
                    className="w-3.5 h-3.5 accent-primary rounded cursor-pointer border-slate-300"
                    disabled={saving}
                  />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${variant.is_active ? "text-emerald-700" : "text-slate-400"}`}>
                    Active Variant
                  </span>
                </label>

                <div className="w-px h-3 bg-slate-200" />

                <span className="text-[10px] font-mono font-bold text-slate-300">#Index {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeVariantRow(variant.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* ROW INPUT PACKETS SPLIT */}
              {/* 🌟 Form variation inputs adapted to toggle borders via focus:border-primary references */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">SKU Code (Must be Unique)</label>
                  <input
                    type="text"
                    placeholder="e.g., MSH-KRA-SLK-S1"
                    value={variant.sku}
                    onChange={(e) => updateVariantField(variant.id, "sku", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Color Shade Text</label>
                  <input
                    type="text"
                    placeholder="e.g., Midnight Indigo"
                    value={variant.color}
                    onChange={(e) => updateVariantField(variant.id, "color", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Hex Swatch Color Code</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={variant.color_hex}
                      onChange={(e) => updateVariantField(variant.id, "color_hex", e.target.value)}
                      className="w-10 h-9 p-0.5 bg-white border border-slate-200 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={variant.color_hex}
                      onChange={(e) => updateVariantField(variant.id, "color_hex", e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Size</label>
                  <select
                    value={variant.size}
                    onChange={(e) => updateVariantField(variant.id, "size", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none focus:border-primary"
                    required
                  >
                    <option value="">-- SIZE --</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Physical Stock Capacity</label>
                  <input
                    type="number"
                    placeholder="25"
                    value={variant.stock_quantity}
                    onChange={(e) => updateVariantField(variant.id, "stock_quantity", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Custom Price (₹)</label>
                  <input
                    type="number"
                    placeholder="Overrides Base"
                    value={variant.variant_price}
                    onChange={(e) => updateVariantField(variant.id, "variant_price", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* DIRECT R2 ASSET DROPZONE ACCORDING TO USER FLOW METRICS */}
              {/* 🌟 Upload grid wrapper configured to transition into brand outlines during drops */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Variant Media Uploads (R2 Connected)</label>
                <div className="p-6 bg-white border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-xl flex flex-col items-center justify-center gap-2 transition-all relative cursor-pointer group">
                  <UploadCloud size={20} className="text-slate-400 group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-bold text-slate-600 group-hover:text-primary transition-colors">Click to allocate images for this variant color shade stack</span>
                  <span className="text-[10px] text-slate-400 font-medium">Supports high resolution JPEG, PNG or MP4 videos files</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleFileSelectionChange(variant.id, e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>

                {/* Local Choice Pre-Upload Verification Indicators */}
                {variant.localFiles?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {variant.localFiles.map((file, fIdx) => (
                      <span key={fIdx} className="bg-primary/5 text-primary px-2.5 py-1 border border-primary/10 rounded-md text-[10px] font-mono font-bold">
                        📎 {file.name.slice(0, 15)}... ({(file.size / 1024 / 1024).toFixed(2)} MB)
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
}