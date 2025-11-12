"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  channel_name: string | null;
  channel_avatar: string | null;
  views_count: number;
  created_at: string;
}

export default function Home() {
  const supabase = createClient();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Format des vues
 const formatViews = (views?: number | null) => {
  if (!views || views < 10) return ""; // ne rien afficher si moins de 10

  if (views < 1000) {
    const rounded = Math.floor(views / 10) * 10;
    return `${rounded} vues`;
  }

  if (views < 1_000_000) return `${(views / 1000).toFixed(1)} k vues`;

  return `${(views / 1_000_000).toFixed(1)} M vues`;
};



  // 🔹 Temps écoulé
  const timeAgo = (dateStr: string) => {
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
  };

  // 🔹 Charger les vidéos depuis Supabase
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("videos")
          .select(`
            id, title, thumbnail_url, video_url, views_count, created_at,
            channels:channel_id (
              id,
              name,
              avatar_url,
              handle
            )
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped = (data || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          thumbnail_url: v.thumbnail_url,
          video_url: v.video_url,
          channel_name: v.channels?.name || "Chaîne inconnue",
          channel_avatar: v.channels?.avatar_url || null,
          views_count: v.views_count || 0,
          created_at: v.created_at,
        }));

        setVideos(mapped);
      } catch (error) {
        console.error("Erreur récupération vidéos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [supabase]);

  // 🔹 Affichage
  if (loading) return <p className="text-center mt-8">Chargement des vidéos...</p>;
  if (videos.length === 0) return <p className="text-center mt-8">Aucune vidéo disponible.</p>;

  return (
    <div className="min-h-screen dark:bg-black px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/watch/${video.id}`}
            className="flex flex-col hover:scale-[1.02] transition-transform"
          >
            {/* Miniature */}
            <div className="relative w-full aspect-video bg-gray-200 rounded-md overflow-hidden">
              <Image
                src={video.thumbnail_url || "/default-thumbnail.png"}
                alt={video.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Infos sous la miniature */}
            <div className="flex mt-3">
              {/* Avatar */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
                {video.channel_avatar ? (
                  <Image
                    src={video.channel_avatar}
                    alt={video.channel_name || "Chaîne"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center h-full text-white font-semibold">
                    {video.channel_name?.[0] ?? "C"}
                  </span>
                )}
              </div>

              {/* Titre + infos */}
              <div className="ml-3 flex flex-col">
                <h2 className="text-[16px] font-semibold line-clamp-2 text-gray-900 dark:text-white leading-tight">
                  {video.title}
                </h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {video.channel_name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatViews(video.views_count)} • {timeAgo(video.created_at)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
