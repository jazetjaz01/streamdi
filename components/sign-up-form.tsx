"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Location = {
  city: string | null;
  country_name: string | null;
};

export function SignUpForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Récupération de la localisation IP
  const getLocation = async (): Promise<Location> => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      return await res.json();
    } catch {
      return { city: null, country_name: null };
    }
  };

  // Appel API pour créer profil + chaîne
  const createProfile = async (access_token: string, display_name: string, usernameParam: string) => {
    const location = await getLocation();
    await fetch("/api/create-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token,
        display_name,
        username: usernameParam,
        city: location.city,
        country: location.country_name,
      }),
    });
  };

  // -----------------------
  // SIGN UP EMAIL/PASSWORD
  // -----------------------
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password !== repeatPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { full_name: username } },
      });

      if (signUpError) throw signUpError;

      if (data.session?.access_token) {
  await createProfile(data.session.access_token, username, username.toLowerCase().replace(/\s+/g, ""));
  router.refresh(); // 👈 force la mise à jour côté serveur
}


      router.push("/auth/sign-up-success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------
  // SIGN UP GOOGLE
  // -----------------------
  const handleGoogleSignIn = async () => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else window.location.href = data.url;
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Nom et prénom</Label>
          <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repeat-password">Répéter le mot de passe</Label>
          <Input id="repeat-password" type="password" value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)} required />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit" disabled={isLoading}>{isLoading ? "Création..." : "S’inscrire"}</Button>
      </form>

      <Button variant="outline" onClick={handleGoogleSignIn} className="flex items-center gap-2 mt-4">
        <FcGoogle size={20} />
        S’inscrire avec Google
      </Button>
    </div>
  );
}
