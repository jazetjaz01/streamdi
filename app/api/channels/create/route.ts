import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { name, handle, description, visibility, avatar_url, banner_url } = body;

    // 🔐 Vérification de l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" },
        { status: 401 }
      );
    }

    // 👤 Récupération du profil lié à l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil introuvable" },
        { status: 404 }
      );
    }

    // 🆕 Création de la chaîne avec avatar + bannière
    const { data: newChannel, error: insertError } = await supabase
      .from("channels")
      .insert([
        {
          profile_id: profile.id,
          name,
          handle,
          description,
          visibility,
          avatar_url, // ✅ avatar enregistré
          banner_url, // ✅ nouvelle bannière enregistrée
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ channel: newChannel }, { status: 201 });
  } catch (err: any) {
    console.error("Erreur lors de la création de la chaîne :", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
