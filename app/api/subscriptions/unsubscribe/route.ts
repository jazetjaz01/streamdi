// app/api/subscriptions/unsubscribe/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { channelId } = await req.json();
    if (!channelId) return NextResponse.json({ error: "Channel ID manquant" }, { status: 400 });

    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) return NextResponse.json({ error: "Utilisateur non connecté" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile || profileError) return NextResponse.json({ error: "Profile non trouvé" }, { status: 400 });

    // Supprimer l'abonnement
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("subscriber_profile_id", profile.id)
      .eq("channel_id", channelId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur suppression abonnement:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
