"use client";
import { useState } from "react";
import { 
  IndianRupee, 
  ShoppingBag, 
  Package, 
  Percent, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function DashboardClient({ initialData, user }) {
  const [metrics] = useState(initialData?.metrics || {
    grossRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    activeCoupons: 0,
    lowStockCount: 0
  });

  const [recentOrders] = useState(initialData?.recentOrders || []);
  const [lowStockProducts] = useState(initialData?.lowStockProducts || []);

  // Compute metric ratios for the visualization matrices
  const deliveredCount = recentOrders.filter(o => o.status === "Delivered").length || 3;
  const processingCount = recentOrders.filter(o => o.status !== "Delivered" && o.status !== "Dispatched").length || 2;
  const dispatchedCount = recentOrders.filter(o => o.status === "Dispatched").length || 1;
  const totalRecent = deliveredCount + processingCount + dispatchedCount || 6;

  // Pie angles configurations mapping rules using SVG strokeDasharray
  const deliveredPct = (deliveredCount / totalRecent) * 100;
  const dispatchedPct = (dispatchedCount / totalRecent) * 100;
  const processingPct = (processingCount / totalRecent) * 100;

  return (
    <div className="space-y-8 text-left pb-16 animate-in fade-in duration-500 selection:bg-primary/20">
      
      {/* SECTION 1: MINIMALIST WORKSPACE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-0.5">
          <h1 className="text-xl font-serif font-black tracking-tight text-slate-900">Workspace Overview</h1>
          <p className="text-xs text-slate-400 font-medium">Real-time store performance diagnostics and warehouse analytics profile.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-[11px] font-mono font-bold text-slate-500 select-none">
          <Clock size={12} className="text-primary animate-pulse" />
          <span>Live Sync Terminal</span>
        </div>
      </div>

      {/* SECTION 2: HIGH-DENSITY RADIAL & GEOMETRIC METRICS REGION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Quad Cards Layout Array Wrapper (Col 8) */}
        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Gross Store Revenue */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group transition-all hover:border-slate-200/80">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <IndianRupee size={16} />
              </div>
              <span className="flex items-center gap-0.5 text-[10px] font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/30">
                +{metrics.revenueChange}%
              </span>
            </div>
            <div className="mt-6 space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Gross Revenue</span>
              <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">₹{metrics.grossRevenue.toLocaleString("en-IN")}</h3>
            </div>
          </div>

          {/* Card 2: Cumulative Order Volume */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between transition-all hover:border-slate-200/80">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
              <span className="flex items-center gap-0.5 text-[10px] font-mono font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                +{metrics.ordersChange}%
              </span>
            </div>
            <div className="mt-6 space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Total Orders</span>
              <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">{metrics.totalOrders}</h3>
            </div>
          </div>

          {/* Card 3: Active Promotional Vouchers */}
          <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between transition-all hover:border-slate-200/80">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                <Percent size={16} />
              </div>
              <span className="text-[9px] font-mono font-black text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                Active
              </span>
            </div>
            <div className="mt-6 space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Live Coupons</span>
              <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">{metrics.activeCoupons}</h3>
            </div>
          </div>

          {/* Card 4: Critical Low Inventory Alerts */}
          <div className={`border rounded-[2rem] p-6 shadow-sm transition-all flex flex-col justify-between ${
            metrics.lowStockCount > 0 ? "bg-amber-50/20 border-amber-100 text-amber-900" : "bg-white border-slate-100 hover:border-slate-200/80"
          }`}>
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${metrics.lowStockCount > 0 ? "bg-amber-100/60 text-amber-700" : "bg-slate-50 text-slate-400"}`}>
                <Package size={16} />
              </div>
              {metrics.lowStockCount > 0 && (
                <span className="flex items-center gap-1 text-[8px] font-black text-white bg-amber-600 border border-amber-700/20 px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse">
                  <AlertTriangle size={10} /> Action Req
                </span>
              )}
            </div>
            <div className="mt-6 space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Low Stock SKUs</span>
              <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">{metrics.lowStockCount}</h3>
            </div>
          </div>

        </div>

        {/* 🌟 NATIVE ANALYTICS PIE/DONUT CHART CARD BLOCK (Col 4) */}
        <div className="xl:col-span-4 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="border-b border-slate-50 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Fulfillment Allocations</h3>
            <p className="text-[10px] text-slate-400 font-medium">Visual balance of current active pipeline statuses.</p>
          </div>

          {/* Core SVG Render Wrapper */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                {/* Fallback baseline ring track */}
                <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                
                {/* Delivered Sector segment */}
                <circle 
                  cx="16" cy="16" r="14" fill="transparent" 
                  stroke="#10b981" strokeWidth="4" 
                  strokeDasharray={`${deliveredPct} 100`} 
                  strokeDashoffset="0"
                />
                {/* Dispatched Sector segment */}
                <circle 
                  cx="16" cy="16" r="14" fill="transparent" 
                  stroke="#var(--primary, #3b82f6)" strokeWidth="4" 
                  strokeDasharray={`${dispatchedPct} 100`} 
                  style={{ stroke: 'var(--primary)' }}
                  strokeDashoffset={`-${deliveredPct}`}
                />
                {/* Processing Sector segment */}
                <circle 
                  cx="16" cy="16" r="14" fill="transparent" 
                  stroke="#f59e0b" strokeWidth="4" 
                  strokeDasharray={`${processingPct} 100`} 
                  strokeDashoffset={`-${deliveredPct + dispatchedPct}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-4 shadow-inner">
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">Queue</span>
                <span className="text-sm font-black text-slate-800 font-mono">{totalRecent}</span>
              </div>
            </div>

            {/* Micro Side Legend Panel */}
            <div className="space-y-2 text-[10px] font-bold text-slate-500 w-full">
              <div className="flex items-center justify-between border-b border-slate-50 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Delivered</span>
                </div>
                <span className="font-mono text-slate-800">{deliveredCount}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>Dispatched</span>
                </div>
                <span className="font-mono text-slate-800">{dispatchedCount}</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Process</span>
                </div>
                <span className="font-mono text-slate-800">{processingCount}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 3: RECENT TRANSACTION & STOCK ALERT SPLIT CHANNELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: TRANSACTIONS RECORD TABLE (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Transactions</h2>
              <p className="text-[11px] text-slate-400 font-medium">Latest ledger streams processed on checkout.</p>
            </div>
            <Link href="/dashboard/orders" className="text-xs font-bold text-primary hover:opacity-80 transition-all flex items-center gap-0.5 group">
              <span>Open Queue</span> <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-slate-50">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-slate-300 text-center py-12 font-medium italic">No ledger vectors recorded inside stream.</p>
            ) : (
              recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/20 px-1 rounded-xl transition-colors">
                  <div className="space-y-1">
                    <p className="text-xs font-mono font-bold text-slate-800 truncate max-w-[160px] md:max-w-xs">
                      <span className="text-slate-300">#</span>{order.order_id || order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-xs font-black text-slate-900 font-mono block">
                      ₹{Number(order.payable_amount).toLocaleString("en-IN")}
                    </span>
                    <span className={`inline-block text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      order.status === "Delivered" ? "bg-green-50 text-green-700 border-green-100/60" :
                      order.status === "Dispatched" ? "bg-primary/5 text-primary border-primary/10" : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RE-STOCK ALERT TILES (Col 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-50 pb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Inventory Threshold Alerts</h2>
            <p className="text-[11px] text-slate-400 font-medium">SKU structures operating below safe-minimum parameters.</p>
          </div>

          <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1 no-scrollbar">
            {lowStockProducts.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                <p className="text-xs text-slate-300 font-medium">All retail stock levels are comfortably allocated.</p>
              </div>
            ) : (
              lowStockProducts.map((variant) => (
                <div key={variant.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4 group hover:bg-slate-100/50 transition-colors">
                  <div className="space-y-0.5 truncate text-left">
                    <h4 className="text-xs font-bold text-slate-800 truncate transition-colors group-hover:text-slate-900">{variant.products?.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400 block tracking-wider uppercase">
                      SKU: {variant.sku} • {variant.size} / {variant.color}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg block shadow-sm">
                      {variant.stock_quantity} Left
                    </span>
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