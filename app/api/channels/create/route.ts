import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { name, handle, description, visibility, avatar_url } = body;

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
    }

    // Récupérer le profil lié à cet utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

    // Créer la nouvelle chaîne
    const { data: newChannel, error: insertError } = await supabase
      .from("channels")
      .insert([
        {
          profile_id: profile.id,
          name,
          handle,
          description,
          visibility,
          avatar_url, // <-- ici on enregistre bien l'avatar
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ channel: newChannel }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
