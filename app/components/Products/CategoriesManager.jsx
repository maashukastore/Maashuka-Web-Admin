"use client";
import { useState, useRef } from "react";
import { Plus, Tag, Calendar, FolderHeart, Loader2, Search, Trash2, UploadCloud, X } from "lucide-react";
import { createNewCategory, deleteCategory } from "@/app/controllers/Products/Category/action";
import { sileo } from "sileo";

export default function CategoriesManager({ initialCategories }) {
  const [categories, setCategories] = useState(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const [newCategorySlug, setNewCategorySlug] = useState("");

  // 🌟 State parameters handling local category file nodes and previews
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return sileo.error({ title: "Format Blocked", description: "Please drop a valid image media file asset.", fill: "black" });
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Form Submission Mutation Flow
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (creating) return;

    setCreating(true);
    let uploadedImageUrl = null;

    try {
      // 🌟 Cloudflare R2 Pipeline Handshake Routine for Category Folder Context
      if (imageFile) {
        const signatureResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            fileName: `${Date.now()}-${imageFile.name}`, // Target sub-directory structural context 
            fileType: imageFile.type,
            folerName: "category" // Explicitly define the folder context for R2 storage 
          })
        });

        const signatureData = await signatureResponse.json();
        if (!signatureResponse.ok || !signatureData.signedUrl) {
          throw new Error(signatureData.message || "Could not generate R2 storage access signatures.");
        }

        // Upload directly straight to Cloudflare partitions bucket via PUT node endpoints
        const r2UploadResponse = await fetch(signatureData.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": imageFile.type },
          body: imageFile
        });

        if (!r2UploadResponse.ok) throw new Error("R2 storage pipeline stream failed.");
        uploadedImageUrl = signatureData.publicUrl;
      }

      // 🌟 Passing updated payload coordinates down into backend creation methods
      const response = await createNewCategory(newCategoryName, newCategorySlug, uploadedImageUrl);

      if (response.success) {
        sileo.success({ title: "Taxonomy Synchronized", description: response.message, fill: "black" });
        setCategories([...categories, response.data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewCategoryName("");
        setNewCategorySlug("");
        clearSelectedImage();
      } else {
        sileo.error({ title: "Operation Blocked", description: response.message, fill: "black" });
      }
    } catch (err) {
      console.error(err);
      sileo.error({ title: "Compilation Error", description: err.message || "Internal runtime failure encountered.", fill: "black" });
    } finally {
      setCreating(false);
    }
  };

  const performCategoryDeletion = async (cat) => {
    console.log("Attempting to delete category:", cat);
    try {
      const res = await deleteCategory(cat);
      if (res.success) {
        sileo.success({ title: "Category Removed", description: res.message, fill: "black" });
        setCategories(prev => prev.filter(c => c.id !== cat.id));
      } else {
        sileo.error({ title: "Cannot Delete", description: res.message, fill: "black" });
      }
    } catch (err) {
      console.error(err);
      sileo.error({ title: "Deletion Failed", description: "Internal error occurred.", fill: "black" });
    }
  };

  const handleDeleteCategory = async (cat) => {
    sileo.action({
      title: "Confirm Deletion",
      description: `Are you sure you want to delete the category "${cat.name}"? This action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      button: {
        title: "Delete",
        variant: "brand",
        onClick: async () => {
          await performCategoryDeletion(cat);
        },
        styles: {
          button: "bg-rose-600 hover:bg-rose-700 text-white",
          cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-800"
        },
        fill: "#752222"
      },
      styles: {
        button: "bg-rose-600 hover:bg-rose-700 text-white",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-800"
      },
      fill: "black"
    });
    return;
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 text-left pb-24 animate-in fade-in duration-300">
      
      {/* HEADER CONTROLS VIEWPORT ROW */}
      <div className="border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Tag size={14} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Inventory Schema</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-slate-900">Storefront Category Taxonomies</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">Configure global product navigation filters, tax category mappings, and boutique grouping collections.</p>
      </div>

      {/* TWO-COLUMN MANAGEMENT WORKSPACE DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN PANEL: CREATION ENGINE SIDE CARD (Col 4) */}
        <form onSubmit={handleCreateSubmit} className="lg:col-span-4 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <FolderHeart size={15} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Create New Tier</h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Name Reference</label>
            <input
              type="text"
              placeholder="e.g., Banarasi Silk, Chanderi"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
              required
              disabled={creating}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Unique SLUG</label>
            <input
              type="text"
              placeholder="e.g., banarasi-silk, chanderi"
              value={newCategorySlug}
              onChange={(e) => setNewCategorySlug(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 focus:border-primary focus:bg-white rounded-xl text-xs font-bold text-slate-800 outline-none transition-all"
              required
              disabled={creating}
            />
          </div>

          {/* 🌟 NEW R2 SINGLE IMAGE DROPZONE BLOCK */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category Display</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
              disabled={creating}
            />

            {!imagePreview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-primary rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-50/50 group flex flex-col items-center justify-center gap-1.5"
              >
                <UploadCloud size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider group-hover:text-slate-700">Upload Cover Image</span>
                <span className="text-[9px] text-slate-400 font-medium">Auto-mapped into /category root</span>
              </div>
            ) : (
              <div className="relative aspect-[16/8] w-full rounded-2xl border border-slate-100 overflow-hidden shadow-sm group bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Category asset preview" className="w-full h-full object-cover animate-in fade-in duration-200" />
                <button
                  type="button"
                  onClick={clearSelectedImage}
                  disabled={creating}
                  className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg transition-all shadow cursor-pointer opacity-90"
                  title="Purge Selection"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={creating || !newCategoryName.trim() || !newCategorySlug.trim()}
            className="w-full h-11 bg-primary hover:opacity-90 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-slate-50 disabled:text-slate-300 shadow-sm cursor-pointer"
          >
            {creating ? (
              <>
                <Loader2 size={13} className="animate-spin text-white" />
                <span>Syncing cloud assets...</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>Publish Category</span>
              </>
            )}
          </button>
        </form>

        {/* RIGHT COLUMN PANEL: INDEX GRID DATATABLE TRACKER (Col 8) */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Active Taxonomy Matrix ({filteredCategories.length})
            </h3>
            
            <div className="relative w-full sm:w-64 flex items-center bg-slate-50 border border-slate-100 focus-within:border-primary focus-within:bg-white rounded-xl transition-all shadow-sm">
              <Search size={13} className="text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search category nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-2 pr-4 py-2.5 bg-transparent text-xs font-medium text-slate-800 outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
            {filteredCategories.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Tag size={24} className="mx-auto text-slate-200 mb-1.5" />
                <p className="text-xs font-bold uppercase tracking-wider">No Category Nodes Found</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Adjust filter terms or append a fresh entity using the template.</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4 hover:bg-slate-50/40 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 truncate min-w-0 flex-1">
                    
                    {/* 🌟 Render category layout card thumb cleanly if image array paths are linked inside row rows */}
                    {category.image_url ? (
                      <div className="relative w-8 h-8 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={category.image_url} alt="category mini thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Tag size={13} />
                      </div>
                    )}

                    <div className="truncate">
                      <p className="font-bold text-xs text-slate-900 uppercase tracking-wide truncate">{category.name}</p>
                      <span className="text-[9px] font-mono text-slate-400 block tracking-tight mt-0.5">API: {category.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px] shrink-0 bg-slate-50/50 px-3 py-1 border border-slate-100 rounded-lg">
                    <Calendar size={11} className="text-slate-300" />
                    <span>{new Date(category.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category)}
                    className="text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-100 px-3 py-2 rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}