"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Location = {
  city: string | null;
  country_name: string | null;
};

export default function OAuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const handleCallback = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !data?.session?.access_token) {
          setError(sessionError?.message || "Impossible de récupérer la session");
          setLoading(false);
          return;
        }

        const session = data.session;

        let location: Location = { city: null, country_name: null };
        try {
          const res = await fetch("https://ipapi.co/json/");
          location = await res.json();
        } catch {
          console.warn("Impossible de récupérer la localisation");
        }

        await fetch("/api/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: session.access_token,
            display_name: session.user.user_metadata.full_name,
            username: session.user.user_metadata.full_name.replace(/\s+/g, "").toLowerCase(),
            city: location.city,
            country: location.country_name,
          }),
        });

        router.replace("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la création du profil");
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p>Connexion en cours...</p>
      </div>
    );
  }

  return null;
}
