import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  context: { params: { channelId: string } | Promise<{ channelId: string }> }
) {
  // Décompresser params si c'est une Promise
  const resolvedParams = await context.params;
  const channelId = resolvedParams.channelId;

  if (!channelId) {
    return NextResponse.json({ error: "Channel ID manquant" }, { status: 400 });
  }

  const supabase = await createClient();

  // Récupérer l'utilisateur connecté
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError)
    return NextResponse.json({ error: "Utilisateur non connecté" }, { status: 401 });

  // Récupérer le profile associé à l'utilisateur
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profileError)
    return NextResponse.json({ error: "Profile non trouvé" }, { status: 400 });

  // Vérifier si un abonnement existe
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("subscriber_profile_id", profile.id)
    .eq("channel_id", channelId)
    .maybeSingle();

  if (error && error.code !== "PGRST116")
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ isSubscribed: !!data });
}
