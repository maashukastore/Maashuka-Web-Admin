"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Edit3, Trash2, Layers, AlertCircle, Loader2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getPaginatedProducts } from "../../dashboard/action";
import { sileo } from "sileo";

export default function ProductTable({ initialProducts, user }) {
  const supabase = createClient();
  const isFirstRender = useRef(true);

  // Initialize client states using data streamed down directly from the server component
  const [products, setProducts] = useState(initialProducts?.products || []);
  const [totalPages, setTotalPages] = useState(initialProducts?.totalPages || 1);
  const [totalRecords, setTotalRecords] = useState(initialProducts?.totalCount || 0);
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Handle client-side modifications and adjustments updates
  const fetchUpdatedCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getPaginatedProducts({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        tab: activeTab,
        search: searchQuery
      });

      if (result.success) {
        setProducts(result.products);
        setTotalPages(result.totalPages);
        setTotalRecords(result.totalCount);
      }
    } catch (err) {
      console.error("Client refresh error tracking loop:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery]);

  // Hook tracker monitors user filters execution shifts
  useEffect(() => {
    // Skip the absolute first render because the server component already handled page 1 loading
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Add a small bounce delay when a user types into the search field
    const delayDebounceFn = setTimeout(() => {
      fetchUpdatedCatalog();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, activeTab, searchQuery, fetchUpdatedCatalog]);

  const handleDeleteProduct = async (productId, name) => {
    if (!confirm(`Are you absolutely sure you want to delete ${name}?`)) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
      sileo.success({ title: "Product Deleted" });
      fetchUpdatedCatalog(); 
    } catch (err) {
      sileo.error({ title: "Action Blocked", description: "Item is linked to active order vectors." });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* FILTER TABS AND CONTROLS SECTION */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* State Selection Tab Elements Links Row */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-xl max-w-fit no-scrollbar select-none">
          {[
            { id: "all", label: "All Items" },
            { id: "live", label: "Standard Catalog" },
            { id: "sale", label: "On Sale/Promos" },
            { id: "out", label: "Out Of Stock" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              // 🌟 Active filter status node updated with theme bg-primary color profile
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input Bar + Add Product Action Group Panel */}
        <div className="flex items-center gap-3 w-full md:max-w-xl">
          
          {/* Live System Filtering Input Node Box */}
          {/* 🌟 Focused field wrapper set to focus-within:border-primary */}
          <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl focus-within:border-primary transition-all flex-1 shadow-sm">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search products by dynamic key parameters..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs font-medium w-full outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* 💡 REFRESHED ADD PRODUCT CALL-TO-ACTION BUTTON */}
          {/* 🌟 Main navigation action button updated to adopt bg-primary properties explicitly */}
          <Link
            href="/dashboard/products/new"
            className="h-[42px] px-4 md:px-5 bg-primary hover:opacity-95 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 cursor-pointer shrink-0"
            title="Create New Product Entry"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add Product</span>
          </Link>

        </div>
      </div>

      {/* CORE DISPLAY DATA TABLE */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col justify-between min-h-[480px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3 text-slate-400 flex-1">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest">Refreshing Data Matrix Slices...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-32 text-center space-y-2 flex-1 flex flex-col justify-center items-center">
            <AlertCircle size={32} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Catalog Matches Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full border-collapse text-left min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Product Asset</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Price Metrics</th>
                  <th className="py-4 px-4">Stock Matrix</th>
                  <th className="py-4 px-4">Promo Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-sans font-medium">
                {products.map((product) => {
                  const totalStockCount = product.product_variants?.reduce((acc, v) => acc + v.stock_quantity, 0) || 0;
                  const uniqueColorsCount = new Set(product.product_variants?.map(v => v.color)).size;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">

                      <td className="py-4 px-6 max-w-xs">
                        {/* 🌟 Mapped structural row title text to shift highlights using hover:text-primary updates */}
                        <Link href={`/dashboard/products/view/${product.id}`} className="group inline-flex items-center gap-4 transition-colors">
                          <div className="relative w-11 h-14 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0 shadow-sm">
                            {product.product_variants?.[0]?.variant_image && (
                              <Image src={product.product_variants?.[0].variant_image?.[0]} alt="thumbnail" fill className="object-cover" />
                            )}
                          </div>
                          <div className="truncate">
                            <h3 className="font-bold text-slate-900 truncate text-sm group-hover:text-primary transition-colors">{product.name}</h3>
                            <span className="text-[10px] text-slate-400 font-mono block">ID: {product.id.slice(0, 12)}...</span>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-slate-50 border border-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider">
                          {product.categories?.name}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-slate-900">
                        {product.on_sale ? `₹${product.sale_price}` : `₹${product.base_price}`}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className={`font-extrabold ${totalStockCount === 0 ? "text-rose-600" : "text-slate-800"}`}>
                            {totalStockCount} Units Available
                          </span>
                          <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                            <Layers size={11} /> {product.product_variants?.length || 0} Sizes • {uniqueColorsCount} Colors
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                          product.on_sale ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-slate-50 text-slate-400"
                        }`}>
                          {product.on_sale ? "PROMO RUNNING" : "STANDARD"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* 🌟 Mapped individual item table modification controls to focus updates with hover:text-primary tokens */}
                          <Link href={`/dashboard/products/edit/${product.id}`} className="p-2 text-slate-400 hover:text-primary bg-slate-50 border border-slate-100 rounded-lg hover:border-primary/20 transition-colors">
                            <Edit3 size={14} />
                          </Link>
                          {/* DELETE ACTION WITH CONFIRMATION AND ROLE-BASED ACCESS CONTROL */}
                          {user && (user?.user_metadata?.role === "admin" || user?.user_metadata?.role === "superadmin") && (
                            <button onClick={() => handleDeleteProduct(product.id, product.name)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 border border-slate-100 rounded-lg cursor-pointer transition-colors shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        
                      </td>
                      
                    </tr>
                    
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* INTEGRATED PAGINATION CONTROLS FOOTER PANEL */}
        <div className="bg-slate-50/80 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <span className="text-[11px] font-medium text-slate-400">
            Showing page <span className="text-slate-800 font-bold">{currentPage}</span> of <span className="text-slate-800 font-bold">{totalPages}</span> ({totalRecords} items total)
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary disabled:opacity-40 cursor-pointer shadow-sm transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(num => (
                <button 
                  key={num} 
                  onClick={() => setCurrentPage(num)} 
                  disabled={loading} 
                  // 🌟 Selected catalog pagination numbers remmapped to render using bg-primary tokens
                  className={`w-9 h-9 text-xs font-bold rounded-xl cursor-pointer transition-all ${currentPage === num ? "bg-primary text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:border-primary/30"}`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary disabled:opacity-40 cursor-pointer shadow-sm transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}