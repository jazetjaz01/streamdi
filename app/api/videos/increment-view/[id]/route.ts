import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const videoId = params.id;

  if (!videoId) {
    return NextResponse.json({ error: "ID vidéo manquant" }, { status: 400 });
  }

  // Incrémentation atomique côté serveur
  const { error } = await supabase
    .from("videos")
    .update({ views_count: supabase.rpc("increment_views", { video_id: videoId }) })
    .eq("id", videoId);

  if (error) {
    console.error("Erreur incrémentation vues:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
