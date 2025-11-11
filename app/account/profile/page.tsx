"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Channel {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  subscribers_count: number;
  total_views: number;
  visibility: string;
}

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  language: string | null;
  theme_preference: string | null;
}

export default function AccountProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndChannels = async () => {
      try {
        // 🔹 Récupération de la session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          router.replace("/auth/login");
          return;
        }
        const user = sessionData.session.user;

        // 🔹 Profil utilisateur
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (profileError || !profileData) {
          console.error("Erreur récupération profil:", profileError);
          setProfile(null);
        } else {
          setProfile(profileData);
        }

        // 🔹 Chaînes associées
        const { data: channelsData, error: channelsError } = await supabase
          .from("channels")
          .select("*")
          .eq("profile_id", profileData?.id);
        if (channelsError) {
          console.error("Erreur récupération chaînes:", channelsError);
          setChannels([]);
        } else {
          setChannels(channelsData || []);
        }

      } catch (err) {
        console.error("Erreur globale récupération profil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndChannels();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500">Chargement du profil...</p>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-center mt-8 text-red-500">Profil introuvable.</p>;
  }

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center">
      {/* Bannière */}
      <div className="relative w-full max-w-5xl h-48 sm:h-56 md:h-64 overflow-hidden rounded-lg">
        <Image
          src={profile.banner_url || "/default-banner.png"}
          alt="Bannière"
          fill
          className="object-cover object-center"
        />
      </div>

      {/* Avatar & infos */}
      <div className="mt-6 w-full max-w-5xl px-4 flex flex-col items-center">
        <div className="relative w-24 h-24 border-4 border-white rounded-full overflow-hidden -mt-12">
          <Image
            src={profile.avatar_url || "/default-avatar.png"}
            alt={profile.display_name || profile.username || "Profil"}
            fill
            className="object-cover"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">
          {profile.display_name || profile.username}
        </h1>
        {profile.bio && <p className="mt-2 text-gray-700 text-center">{profile.bio}</p>}
        {(profile.city || profile.country) && (
          <p className="mt-1 text-gray-500 text-sm">
            {profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.city || profile.country}
          </p>
        )}
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline mt-1">
            {profile.website}
          </a>
        )}
      </div>

      {/* Chaînes de l'utilisateur */}
      {channels.length > 0 && (
        <div className="mt-8 w-full max-w-5xl px-4">
          <h2 className="text-xl font-semibold mb-4">Mes chaînes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {channels.map((ch) => (
              <Link
                key={ch.id}
                href={`/channel/${ch.handle}`}
                className="flex flex-col bg-gray-100 dark:bg-zinc-800 rounded-md overflow-hidden hover:scale-[1.02] transition-transform"
              >
                <div className="relative w-full h-32 bg-gray-300">
                  <Image
                    src={ch.banner_url || "/default-banner.png"}
                    alt={ch.name}
                    fill
                    className="object-cover object-center"
                  />
                </div>
                <div className="p-2">
                  <h3 className="font-semibold">{ch.name}</h3>
                  <p className="text-sm text-gray-500">{ch.subscribers_count} abonnés</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
