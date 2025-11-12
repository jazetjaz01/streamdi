import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // 👈 côté serveur

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // ✅ Ici on attend la promesse
  const supabase = await createClient();

  if (!id) {
    return NextResponse.json({ error: "ID vidéo manquant" }, { status: 400 });
  }

  // 🔹 Récupération du compteur actuel
  const { data: video, error: fetchError } = await supabase
    .from("videos")
    .select("views_count")
    .eq("id", id)
    .single();

  if (fetchError || !video) {
    console.error("Erreur récupération vidéo:", fetchError);
    return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
  }

  const newViews = (video.views_count || 0) + 1;

  // 🔹 Mise à jour du compteur
  const { error: updateError } = await supabase
    .from("videos")
    .update({ views_count: newViews })
    .eq("id", id);

  if (updateError) {
    console.error("Erreur incrémentation vues:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, views: newViews });
}
