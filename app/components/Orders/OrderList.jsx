"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, AlertCircle, Loader2, ChevronLeft, ChevronRight, Eye, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";
import { getPaginatedOrders, updateOrderStatus } from "../../dashboard/action";
import { sileo } from "sileo";

export default function OrdersList({ initialOrders }) {
  const isFirstRender = useRef(true);

  // Initialize unified data records from server payload props
  const [orders, setOrders] = useState(initialOrders?.orders || []);
  const [totalPages, setTotalPages] = useState(initialOrders?.totalPages || 1);
  const [totalRecords, setTotalRecords] = useState(initialOrders?.totalCount || 0);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "Pending" | "Dispatched" | "Delivered"
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchUpdatedOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getPaginatedOrders({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        status: activeTab,
        search: searchQuery
      });

      if (result.success) {
        setOrders(result.orders);
        setTotalPages(result.totalPages);
        setTotalRecords(result.totalCount);
      }
    } catch (err) {
      console.error("Client side order loop crash:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchUpdatedOrders();
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, activeTab, searchQuery, fetchUpdatedOrders]);

  const handleStatusTransition = async (orderId, targetStatus) => {
    try {
      const response = await updateOrderStatus(orderId, targetStatus);
      if (response.success) {
        sileo.success({ title: "Fulfillment Transitioned", description: response.message, fill: "black" });
        fetchUpdatedOrders(); // Refresh values dynamically
      } else {
        sileo.error({ title: "Transition Denied", description: response.message });
      }
    } catch (err) {
      sileo.error({ title: "Execution Failure" });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* FILTER TABS & CONTROL ACTIONS */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-xl max-w-fit no-scrollbar select-none">
          {[
            { id: "all", label: "All Manifests" },
            { id: "Pending", label: "Pending Processing" },
            { id: "Dispatched", label: "Dispatched Out" },
            { id: "Delivered", label: "Completed Logistics" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              // 🌟 Active tab redesigned to match the brand primary background accent
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 🌟 Focus ring on search box altered to bind with border-primary */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl focus-within:border-primary transition-all max-w-md w-full shadow-sm">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Order Unique Token Hash ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="bg-transparent text-xs font-medium w-full outline-none text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* COMPREHENSIVE RECORDS MATRIX DISPLAY TABLE */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col justify-between min-h-[520px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3 text-slate-400 flex-1">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest">Querying Operational ledgers...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-32 text-center space-y-2 flex-1 flex flex-col justify-center items-center">
            <AlertCircle size={32} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Transaction Records Found</p>
            <p className="text-xs text-slate-400">No entries matched your active status filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full border-collapse text-left min-w-[950px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Order Identity Token</th>
                  <th className="py-4 px-4">Operator/Client Coordinates</th>
                  <th className="py-4 px-4">Timeline Timestamp</th>
                  <th className="py-4 px-4">Financial Ledger Metrics</th>
                  <th className="py-4 px-4">Fulfillment Phase State</th>
                  <th className="py-4 px-6 text-right">Actions Workflow Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-sans font-medium">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Order Hash Token ID Key */}
                    {/* 🌟 Linked text layout element customized with hover:text-primary rule shifts */}
                    <td className="py-2">
                      <Link href={`/dashboard/orders/view/${order.id}`} className="inline-block py-4 px-6 font-mono text-slate-900 font-bold hover:text-primary transition-colors">
                        <span className="text-slate-300">#</span>{order.order_id || order.id.slice(0, 8)}
                      </Link>
                    </td>

                    {/* Customer Info Metadata Field Block */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900">{order.profiles?.name || "Boutique Buyer"}</p>
                        <span className="text-[10px] text-slate-400 block tracking-tight font-medium">{order.profiles?.email || "No Email Encrypted"}</span>
                      </div>
                    </td>

                    {/* Calendar Timestamps Block */}
                    <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-300" />
                        <span>
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            dateStyle: "medium"
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Financial Amount Value Field */}
                    <td className="py-4 px-4 font-black text-slate-900 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-0.5 text-slate-900">
                        <CreditCard size={13} className="text-slate-300 mr-1" />
                        <span>₹{Number(order.payable_amount).toLocaleString("en-IN")}</span>
                      </div>
                    </td>

                    {/* Dynamic Interactive Status Selection Matrix Box */}
                    {/* 🌟 Dispatched and focused selectors adjusted to display with primary backgrounds or borders */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusTransition(order.id, e.target.value)}
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-lg outline-none border transition-colors bg-white cursor-pointer focus:border-primary ${
                          order.status === "Delivered" ? "text-green-700 border-green-200 hover:bg-green-50" :
                          order.status === "Dispatched" ? "text-primary border-primary/20 bg-primary/5 hover:bg-primary/10" :
                          "text-amber-700 border-amber-200 hover:bg-amber-50"
                        }`}
                      >
                        <option value="Pending">Pending Process</option>
                        <option value="Dispatched">Dispatched Out</option>
                        <option value="Delivered">Delivered Done</option>
                      </select>
                    </td>

                    {/* Actions Workflow Management Hub panel Links */}
                    {/* 🌟 Action hover control buttons update to feature hover:text-primary / hover:border-primary traits */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/orders/view/${order.id}`} 
                          className="p-2 text-slate-400 hover:text-primary bg-slate-50 border border-slate-100 rounded-lg hover:border-primary/30 transition-all flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 cursor-pointer"
                          title="Review Invoice Items manifest"
                        >
                          <Eye size={13} />
                          <span>Inspect Manifest</span>
                        </Link>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RESPONSIVE FOOTER NAVIGATION SYSTEM SLICES */}
        <div className="bg-slate-50/80 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
          <span className="text-[11px] font-medium text-slate-400">
            Showing page <span className="text-slate-800 font-bold">{currentPage}</span> of <span className="text-slate-800 font-bold">{totalPages}</span> ({totalRecords} fulfillment tokens tracking)
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1 || loading} 
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary disabled:opacity-40 cursor-pointer shadow-sm transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(num => (
                <button 
                  key={num} 
                  onClick={() => setCurrentPage(num)} 
                  disabled={loading} 
                  // 🌟 Active selected pagination item remmapped explicitly to 'bg-primary' and shadow bounds
                  className={`w-9 h-9 text-xs font-bold rounded-xl cursor-pointer transition-all ${currentPage === num ? "bg-primary text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:border-primary/40"}`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages || loading} 
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary disabled:opacity-40 cursor-pointer shadow-sm transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}