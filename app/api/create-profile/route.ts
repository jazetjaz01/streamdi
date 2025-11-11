import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

// Génère un handle "slug" de base
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// Génère un handle unique dans la table profiles
async function generateUniqueHandle(name: string, supabase: ReturnType<typeof createClient>) {
  let baseHandle = slugify(name);
  let handle = baseHandle;
  let suffix = 1;

  while (true) {
    const { data: existing, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .maybeSingle();

    if (error) {
      console.error("Erreur vérification handle:", error);
      throw new Error(error.message);
    }

    if (!existing) break; // Aucun conflit, handle unique trouvé

    // Conflit trouvé, on ajoute un suffixe
    handle = `${baseHandle}_${suffix}`;
    suffix++;
  }

  return handle;
}

export async function POST(req: NextRequest) {
  try {
    const { access_token, display_name, username, city, country } = await req.json();

    if (!access_token) {
      return NextResponse.json({ error: "Access token manquant" }, { status: 400 });
    }

    const supabase = createClient();

    // 1️⃣ Récupération de l'utilisateur via le token
    const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
    if (userError || !user) {
      console.error("Utilisateur invalide ou token expiré:", userError);
      return NextResponse.json({ error: "Utilisateur invalide ou token expiré" }, { status: 401 });
    }
    const user_id = user.id;
    console.log("Utilisateur connecté:", user_id);

    // Récupération de l'avatar Google si disponible
    const avatarUrl = user.user_metadata?.avatar_url || "/default-avatar.png";

    // 2️⃣ Vérification si le profil existe déjà
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingProfileError) {
      console.error("Erreur vérification profil:", existingProfileError);
      return NextResponse.json({ error: existingProfileError.message || "Erreur vérification profil" }, { status: 500 });
    }

    let profileId: string;
    let handle: string;

    // 3️⃣ Création du profil si non existant
    if (!existingProfile) {
      handle = await generateUniqueHandle(display_name || username || "user", supabase);

      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id,
          display_name,
          username,
          handle,
          city,
          country,
          avatar_url: avatarUrl,
        })
        .select("id")
        .single();

      if (insertError || !newProfile) {
        console.error("Erreur création profil:", insertError);
        return NextResponse.json({ error: insertError?.message || "Erreur création profil" }, { status: 500 });
      }

      profileId = newProfile.id;
      console.log("Profil créé avec succès:", profileId);
    } else {
      profileId = existingProfile.id;
      console.log("Profil existant trouvé:", profileId);

      // On récupère le handle existant
      const { data: profileData } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", profileId)
        .single();

      handle = profileData?.handle || "user";
    }

    // 4️⃣ Vérification si la chaîne existe déjà
    const { data: existingChannel, error: existingChannelError } = await supabase
      .from("channels")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existingChannelError) {
      console.error("Erreur vérification chaîne:", existingChannelError);
      return NextResponse.json({ error: existingChannelError.message || "Erreur vérification chaîne" }, { status: 500 });
    }

    // 5️⃣ Création de la chaîne si elle n’existe pas
    if (!existingChannel) {
      const channelHandle = await generateUniqueHandle(display_name || username || "user", supabase);

      const { data: channel, error: channelError } = await supabase
        .from("channels")
        .insert({
          profile_id: profileId,
          name: `${display_name || username}'s Channel`,
          handle: channelHandle,
          description: `Bienvenue sur la chaîne de ${display_name || username}`,
          total_views: 0,
          subscribers_count: 0,
          visibility: "public",
          avatar_url: avatarUrl,
        })
        .select("id")
        .single();

      if (channelError || !channel) {
        console.error("Erreur création chaîne:", channelError);
        return NextResponse.json({ error: channelError?.message || "Erreur création chaîne" }, { status: 500 });
      }

      console.log("Chaîne créée avec succès:", channel.id);
    }

    return NextResponse.json({
      message: "Profil et chaîne créés/mis à jour avec succès",
      profile_id: profileId,
      handle,
    });

  } catch (err) {
    console.error("Erreur serveur /api/create-profile:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
