"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  views_count: number;
  created_at: string;
  channel_id: string;
  channel: {
    id: string;
    name: string;
    avatar_url: string | null;
    handle: string;
  } | null;
}

export default function WatchPage() {
  const params = useParams();
  const videoId = params?.id;
  const supabase = createClient();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<number>(0);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select(`
          *,
          channel:channel_id (id, name, avatar_url, handle)
        `)
        .eq("id", videoId)
        .maybeSingle();

      if (error || !data) {
        console.error("Erreur chargement vidéo:", error);
      } else {
        setVideo(data);
        setViews(data.views_count || 0);
      }
      setLoading(false);
    };

    fetchVideo();
  }, [videoId, supabase]);

  // --- Incrémentation des vues une seule fois par session ---
  const incrementViews = async () => {
    if (!videoId) return;

    const key = `video_${videoId}_counted`;
    if (sessionStorage.getItem(key)) return;

    try {
      const res = await fetch(`/api/videos/increment-view/${videoId}`, { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        setViews(result.views);
        sessionStorage.setItem(key, "true");
      }
    } catch (err) {
      console.error("Erreur incrémentation vues:", err);
    }
  };

  // --- Formatage des vues ---
  const formatViews = (views?: number | null) => {
    if (!views || views < 10) return "moins de 10 vues";

    if (views < 1000) {
      const rounded = Math.floor(views / 10) * 10;
      return `${rounded} vues`;
    }

    if (views < 1_000_000) return `${(views / 1000).toFixed(1)} k vues`;

    return `${(views / 1_000_000).toFixed(1)} M vues`;
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;
  if (!video) return <div className="flex justify-center items-center min-h-screen">Vidéo introuvable</div>;

  return (
    <div className="min-h-screen dark:bg-black text-black dark:text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Player */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={video.video_url}
            controls
            className="w-full h-full object-contain"
            onPlay={incrementViews}
          />
        </div>

        {/* Titre et stats */}
        <h1 className="text-2xl font-bold mt-4">{video.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {formatViews(views)} • {timeAgo(video.created_at)}
        </p>

        {/* Chaîne */}
        {video.channel && (
          <div className="flex items-center gap-3 mt-6">
            <Link href={`/channel/${video.channel.handle}`} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                {video.channel.avatar_url ? (
                  <Image src={video.channel.avatar_url} alt={video.channel.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-white font-semibold">
                    {video.channel.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{video.channel.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{video.channel.handle}</p>
              </div>
            </Link>
          </div>
        )}

        {/* Description */}
        {video.description && (
          <div className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {video.description}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Utilitaire "il y a x" ---
function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const years = Math.floor(weeks / 52);
  if (hours < 24) return `il y a ${hours === 0 ? 1 : hours} ${hours > 1 ? "heures" : "heure"}`;
  if (days < 7) return `il y a ${days} ${days > 1 ? "jours" : "jour"}`;
  if (weeks < 52) return `il y a ${weeks} ${weeks > 1 ? "semaines" : "semaine"}`;
  return `il y a ${years} ${years > 1 ? "ans" : "an"}`;
}
