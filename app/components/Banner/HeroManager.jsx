// components/dashboard/HeroManager.jsx
"use client";
import { useState, useRef } from "react";
import { Sliders, Plus, Loader2, Image as ImageIcon, UploadCloud, Eye, Trash2, ShieldCheck, ArrowRight, X, Edit3, RotateCcw, ToggleLeft, ToggleRight } from "lucide-react";
import { createHeroSection, activateHeroSection, deleteHeroSection, updateHeroSection } from "../../controllers/Banners/action";
import { sileo } from "sileo";

export default function HeroManager({ initialTemplates }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  // State parameters handling Edit Context Maps
  const [editingId, setEditingId] = useState(null);

  // Media Capture State Nodes
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  // High-fidelity Form Fields Blueprint State Map
  const [form, setForm] = useState({
    label: "LUXURY FESTIVE",
    title: "Timeless",
    highlight_text: "Grace",
    description: "Elevated essentials crafted from the finest silk blends.",
    cta_text: "EXPLORE COLLECTION",
    badge_text: "EST. 2026",
    footer_text: "Premium Handcrafted Pieces"
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      sileo.error({ title: "Asset Rejected", description: "Provide a valid image format." });
    }
  };

  // Clear form and reset edit operational contexts
  const resetFormState = () => {
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setForm({
      label: "LUXURY FESTIVE",
      title: "Timeless",
      highlight_text: "Grace",
      description: "Elevated essentials crafted from the finest silk blends.",
      cta_text: "EXPLORE COLLECTION",
      badge_text: "EST. 2026",
      footer_text: "Premium Handcrafted Pieces"
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Populate active template data values straight into edit configurations
  const startEditingMode = (template) => {
    setEditingId(template.id);
    setImageFile(null);
    setImagePreview(template.image_url); // Maps current R2 path string as initial visual preview
    setForm({
      label: template.label,
      title: template.title,
      highlight_text: template.highlight_text,
      description: template.description,
      cta_text: template.cta_text,
      badge_text: template.badge_text,
      footer_text: template.footer_text
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeploymentMutation = async (e) => {
    e.preventDefault();
    
    if (!imageFile && !editingId) {
      return sileo.error({ title: "Media Missing", description: "A cover display asset is mandatory to mount." });
    }

    setCreating(true);
    try {
      let finalImageUrl = editingId ? templates.find(t => t.id === editingId)?.image_url : "";

      // If a new file stream is selected, trigger R2 handshake mutations
      if (imageFile) {
        const signRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: `hero/${Date.now()}-${imageFile.name}`, fileType: imageFile.type })
        });
        const signData = await signRes.json();
        if (!signRes.ok || !signData.signedUrl) throw new Error("R2 Gateway rejected configuration parameters.");

        const uploadRes = await fetch(signData.signedUrl, { method: "PUT", headers: { "Content-Type": imageFile.type }, body: imageFile });
        if (!uploadRes.ok) throw new Error("Cloudflare cluster replication aborted.");
        
        finalImageUrl = signData.publicUrl;
      }

      const submissionPayload = { ...form, image_url: finalImageUrl };

      if (editingId) {
        const dbResponse = await updateHeroSection(editingId, submissionPayload);
        if (dbResponse.success) {
          sileo.success({ title: "Template Updated", description: dbResponse.message, fill: "black" });
          setTemplates(templates.map(t => t.id === editingId ? { ...t, ...dbResponse.data } : t));
          resetFormState();
        } else {
          throw new Error(dbResponse.message);
        }
      } else {
        const dbResponse = await createHeroSection({ ...submissionPayload, is_active: false });
        if (dbResponse.success) {
          sileo.success({ title: "Template Cached", description: dbResponse.message, fill: "black" });
          setTemplates([dbResponse.data, ...templates]);
          resetFormState();
        } else {
          throw new Error(dbResponse.message);
        }
      }
    } catch (err) {
      sileo.error({ title: "Pipeline Defect", description: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleActivation = async (id) => {
    setProcessingId(id);
    try {
      const res = await activateHeroSection(id);
      if (res.success) {
        sileo.success({ title: "Storefront Refreshed", description: res.message, fill: "black" });
        // Exclusive assignment switcher: Activating one sets all others to inactive completely
        setTemplates(templates.map(t => ({ ...t, is_active: t.id === id })));
        if (editingId === id) resetFormState();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  // 🌟 NEW FUNCTIONALITY: Toggles standalone layout status maps (Active vs Inactive overrides)
  const handleToggleStatusVisibility = async (templateItem) => {
    setProcessingId(templateItem.id);
    // Determine target inversion parameters mapping exactly onto database rows rules
    const targetStatusFlag = templateItem.is_active ? false : true; 
    
    // Safety Fallback constraint: Cannot flip an explicitly active "Live State" node into inactive directly without deploying an alternate template first
    // Block deactivation ONLY if the target banner is currently active AND it's the sole active banner left.
const activeCount = templates.filter(t => t.is_active).length;

if (templateItem.is_active && activeCount === 1) {
  setProcessingId(null);
  return sileo.error({ 
    title: "Action Restrained", 
    description: "System requires at least one active banner. Activate an alternate template first before deactivating this node.", 
    fill: "black" 
  });
}

    try {
      // Re-uses your unified updateHeroSection server mutation pipeline cleanly
      const res = await updateHeroSection(templateItem.id, { is_active: !templateItem.is_active });
      if (res.success) {
        sileo.success({ title: "Status Synchronized", description: "Banner state availability successfully adjusted.", fill: "black" });
        setTemplates(templates.map(t => t.id === templateItem.id ? { ...t, is_active: !t.is_active } : t));
      } else {
        sileo.error({ title: "Mutation Refused", description: res.message });
      }
    } catch (err) {
      console.error(err);
      sileo.error({ title: "Runtime Interruption" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteHeroSection(id);
      if (res.success) {
        sileo.success({ title: "Purged Complete", description: res.message, fill: "black" });
        setTemplates(templates.filter(t => t.id !== id));
        if (editingId === id) resetFormState();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-10 text-left select-none animate-in fade-in duration-300">
      
      {/* ─── LIVE DESIGN RECONCILIATION EYE-CANDY PREVIEW LAYER ─── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-4 sm:p-8 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-mono font-black text-primary bg-primary/5 px-2.5 py-1 rounded border border-primary/10 tracking-widest uppercase inline-block">
            Real-time Layout Canvas Render Monitor
          </span>
          {editingId && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 uppercase animate-pulse">
              Modifying Grid Node ID: {editingId.slice(0, 8)}
            </span>
          )}
        </div>
        
        <div className="w-full bg-white border border-slate-100 rounded-[2rem] p-6 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[380px] overflow-hidden relative">
          <div className="md:col-span-6 space-y-4 max-w-md">
            <div className="flex items-center gap-2">
              <span className="h-[1px] w-6 bg-rose-900 block" />
              <span className="text-[10px] font-mono tracking-[0.25em] font-black text-rose-900/80 uppercase">{form.label || "LUXURY SERIES"}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 font-normal leading-[1.1] tracking-tight">
              {form.title || "Timeless"} <br />
              <span className="font-serif italic text-rose-700 mt-1 block">{form.highlight_text || "Grace"}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs">{form.description || "Collection baseline dynamic sub-copy configurations elements string."}</p>
            <button type="button" className="h-11 px-6 bg-rose-700 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-3 shadow-md">
              <span>{form.cta_text || "DISCOVER NOW"}</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="md:col-span-6 flex justify-center">
            <div className="relative aspect-[16/11] w-full max-w-lg rounded-[2.5rem] bg-slate-50 border border-slate-100 shadow-xl overflow-hidden group">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Live display preview profile" className="w-full h-full object-cover animate-in fade-in" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <ImageIcon size={32} strokeWidth={1.2} />
                  <span className="text-[9px] uppercase tracking-wider font-bold">Awaiting cover image layout stream...</span>
                </div>
              )}
              <div className="absolute top-4 right-4 backdrop-blur-md bg-white/60 border border-white/20 rounded-xl px-3 py-1.5 text-[9px] font-mono font-black text-slate-800 uppercase tracking-wider shadow-sm">{form.badge_text || "EST. 2026"}</div>
              <div className="absolute bottom-4 left-6 text-[10px] text-white/90 font-medium font-sans drop-shadow-md tracking-wide">{form.footer_text || "Handcrafted Pieces"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CREATION & EDIT ENGINE CONTROLS WORKSPACE DECK ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* INPUT DISPATCH PANEL FORM CARD (Col 5) */}
        <form onSubmit={handleDeploymentMutation} className="lg:col-span-5 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div className="flex items-center gap-2">
              <Sliders size={14} className="text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                {editingId ? "Update Parameters Matrix" : "Configure Parameter Sliders"}
              </h4>
            </div>
            {editingId && (
              <button type="button" onClick={resetFormState} className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[10px] uppercase font-bold transition-colors">
                <RotateCcw size={10} />
                <span>Cancel Edit</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Accent Tag Line</label>
              <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition-all" required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Badge Watermark</label>
              <input type="text" value={form.badge_text} onChange={(e) => setForm({ ...form, badge_text: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition-all" required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Master Title Header</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition-all" required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Italic Highlight Word</label>
              <input type="text" value={form.highlight_text} onChange={(e) => setForm({ ...form, highlight_text: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition-all" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sub-Header Summary Paragraph Copy</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-600 outline-none focus:border-primary focus:bg-white transition-all resize-none leading-relaxed" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">CTA Button Copy</label>
              <input type="text" value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition-all" required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Image Overlay Footer Text</label>
              <input type="text" value={form.footer_text} onChange={(e) => setForm({ ...form, footer_text: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-primary focus:bg-white transition-all" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              {editingId ? "Replace Cover Graphic (Optional)" : "Showcase Visual Cover (Cloudflare R2 Cluster)"}
            </label>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={creating} />
            
            {(!imagePreview || (editingId && !imageFile)) ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 flex flex-col items-center justify-center gap-1 group">
                <UploadCloud size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  {editingId ? "Change Existing Banner Asset" : "Upload Hero Aspect Graphic"}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                <div className="flex items-center gap-2 truncate text-slate-700 font-mono font-bold">
                  <ImageIcon size={14} className="text-primary" />
                  <span className="truncate">{imageFile ? imageFile.name : "R2 Live Managed String Linked"}</span>
                </div>
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(editingId ? templates.find(t => t.id === editingId)?.image_url : ""); }} className="text-rose-500 p-1 hover:bg-rose-50 rounded-lg cursor-pointer"><X size={14} /></button>
              </div>
            )}
          </div>

          <button type="submit" disabled={creating} className="w-full h-11 bg-primary hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:bg-slate-50 disabled:text-slate-300 shadow-sm cursor-pointer">
            {creating ? (
              <Loader2 size={13} className="animate-spin text-white" />
            ) : (
              <span>{editingId ? "Commit Banner Overrides" : "Cache Grid Design Node"}</span>
            )}
          </button>
        </form>

        {/* HISTORICAL REGISTERED COPIES DATATABLE LISTING (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <Eye size={14} className="text-slate-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Historical Visual State Configurations Matrix</h4>
          </div>

          <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto pr-1 no-scrollbar space-y-2.5">
            {templates.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 text-center py-12">No configured alternative hero structures indexed inside database layers.</p>
            ) : (
              templates.map((t) => (
                <div key={t.id} className={`p-4 border rounded-2xl flex items-center justify-between gap-4 transition-all ${t.is_active ? "bg-slate-50 border-primary/20 shadow-inner" : "bg-white border-slate-100 opacity-85"} ${editingId === t.id ? "ring-2 ring-amber-500/50 border-amber-500/40" : ""}`}>
                  <div className="flex items-center gap-3 truncate min-w-0 flex-1 text-left">
                    <div className="relative w-12 h-14 border border-slate-100 bg-slate-50 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.image_url} alt="catalog thumbnail" className="w-full h-full object-cover" />
                    </div>
                    <div className="truncate space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-slate-900 uppercase tracking-wide truncate">{t.title} {t.highlight_text}</p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 block truncate">SUB-DESCRIP: {t.description}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    
                    {/* 🌟 NEW INTERACTIVE ACTIVE/INACTIVE VISIBILITY OVERRIDE TOGGLE */}
                    <button
                      type="button"
                      disabled={processingId === t.id}
                      onClick={() => handleToggleStatusVisibility(t)}
                      className={`p-1 rounded-xl transition-all cursor-pointer ${
                        t.is_active ? "text-primary hover:text-primary/80" : "text-slate-300 hover:text-slate-400"
                      }`}
                      title={t.is_active ? "Set Banner Inactive" : "Set Banner Active"}
                    >
                      {t.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>

                    {/* Toggle deployment layout switch layouts */}
                    <button type="button" disabled={processingId === t.id || t.is_active} onClick={() => handleActivation(t.id)} className={`h-8 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${t.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 cursor-pointer"}`}>
                      {t.is_active ? <ShieldCheck size={11} /> : <Eye size={11} />}
                      <span>{t.is_active ? "Live State" : "Deploy"}</span>
                    </button>
                    
                    {/* Update Mutation trigger sheet slider button */}
                    <button type="button" onClick={() => startEditingMode(t)} className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-all cursor-pointer ${editingId === t.id ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`} title="Modify Fields">
                      <Edit3 size={12} />
                    </button>

                    {!t.is_active && (
                      <button type="button" onClick={() => handleDelete(t.id)} className="w-8 h-8 flex items-center justify-center border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"><Trash2 size={12} /></button>
                    )}
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