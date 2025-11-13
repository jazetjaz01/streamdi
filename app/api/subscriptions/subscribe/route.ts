// app/api/subscriptions/subscribe/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { channelId } = await req.json();
    if (!channelId) return NextResponse.json({ error: "Channel ID manquant" }, { status: 400 });

    const supabase = await createClient();

    // Récupérer l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) return NextResponse.json({ error: "Utilisateur non connecté" }, { status: 401 });

    // Récupérer le profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profileError) return NextResponse.json({ error: "Profile non trouvé" }, { status: 400 });

    // Créer l'abonnement (ignore si existe déjà)
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        subscriber_profile_id: profile.id,
        channel_id: channelId
      })
      .select("id")
      .maybeSingle();

    if (error && error.code !== "23505") { // Ignore duplicate key
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur insertion abonnement:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
