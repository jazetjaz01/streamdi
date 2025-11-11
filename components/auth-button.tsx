import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // 🔹 Récupère l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 🔹 Aucun utilisateur connecté → afficher Connexion / Inscription
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

  // 🔹 Récupère le profil de l'utilisateur connecté
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("user_id", user.id)
    .single();

  // ✅ Utilisation de l'image locale par défaut
  const avatarUrl = profile?.avatar_url || "/default-avatar.png";

  return (
    <div className="flex items-center gap-4">
      <Link href="/account/profile">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      </Link>
      <LogoutButton />
    </div>
  );
}
