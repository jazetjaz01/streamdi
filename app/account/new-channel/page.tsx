"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useActiveChannel } from "@/context/ActiveChannelContext";

export default function NewChannelPage() {
  const router = useRouter();
  const supabase = createClient();
  const { activeChannel } = useActiveChannel();

  const [formData, setFormData] = useState({
    name: "",
    handle: "",
    description: "",
    visibility: "public" as "public" | "private",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // --- Charger mots interdits ---
  useEffect(() => {
    const fetchBannedWords = async () => {
      const { data, error } = await supabase.from("banned_words").select("word");
      if (error) console.error("Erreur récupération banned_words:", error);
      else if (data) setBannedWords(data.map((w: any) => w.word.toLowerCase()));
    };
    fetchBannedWords();
  }, [supabase]);

  // --- Récupérer session utilisateur ---
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        console.warn("Utilisateur non connecté");
        return;
      }
      setUserId(session.user.id);
    };
    fetchUser();
  }, [supabase]);

  // --- Si un channel est actif, blocage création ---
  useEffect(() => {
    if (activeChannel) {
      setError(
        `Impossible de créer une nouvelle chaîne depuis le contexte "${activeChannel.name}". Seul le contexte "Mon compte" peut en créer une.`
      );
    }
  }, [activeChannel]);

  // --- Génération handle automatique ---
  useEffect(() => {
    if (!formData.name.trim()) return;
    const generateHandle = async () => {
      setCheckingHandle(true);
      const baseHandle = slugify(formData.name);
      let uniqueHandle = baseHandle;
      let count = 1;
      while (true) {
        const { data } = await supabase
          .from("channels")
          .select("id")
          .eq("handle", uniqueHandle)
          .maybeSingle();
        if (!data) break;
        count++;
        uniqueHandle = `${baseHandle}-${count}`;
      }
      setFormData(prev => ({ ...prev, handle: uniqueHandle }));
      setCheckingHandle(false);
    };
    generateHandle();
  }, [formData.name]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const checkForbiddenWords = (text: string) => {
    const words = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,!?;:]/g, "")
      .split(/\s+/);
    return words.find(word => bannedWords.includes(word)) || null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    const maxWords = name === "name" ? 20 : name === "description" ? 100 : Infinity;
    newValue = newValue.split(/\s+/).slice(0, maxWords).join(" ");
    const forbidden = checkForbiddenWords(newValue);
    if (forbidden) setError(`Le mot "${forbidden}" n'est pas autorisé.`);
    else setError(null);
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleVisibilityChange = (checked: boolean) =>
    setFormData({ ...formData, visibility: checked ? "public" : "private" });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBannerFile(file);
    setBannerPreview(file ? URL.createObjectURL(file) : null);
  };

  // --- Vérification si max chaînes atteint ---
  const canCreateChannel = async () => {
    if (!userId) return false;
    const { data, error } = await supabase
      .from("profiles")
      .select("channels_count")
      .eq("user_id", userId)
      .single();
    if (error) {
      console.error("Erreur récupération compteur de chaînes:", error.message);
      return false;
    }
    return (data.channels_count || 0) < 5;
  };

  // ✅ Fonction RPC pour incrémenter le compteur
  const incrementChannelsCount = async () => {
    if (!userId) return;
    const { error } = await supabase.rpc("increment_channels_count", { uid: userId });
    if (error) console.error("Erreur RPC increment_channels_count:", error.message);
  };

  // --- Soumission du formulaire ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeChannel) {
      setError("Une chaîne ne peut pas en créer une autre.");
      return;
    }

    const allowed = await canCreateChannel();
    if (!allowed) {
      setError("Vous avez atteint le nombre maximum de 5 chaînes par profil.");
      return;
    }

    const forbiddenInTitle = checkForbiddenWords(formData.name);
    const forbiddenInDesc = checkForbiddenWords(formData.description);
    if (forbiddenInTitle || forbiddenInDesc) {
      setError(`Impossible de soumettre : mot interdit "${forbiddenInTitle || forbiddenInDesc}".`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let avatar_url: string | null = null;
      let banner_url: string | null = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${formData.handle}-avatar-${Date.now()}.${fileExt}`;
        const filePath = `channels/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatar_url = data.publicUrl;
      }

      if (bannerFile) {
        const fileExt = bannerFile.name.split(".").pop();
        const fileName = `${formData.handle}-banner-${Date.now()}.${fileExt}`;
        const filePath = `channels/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("banners").upload(filePath, bannerFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("banners").getPublicUrl(filePath);
        banner_url = data.publicUrl;
      }

      const res = await fetch("/api/channels/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatar_url, banner_url, userId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erreur inconnue");

      await incrementChannelsCount();

      setSuccess("Chaîne créée avec succès !");
      router.push(`/channel/${result.channel.handle}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Si une chaîne est active ---
  if (activeChannel) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Création impossible</h2>
        <p className="text-gray-600">
          Vous êtes actuellement dans le contexte de la chaîne{" "}
          <span className="font-semibold">{activeChannel.name}</span>.  
          Seul le contexte <strong>"Mon compte"</strong> peut créer une nouvelle chaîne.
        </p>
        <button
          onClick={() => router.push(`/channel/${activeChannel.handle}`)}
          className="mt-6 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Retourner à ma chaîne
        </button>
      </div>
    );
  }

  // --- Formulaire principal ---
  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold ">Créer une nouvelle chaîne</h1>
      <h3 className="text-base  text-gray-500 mb-6">Le nombre de chaine est limité à cinq par compte</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium mb-1">Nom</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-2 bg-background"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.name.split(/\s+/).filter(Boolean).length} / 20 mots
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full border rounded-lg p-2 bg-background"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.split(/\s+/).filter(Boolean).length} / 100 mots
          </p>
        </div>

        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium mb-1">Avatar</label>
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="w-full border rounded-lg p-2 bg-background" />
          {avatarPreview && <img src={avatarPreview} alt="Prévisualisation avatar" className="mt-2 w-24 h-24 rounded-full object-cover border" />}
        </div>

        {/* Bannière */}
        <div>
          <label className="block text-sm font-medium mb-1">Bannière</label>
          <input type="file" accept="image/*" onChange={handleBannerChange} className="w-full border rounded-lg p-2 bg-background" />
          {bannerPreview && <img src={bannerPreview} alt="Prévisualisation bannière" className="mt-3 w-full h-40 object-cover rounded-lg border" />}
        </div>

        {/* Visibilité */}
        <div className="flex items-center gap-3">
          <Switch id="visibility" checked={formData.visibility === "public"} onCheckedChange={handleVisibilityChange} />
          <Label htmlFor="visibility">{formData.visibility === "public" ? "Chaîne publique" : "Chaîne privée"}</Label>
        </div>

        <button type="submit" disabled={loading || checkingHandle} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg transition">
          {loading ? "Création en cours..." : "Créer la chaîne"}
        </button>

        {error && <p className="text-red-600 mt-2">{error}</p>}
        {success && <p className="text-green-600 mt-2">{success}</p>}
      </form>
    </div>
  );
}
