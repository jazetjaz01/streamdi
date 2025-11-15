"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const REPORT_THRESHOLD = 1;

export async function POST(req: NextRequest) {
  try {
    const { videoId, reason, details } = await req.json();
    if (!videoId || !reason) {
      return NextResponse.json({ error: "Données manquantes : videoId ou reason" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1️⃣ Vérifier que la vidéo existe
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("id")
      .eq("id", videoId)
      .single();
    if (videoError || !video) return NextResponse.json({ error: "Vidéo introuvable" }, { status: 404 });

    // 2️⃣ Récupérer le profil du reporter (utilisateur connecté)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: "Utilisateur non connecté" }, { status: 401 });

    const { data: reporterProfile, error: reporterError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (reporterError || !reporterProfile) return NextResponse.json({ error: "Profil reporter introuvable" }, { status: 404 });

    // 3️⃣ Vérifier si le reporter a déjà signalé cette vidéo
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("video_id", videoId)
      .eq("reporter_id", reporterProfile.id)
      .maybeSingle();
    if (existingReport) return NextResponse.json({ error: "Vous avez déjà signalé cette vidéo" }, { status: 400 });

    // 4️⃣ Insérer le report
    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        video_id: videoId,
        reporter_id: reporterProfile.id,
        reason,
        details: details || null,
        status: "pending",
      })
      .select()
      .single();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    console.log("✅ Signalement créé :", report.id);

    // 5️⃣ Appeler la RPC pour bloquer la vidéo si seuil atteint
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "block_video_if_threshold_reached",
      { p_video_id: videoId, p_threshold: REPORT_THRESHOLD }
    );
    if (rpcError) console.error("Erreur RPC block_video:", rpcError.message);

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
