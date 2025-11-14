// /api/likes/unlike/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json();
    if (!videoId) return NextResponse.json({ error: "Video ID manquant" }, { status: 400 });

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Utilisateur non connecté" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) return NextResponse.json({ error: "Profile non trouvé" }, { status: 400 });

    const { data: existingLike } = await supabase
      .from("video_likes")
      .select("id")
      .eq("video_id", videoId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!existingLike) {
      const { data: video } = await supabase.from("videos").select("likes_count").eq("id", videoId).maybeSingle();
      return NextResponse.json({ likesCount: video?.likes_count ?? 0 });
    }

    // Supprimer le like
    await supabase
      .from("video_likes")
      .delete()
      .eq("video_id", videoId)
      .eq("profile_id", profile.id);

    // Décrémenter le compteur
    const { data: video } = await supabase
      .from("videos")
      .select("likes_count")
      .eq("id", videoId)
      .maybeSingle();

    const newCount = Math.max((video?.likes_count ?? 1) - 1, 0);

    await supabase
      .from("videos")
      .update({ likes_count: newCount })
      .eq("id", videoId);

    return NextResponse.json({ likesCount: newCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
