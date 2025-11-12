import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

// Route API : /api/videos/increment-view/[id]/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const videoId = params.id;

  if (!videoId) {
    return NextResponse.json({ error: "ID vidéo manquant" }, { status: 400 });
  }

  // Incrémentation atomique
  const { data, error } = await supabase
    .from("videos")
    .update({ views_count: supabase.rpc("increment_views", { video_id: videoId }) })
    .eq("id", videoId)
    .select("views_count") // récupère le nouveau nombre de vues
    .single();

  if (error || !data) {
    console.error("Erreur incrémentation vues:", error);
    return NextResponse.json({ error: error?.message || "Erreur inconnue" }, { status: 500 });
  }

  return NextResponse.json({ success: true, views: data.views_count });
}
