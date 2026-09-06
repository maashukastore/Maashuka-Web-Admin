import React from 'react'
import Link from "next/link";
import { Plus } from "lucide-react";
import { getPaginatedProducts } from "../../action";
import NewProduct from "../../../components/Products/NewProduct"; // We will create this next
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Add New Product | Maashuka Admin",
};


export default async function page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if(!user || !(user?.user_metadata?.role === "admin" || user?.user_metadata?.role === "superadmin")) {
   
      redirect("/login")

  }
  return (
    <NewProduct />
  )
}
