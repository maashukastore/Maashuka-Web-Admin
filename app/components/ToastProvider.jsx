"use client";

import { Toaster } from "sileo";

export default function ToastProvider() {
  return (
    // Wrap the Toaster in an elevated div wrapper to force it over your z-[150] modals
    <div className="relative z-[9999]">
      <Toaster position="bottom-center" />
    </div>
  );
}