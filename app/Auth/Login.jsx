"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client"; // Synced to your active folder convention
import { sileo } from "sileo";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return sileo.error({
        title: "Validation Error",
        description: "All parameter credentials are required.",
      });
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
       sileo.error({
          title: "Authentication Error",
          description: authError.message,
          fill: "black",
        });
        setLoading(false);
        return;
      }

      const userRole = user?.user_metadata?.role;

      if (userRole !== "superadmin") {
        await supabase.auth.signOut();
        sileo.error({
          title: "Access Terminated",
          description:
            "This node is strictly restricted to administrative accounts.",
        });
        setLoading(false);
        return;
      }

      sileo.success({
        title: "Session Authenticated",
        description: "Welcome back to the control workspace.",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Auth Loop Crash:", err);
      sileo.error({
        title: "Authentication Failed",
        description: err.message || "Invalid administrative credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    /* 1. RESPONSIVE CONTAINER WRAPPER
      🌟 Re-anchored document selection backgrounds directly to use selection:bg-primary parameters
    */
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-50 selection:bg-primary selection:text-white">
      {/* Dynamic responsive scaling card structure */}
      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-xl shadow-slate-200/40 text-left space-y-6 sm:space-y-8 relative overflow-hidden">
          {/* Subtle Decorative Structural Security Node Badge */}
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

          {/* Header Typography Framing */}
          <div className="space-y-1.5">
            <h1 className="text-lg sm:text-xl font-serif font-black tracking-widest text-slate-900">
              MAASHUKA
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
              <Lock size={10} className="shrink-0" />
              <span>Administrative Control Tower</span>
            </div>
          </div>

          {/* Interactive Input Forms Layout */}
          <form
            onSubmit={handleAdminAuthSubmit}
            className="space-y-4 sm:space-y-5"
          >
            {/* Email Access Coordinates Entry */}
            {/* 🌟 Focused field ring modified to transition cleanly into focus-within:border-primary */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Operator Coordinates (Email)
              </label>
              <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus-within:border-primary focus-within:bg-white transition-all duration-200 shadow-inner shadow-slate-100/10">
                <Mail size={15} className="text-slate-400 shrink-0 animate-in fade-in" />
                <input
                  type="email"
                  placeholder="admin@maashuka.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-transparent text-xs font-medium w-full outline-none text-slate-800 placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Secure Cryptographic Pass String Entry */}
            {/* 🌟 Focused passkey border adjusted to focus-within:border-primary settings */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Cryptographic Pass Key (Password)
              </label>
              <div className="flex items-center gap-2.5 px-3.5 sm:px-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl focus-within:border-primary focus-within:bg-white transition-all duration-200 shadow-inner shadow-slate-100/10">
                <Lock size={15} className="text-slate-400 shrink-0" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-transparent text-xs font-medium w-full outline-none text-slate-800 placeholder-slate-400 tracking-widest"
                  required
                />
              </div>
            </div>

            {/* Operational Form Submission CTA Buttons */}
            {/* 🌟 Central button component explicitly configured to deploy using brand bg-primary colors */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-12 bg-primary hover:opacity-90 text-white rounded-xl sm:rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-slate-50 disabled:text-slate-300 shadow-md shadow-primary/10 cursor-pointer touch-manipulation"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={14}
                      className="animate-spin text-white"
                    />
                    <span>Validating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Console</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer System Warning Safety Label */}
          <div className="border-t border-slate-50 pt-4 flex items-start gap-2 text-[10px] text-slate-400 font-medium leading-normal">
            <ShieldAlert size={12} className="text-slate-300 shrink-0 mt-0.5" />
            <span>
              Unauthorized access tracking is recorded on security live servers.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}