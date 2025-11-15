"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const REPORT_THRESHOLD = 1; // seuil pour bloquer une vidéo

export async function POST(req: NextRequest) {
  try {
    console.log("📌 Début POST /reports/create");

    const { videoId, reason, details } = await req.json();
    if (!videoId || !reason) {
      return NextResponse.json({ error: "Données manquantes : videoId ou reason" }, { status: 400 });
    }

    const supabase = await createClient(); // Service Role Key

    // 1️⃣ Récupérer la vidéo et son channel_id
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("id, channel_id, visibility")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });
    }
    console.log("✅ Vidéo trouvée :", video.id);

    // 2️⃣ Récupérer l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Utilisateur non connecté" }, { status: 401 });
    }
    console.log("Utilisateur connecté :", user.id);

    // 3️⃣ Récupérer le profil reporter
    const { data: reporterProfile, error: reporterError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (reporterError || !reporterProfile) {
      return NextResponse.json({ error: "Profil du reporter introuvable" }, { status: 404 });
    }
    console.log("Profil reporter :", reporterProfile.id);

    // 4️⃣ Récupérer le profil du créateur via le channel
    const { data: creatorProfile, error: creatorError } = await supabase
      .from("channels")
      .select("profile_id")
      .eq("id", video.channel_id)
      .single();

    if (creatorError || !creatorProfile) {
      return NextResponse.json({ error: "Profil du créateur introuvable" }, { status: 404 });
    }
    console.log("Profil créateur :", creatorProfile.profile_id);

    // 5️⃣ Vérifier si l'utilisateur a déjà signalé la vidéo
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("video_id", video.id)
      .eq("reporter_id", reporterProfile.id)
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json({ error: "Vous avez déjà signalé cette vidéo" }, { status: 400 });
    }

    // 6️⃣ Insérer le signalement
    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        video_id: video.id,
        user_id: creatorProfile.profile_id, // créateur
        reporter_id: reporterProfile.id,    // reporter
        reason,
        details: details || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erreur insertion report :", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    console.log("✅ Signalement créé :", report.id);

    // 7️⃣ Appeler la RPC pour bloquer la vidéo si seuil atteint
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "block_video_if_threshold_reached",
      { p_video_id: video.id, p_threshold: REPORT_THRESHOLD }
    );

    if (rpcError) console.error("❌ Erreur RPC block_video:", rpcError.message);
    else console.log("🚫 Vérification blocage terminée :", rpcResult);

    return NextResponse.json({
      message: "Signalement créé avec succès",
      report,
      rpcResult,
    });

  } catch (err) {
    console.error("❌ Erreur serveur /reports/create :", err);
    return NextResponse.json({ error: "Erreur serveur inattendue" }, { status: 500 });
  }
}
