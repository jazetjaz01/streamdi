"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;

  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    channel: {
      profile: {
        id: string;
        display_name: string;
        handle: string;
      };
    };
  };

  reporter: {
    id: string;
    display_name: string;
    handle: string;
  };
}

export default function ReportsAdminPage() {
  const supabase = createClient();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("reports")
      .select(
        `
        id,
        reason,
        details,
        status,
        created_at,

        video:video_id (
          id,
          title,
          thumbnail_url,
          channel:channel_id (
            profile:profile_id (
              id,
              display_name,
              handle
            )
          )
        ),

        reporter:reporter_id (
          id,
          display_name,
          handle
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur Supabase :", error.message, error);
      setReports([]);
      setLoading(false);
      return;
    }

    setReports(data as any);
    setLoading(false);
  };

  const markResolved = async (reportId: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", reportId);

    if (error) {
      console.error("Erreur MAJ :", error.message);
      return;
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: "resolved" } : r
      )
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Signalements</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : reports.length === 0 ? (
        <p>Aucun signalement trouvé.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-200 dark:border-neutral-700">
            <thead className="bg-gray-100 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-2 text-left">Vidéo</th>
                <th className="px-4 py-2 text-left">Auteur</th>
                <th className="px-4 py-2 text-left">Reporteur</th>
                <th className="px-4 py-2 text-left">Raison</th>
                <th className="px-4 py-2 text-left">Détails</th>
                <th className="px-4 py-2 text-left">Statut</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t border-gray-200 dark:border-neutral-700">
                  <td className="px-4 py-2">
                    <strong>{r.video?.title || "Vidéo inconnue"}</strong>
                    <br />
                    <span className="text-xs text-gray-500">ID: {r.video?.id}</span>
                  </td>

                  <td className="px-4 py-2">
                    {r.video?.channel?.profile?.display_name || "Inconnu"}
                    <br />
                    <span className="text-xs text-gray-500">
                      @{r.video?.channel?.profile?.handle}
                    </span>
                  </td>

                  <td className="px-4 py-2">
                    {r.reporter?.display_name}
                    <br />
                    <span className="text-xs text-gray-500">@{r.reporter?.handle}</span>
                  </td>

                  <td className="px-4 py-2">{r.reason}</td>
                  <td className="px-4 py-2">{r.details || "—"}</td>
                  <td className="px-4 py-2">{r.status}</td>

                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleString()}
                  </td>

                  <td className="px-4 py-2">
                    {r.status !== "resolved" && (
                      <button
                        onClick={() => markResolved(r.id)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Marquer traité
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
