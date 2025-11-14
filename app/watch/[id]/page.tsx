"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
 import { ThumbsUp } from "lucide-react";
interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  views_count: number;
  created_at: string;
  channel_id: string;
  likes_count: number;
  channel: {
    id: string;
    name: string;
    avatar_url: string | null;
    handle: string;
    subscribers_count: number;
  } | null;
}

export default function WatchPage() {
  const params = useParams();
  const videoId = params?.id;
  const supabase = createClient();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<number>(0);

  // Abonnement
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);

  // Like
  const [isLiked, setIsLiked] = useState<boolean | null>(null); // null = pas encore chargé
  const [likesCount, setLikesCount] = useState(0);
  const [loadingLike, setLoadingLike] = useState(false);

  // --- Charger la vidéo ---
  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("videos")
        .select(`
          *,
          channel:channel_id (id, name, avatar_url, handle, subscribers_count)
        `)
        .eq("id", videoId)
        .maybeSingle();

      if (error || !data) console.error("Erreur chargement vidéo:", error);
      else {
        setVideo(data);
        setViews(data.views_count || 0);
        setSubscribersCount(data.channel?.subscribers_count || 0);
        setLikesCount(data.likes_count || 0);
      }

      setLoading(false);
    };

    fetchVideo();
  }, [videoId, supabase]);

  // --- Vérifier l'abonnement ---
  useEffect(() => {
    const checkSubscription = async () => {
      if (!video?.channel?.id) return;
      try {
        const res = await fetch(`/api/subscriptions/status/${video.channel.id}`, {
          credentials: "include",
        });
        const status = await res.json();
        if (res.ok) setIsSubscribed(!!status.isSubscribed);
      } catch (err) {
        console.error("Erreur récupération statut abonnement", err);
      }
    };
    if (video?.channel?.id) checkSubscription();
  }, [video?.channel?.id]);

  // --- Vérifier le statut like dès le montage ---
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!video?.id) return;
      try {
        const res = await fetch(`/api/likes/status/${video.id}`, {
          credentials: "include",
        });
        const data = await res.json();
        setIsLiked(data.isLiked ?? false);
      } catch (err) {
        console.error("Erreur récupération statut like", err);
        setIsLiked(false);
      }
    };
    if (video?.id) fetchLikeStatus();
  }, [video?.id]);

  // --- Toggle abonnement ---
  const toggleSubscribe = async () => {
    if (!video?.channel?.id) return;
    setLoadingSub(true);
    try {
      const url = isSubscribed
        ? "/api/subscriptions/unsubscribe"
        : "/api/subscriptions/subscribe";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: video.channel.id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return console.error("Erreur toggle abonnement :", res.status, data);

      setIsSubscribed(!isSubscribed);
      setSubscribersCount(prev => isSubscribed ? prev - 1 : prev + 1);
    } catch (err) {
      console.error("Erreur toggle abonnement", err);
    } finally {
      setLoadingSub(false);
    }
  };

  // --- Toggle like / unlike ---
  const toggleLike = async () => {
    if (!video?.id || loadingLike) return;
    setLoadingLike(true);

    const newLikedState = !isLiked;
    setIsLiked(newLikedState); // Optimistic UI
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      const url = newLikedState ? "/api/likes/like" : "/api/likes/unlike";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setIsLiked(!newLikedState);
        setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
      }
    } catch (err) {
      console.error("Erreur toggle like:", err);
      setIsLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
    } finally {
      setLoadingLike(false);
    }
  };

  // --- Incrémenter les vues ---
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

  const formatViews = (views?: number | null) => {
    if (!views || views < 10) return "moins de 10 vues";
    if (views < 1000) return `${Math.floor(views / 10) * 10} vues`;
    if (views < 1_000_000) return `${(views / 1000).toFixed(1)} k vues`;
    return `${(views / 1_000_000).toFixed(1)} M vues`;
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;
  if (!video) return <div className="flex justify-center items-center min-h-screen">Vidéo introuvable</div>;

  return (
    <div className="min-h-screen dark:bg-black text-black dark:text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={video.video_url}
            controls
            className="w-full h-full object-contain"
            onPlay={incrementViews}
          />
        </div>

        <h1 className="text-2xl font-bold mt-4">{video.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {formatViews(views)} • {timeAgo(video.created_at)}
        </p>

        {video.channel && (
          <div className="flex items-center justify-between mt-6 ">
            <div className="flex gap-10">
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
                 <span className="text-sm text-gray-500 dark:text-gray-400">{subscribersCount} abonnés</span>
              </div>
            </Link>

                   <button
  onClick={toggleSubscribe}
  disabled={loadingSub}
  className={`px-2 py-3 rounded-md text-sm font-semibold transition-colors ${
    isSubscribed
      ? "bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
      : "bg-red-600 hover:bg-red-700 text-white"
  }`}
>
  {loadingSub ? "..." : isSubscribed ? "Abonné" : "S’abonner"}
</button>

            

                </div>



{/* Like / Unlike */}
{isLiked !== null && (
  <div className="flex items-center gap-2 cursor-pointer" onClick={toggleLike}>
    <ThumbsUp
      size={24}
      color={isLiked ? "#0ea5e9" : "#888888"} // bleu si liké, gris sinon
      strokeWidth={2}
      fill="none" // toujours vide
    />
    <span className="text-sm">{likesCount}</span>
  </div>
)}


            </div>
           
        )}




        {video.description && (
          <div className="mt-4 text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {video.description}
          </div>
        )}
      </div>
    </div>
  );
}

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
