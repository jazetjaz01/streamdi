"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "./logout-button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useActiveChannel, Channel } from "@/context/ActiveChannelContext";
import { useRouter } from "next/navigation";

export function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeChannel, setActiveChannel } = useActiveChannel();
  const router = useRouter();
  const supabase = createClient();

  // === Charger user + profil + chaînes ===
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setChannels([]);
        setActiveChannel(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      setProfile(profileData);

      const { data: channelsData } = await supabase
        .from("channels")
        .select("*")
        .eq("profile_id", profileData.id);

      const allChannels = channelsData ?? [];
      setChannels(allChannels);

      // Vérifie s’il y a une chaîne sauvegardée dans localStorage
      const stored = localStorage.getItem("activeChannel");
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = allChannels.find((ch) => ch.id === parsed.id);
        if (found) {
          setActiveChannel(found);
          setLoading(false);
          return;
        }
      }

      // Sinon, définit la première chaîne par défaut
      if (!activeChannel && allChannels.length > 0) {
        setActiveChannel(allChannels[0]);
        localStorage.setItem("activeChannel", JSON.stringify(allChannels[0]));
      }

      setLoading(false);
    };

    fetchUserData();

    // === Écoute les changements d'auth ===
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          // Nettoyage complet
          setUser(null);
          setProfile(null);
          setChannels([]);
          setActiveChannel(null);
          localStorage.removeItem("activeChannel");
          router.refresh();
        } else if (event === "SIGNED_IN") {
          fetchUserData();
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase, setActiveChannel]);

  // === Rafraîchit les chaînes ===
  const handleRefresh = async () => {
    if (!profile?.id) return;
    const { data: refreshedChannels } = await supabase
      .from("channels")
      .select("*")
      .eq("profile_id", profile.id);

    setChannels(refreshedChannels ?? []);
  };

  // === Gère la sélection d'une nouvelle chaîne ===
  const handleChangeChannel = (ch: Channel) => {
    setActiveChannel(ch);
    localStorage.setItem("activeChannel", JSON.stringify(ch));
  };

  if (loading) return null;

  // Aucun utilisateur connecté
  if (!user) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" className="hidden sm:inline-flex rounded-full">
          <Link href="/auth/login">Connexion</Link>
        </Button>
        <Button className="rounded-full">
          <Link href="/auth/sign-up">S'enregistrer</Link>
        </Button>
      </div>
    );
  }

  // === Données visuelles ===
  const avatarUrl =
    activeChannel?.avatar_url ||
    profile?.avatar_url ||
    "/default-avatar.png";

  const displayName =
    activeChannel?.name ||
    profile?.display_name ||
    profile?.username ||
    "Utilisateur";

  const otherChannels = channels.filter((ch) => ch.id !== activeChannel?.id);

  // === Interface ===
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700 cursor-pointer"
          title={displayName}
        >
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* === Mon compte === */}
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/account/profile" className="flex items-center gap-2">
            <Image
              src={profile?.avatar_url || "/default-avatar.png"}
              alt="Profil"
              width={24}
              height={24}
              className="rounded-full"
            />
            <span>{profile?.username || "Mon profil"}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* === Chaîne active === */}
        <DropdownMenuLabel>Chaîne active</DropdownMenuLabel>
        <DropdownMenuItem className="flex items-center gap-2 cursor-default">
          <Image
            src={activeChannel?.avatar_url || "/default-avatar.png"}
            alt={displayName}
            width={24}
            height={24}
            className="rounded-full"
          />
          <span>{activeChannel?.name || "Aucune chaîne"}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* === Autres chaînes === */}
        {otherChannels.length > 0 && (
          <>
            <DropdownMenuLabel>Changer de chaîne</DropdownMenuLabel>
            {otherChannels.map((ch) => (
              <DropdownMenuItem
                key={ch.id}
                className="flex items-center gap-2"
                onClick={() => handleChangeChannel(ch)}
              >
                <Image
                  src={ch.avatar_url || "/default-avatar.png"}
                  alt={ch.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span>{ch.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* === Actions === */}
        <DropdownMenuItem onClick={handleRefresh}>
          🔄 Rafraîchir les chaînes
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account/channels" className="flex items-center gap-2">
            ⚙️ Gérer mes chaînes
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* === Déconnexion === */}
        <DropdownMenuItem>
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
