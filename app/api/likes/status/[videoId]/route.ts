import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> } // params est une Promise
) {
  try {
    const { videoId } = await params; // <-- await ici
    if (!videoId) return NextResponse.json({ isLiked: false });

    const supabase = await createClient(); // client SSR avec cookies

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) return NextResponse.json({ isLiked: false });

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profileError) return NextResponse.json({ isLiked: false });

    // Vérifier si le like existe
    const { data: like, error } = await supabase
      .from("video_likes")
      .select("id")
      .eq("video_id", videoId)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (error) {
      console.error("Erreur status like:", error);
      return NextResponse.json({ isLiked: false });
    }

    return NextResponse.json({ isLiked: !!like });
  } catch (err) {
    console.error("Erreur status like:", err);
    return NextResponse.json({ isLiked: false });
  }
}
