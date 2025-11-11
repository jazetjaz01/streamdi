"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function NewChannelPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    handle: "",
    description: "",
    visibility: "public" as "public" | "private",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVisibilityChange = (checked: boolean) => {
    setFormData({ ...formData, visibility: checked ? "public" : "private" });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Étape 1️⃣ : Upload de l’avatar s’il existe
      let avatar_url = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${formData.handle}-${Date.now()}.${fileExt}`;
        const filePath = `channels/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        avatar_url = data.publicUrl;
      }

      // Étape 2️⃣ : Création de la chaîne via l’API
      const res = await fetch("/api/channels/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, avatar_url }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Erreur inconnue");

      setSuccess("Chaîne créée avec succès !");
      router.push(`/channel/${result.channel.handle}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Créer une nouvelle chaîne</h1>

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
        </div>

        {/* Handle */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Handle (ex: ma-chaine)
          </label>
          <input
            type="text"
            name="handle"
            value={formData.handle}
            onChange={handleChange}
            required
            className="w-full border rounded-lg p-2 bg-background"
          />
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
        </div>

        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium mb-1">Avatar</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="w-full border rounded-lg p-2 bg-background"
          />
          {avatarFile && (
            <p className="text-sm text-gray-500 mt-1">
              Fichier sélectionné : {avatarFile.name}
            </p>
          )}
        </div>

        {/* Switch visibilité */}
        <div className="flex items-center gap-3">
          <Switch
            id="visibility"
            checked={formData.visibility === "public"}
            onCheckedChange={handleVisibilityChange}
          />
          <Label htmlFor="visibility">
            {formData.visibility === "public"
              ? "Chaîne publique"
              : "Chaîne privée"}
          </Label>
        </div>

        {/* Bouton valider */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition"
        >
          {loading ? "Création en cours..." : "Créer la chaîne"}
        </button>

        {error && <p className="text-red-600 mt-2">{error}</p>}
        {success && <p className="text-green-600 mt-2">{success}</p>}
      </form>
    </div>
  );
}
