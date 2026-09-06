"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, Percent, IndianRupee,Flag } from "lucide-react";
import Image from "next/image";

export default function DashboardLayoutClient({ children, user }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Orders History",
      href: "/dashboard/orders",
      icon: Package,
      children: [
        { name: 'All Orders', href: '/dashboard/orders' },
        { name: 'Pending', href: '/dashboard/orders?tab=pending' },
        { name: 'Completed', href: '/dashboard/orders?tab=completed' }
      ]
    },
    {
      name: "Products",
      href: "/dashboard/products",
      icon: ShoppingBag,
      children: [
        { name: 'All Products', href: '/dashboard/products' },
        { name: 'Categories', href: '/dashboard/products/categories' }
      ]
    },
    { 
      name: "Payments", 
      href: "/dashboard/payments", 
      icon: IndianRupee,
      children: [
        { name: 'Fetch Payments', href: '/dashboard/payments' },
        { name: 'Initiate Refund', href: '/dashboard/payments/refund' }
      ]
    },
    { name: "Coupons Matrix", href: "/dashboard/coupons", icon: Percent },
    { 
      name: "Banners & Promotions", 
      href: "/dashboard/banner", 
      icon: Flag ,
      children: [
        { name: 'Fetch Payments', href: '/dashboard/payments' },
        { name: 'Initiate Refund', href: '/dashboard/payments/refund' }
      ]
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans selection:bg-primary/10 text-left">
      
      {/* FIXED STICKY LEFT SIDEBAR */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-100 p-6 h-full shrink-0 select-none">
        <div className="space-y-8">
          <div className="px-2 text-left">
            <Image src="/Images/MaashooqaLogo.JPG" width={130} height={70} alt="Maashooqa Logo" priority className="object-contain bg-[#eceadf] rounded-4xl shadow-md" />
          </div>

          <nav className="space-y-1 flex flex-col">
            {menuItems.map((item) => {
              const Icon = item.icon;
              
              // 💡 FIX: Check if the main tab path matches, OR if the current path starts with any child href path base
              const isParentActive = pathname === item.href || (item.children && item.children.some(child => {
                // Split queries out to check base routing directly
                const childPathBase = child.href.split('?')[0];
                return pathname === childPathBase || (childPathBase !== '/dashboard' && pathname.startsWith(childPathBase));
              }));

              return (
                <div key={item.name} className="group relative">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all ${
                      isParentActive 
                        ? "bg-primary text-white shadow-md" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={16} className={isParentActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"} />
                    <span>{item.name}</span>
                  </Link>

                  {item.children && (
                    <div className="hidden group-hover:block ml-6 mt-1 Gilbert-Submenu animate-in fade-in duration-150 z-30">
                      <div className="bg-white border border-slate-100 rounded-md shadow-sm py-2">
                        {item.children.map((child) => {
                          const childPathBase = child.href.split('?')[0];
                          const isChildActive = pathname === childPathBase;

                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`block px-4 py-2 text-[11px] font-bold hover:bg-slate-50 hover:text-slate-900 ${
                                isChildActive ? "text-primary" : "text-slate-600"
                              }`}
                            >
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-left truncate w-full">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs shrink-0 uppercase">
              {user?.initials || "A"}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-black text-slate-800 capitalize truncate">{user?.name || "Admin User"}</p>
              <span className="text-[10px] text-slate-400 font-medium block truncate">{user?.email || "admin@maashooqa.com"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* INDEPENDENT RIGHT SCROLLABLE WORKSPACE CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Secure Admin Layer</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono font-black text-slate-500">Live Server</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE BREAKPOINT NAVIGATION STRIP */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 px-2 flex items-center justify-around z-50 shadow-xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isMobileActive = pathname === item.href || (item.children && item.children.some(child => pathname.startsWith(child.href.split('?')[0])));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full text-[9px] font-bold ${
                isMobileActive ? "text-primary font-black" : "text-slate-400"
              }`}
            >
              <Icon size={18} />
              <span>{item.name.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}