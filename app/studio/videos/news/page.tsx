'use client';

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UploadVideoPage() {
  const supabase = createClient();

  // ----------------------------- STATES -----------------------------
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const MAX_VIDEO_SIZE_MB = 100;

  // ----------------------------- FETCH USER + PROFILE + CHANNEL -----------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setErrorMsg("Aucun utilisateur connecté.");
          setLoading(false);
          return;
        }
        setUser(user);

        // 2️⃣ Récupérer le profil associé
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name, username")
          .eq("user_id", user.id)
          .single();

        if (profileError || !profileData) {
          setErrorMsg("Profil introuvable pour cet utilisateur.");
          setLoading(false);
          return;
        }
        setProfile(profileData);

        // 3️⃣ Récupérer la chaîne liée à ce profil
        const { data: channelData, error: channelError } = await supabase
          .from("channels")
          .select("id, name, handle")
          .eq("profile_id", profileData.id)
          .single();

        if (channelError || !channelData) {
          setErrorMsg("Aucune chaîne associée à ce profil. Créez-en une d’abord.");
          setLoading(false);
          return;
        }

        setChannel(channelData);
      } catch (err) {
        console.error(err);
        setErrorMsg("Erreur lors du chargement des données utilisateur.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // ----------------------------- HANDLE VIDEO -----------------------------
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
        setErrorMsg(`La taille maximale est de ${MAX_VIDEO_SIZE_MB} Mo.`);
        setVideoFile(null);
        return;
      }
      setVideoFile(file);
      setErrorMsg("");
    }
  };

  // ----------------------------- HANDLE SUBMIT -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!channel) return setErrorMsg("Aucune chaîne trouvée. Créez une chaîne avant d’uploader.");
    if (!title.trim()) return setErrorMsg("Le titre est obligatoire.");
    if (!videoFile) return setErrorMsg("Veuillez sélectionner une vidéo.");

    setSubmitting(true);
    try {
      // Upload vidéo
      const videoFileName = `${Date.now()}_${videoFile.name}`;
      const { error: videoError } = await supabase.storage.from("videos").upload(videoFileName, videoFile);
      if (videoError) throw videoError;
      const { data: videoPublicData } = supabase.storage.from("videos").getPublicUrl(videoFileName);

      // Upload miniature
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const thumbFileName = `${Date.now()}_${thumbnailFile.name}`;
        const { error: thumbError } = await supabase.storage.from("thumbnails").upload(thumbFileName, thumbnailFile);
        if (thumbError) throw thumbError;
        const { data: thumbPublicData } = supabase.storage.from("thumbnails").getPublicUrl(thumbFileName);
        thumbnailUrl = thumbPublicData.publicUrl;
      }

      // Insert dans la table videos
      const { error: insertError } = await supabase.from("videos").insert({
        channel_id: channel.id,
        title,
        description,
        video_url: videoPublicData.publicUrl,
        thumbnail_url: thumbnailUrl,
        visibility: "public",
        views_count: 0,
      });

      if (insertError) throw insertError;

      setSuccessMsg("✅ Vidéo uploadée avec succès !");
      setTitle("");
      setDescription("");
      setCategory("");
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erreur lors de l’upload de la vidéo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Chargement des informations...</p>;

  return (
    <div className="w-full mx-auto p-8 mt-5 border rounded-lg bg-white dark:bg-zinc-900 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Uploader une vidéo</h1>

      {channel ? (
        <p className="text-sm text-gray-500 mb-4">
          🎬 Chaîne active : <strong>{channel.name}</strong> (@{channel.handle})
        </p>
      ) : (
        <p className="text-red-500 mb-4">Aucune chaîne trouvée pour ce profil.</p>
      )}

      {errorMsg && <p className="text-red-500 mb-2">{errorMsg}</p>}
      {successMsg && <p className="text-green-500 mb-2">{successMsg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <label className="block mb-1 font-semibold">Titre *</label>
          <Input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-semibold">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
            rows={4}
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block mb-1 font-semibold">Catégorie</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisissez une catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Musique">Musique</SelectItem>
              <SelectItem value="Éducation">Éducation</SelectItem>
              <SelectItem value="Gaming">Gaming</SelectItem>
              <SelectItem value="Sport">Sport</SelectItem>
              <SelectItem value="Actualité">Actualité</SelectItem>
              <SelectItem value="Humour">Humour</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vidéo */}
        <div>
          <label className="block mb-1 font-semibold">Vidéo *</label>
          <Input type="file" accept="video/*" onChange={handleVideoChange} required />
        </div>

        {/* Miniature */}
        <div>
          <label className="block mb-1 font-semibold">Miniature</label>
          <Input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files?.[0] || null)} />
        </div>

        <Button type="submit" disabled={submitting || !channel}>
          {submitting ? "Upload en cours..." : "Uploader la vidéo"}
        </Button>
      </form>
    </div>
  );
}
