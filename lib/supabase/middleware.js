import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const updateSession = async (request) => {
  const supabase = createSupabaseClient(
    supabaseUrl,
    supabaseKey
  );

  try {
    await supabase.auth.getUser();
  } catch (err) {
    // ignore; without auth helpers cookie syncing won't work here
  }

  return NextResponse.next();
};