import { Loader2 } from "lucide-react";

export default function DashboardLoadingFallback() {
  return (
    <div className="space-y-10 text-left animate-in fade-in duration-300">
      
      {/* HEADER PANELS PLACEHOLDER ANIMATION SKELETON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-2 w-full max-w-sm">
          <div className="h-7 bg-slate-100 rounded-xl animate-pulse w-3/4" />
          <div className="h-4 bg-slate-50 rounded-lg animate-pulse w-1/2" />
        </div>
        <div className="h-9 bg-slate-100 rounded-xl animate-pulse w-32 shrink-0 hidden sm:block" />
      </div>

      {/* METRICS GRID AREA MOCK STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div 
            key={index} 
            className="h-36 bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div className="flex justify-between items-start w-full">
              <div className="w-11 h-11 bg-slate-100 rounded-xl animate-pulse" />
              <div className="w-12 h-5 bg-slate-50 rounded-md animate-pulse" />
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-3 bg-slate-50 rounded-md animate-pulse w-1/3" />
              <div className="h-6 bg-slate-100 rounded-lg animate-pulse w-2/3" />
            </div>
          </div>
        ))}
      </div>

      {/* RECENT DATA MATRIX CONTAINER BLOCK SKELETON */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-sm min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Absolute Centered Spinning System Core Node */}
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400 z-10">
          <Loader2 size={28} className="animate-spin text-slate-900" strokeWidth={2.5} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Streaming Data Matrix...
          </span>
        </div>

        {/* Faded Background Table Simulator Rows */}
        <div className="absolute inset-x-6 top-8 bottom-6 space-y-5 opacity-25 select-none pointer-events-none w-full px-2">
          <div className="h-4 bg-slate-100 rounded-md w-11/12 animate-pulse" />
          <div className="h-px bg-slate-100 w-full" />
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="space-y-4 w-full">
              <div className="flex items-center justify-between gap-4 w-11/12">
                <div className="h-3 bg-slate-100 rounded-md w-1/4 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded-md w-1/6 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded-md w-1/5 animate-pulse" />
              </div>
              <div className="h-px bg-slate-50 w-full" />
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}