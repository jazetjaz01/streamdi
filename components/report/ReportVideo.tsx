"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag } from "lucide-react";

const REPORT_REASONS = [
  "Contenu à caractère sexuel",
  "Discours haineux ou violence",
  "Danger ou acte nuisible",
  "Spam ou pratique trompeuse",
  "Contenu violent ou explicite",
  "Violation de droits d'auteur",
  "Information trompeuse",
  "Autre",
];

interface ReportVideoProps {
  videoId: string;
}

export default function ReportVideo({ videoId }: ReportVideoProps) {
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleReasonChange = (value: string) => {
    setReason(value);
    setToast(null);
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDetails(e.target.value);
    setToast(null);
  };

  const submitReport = async () => {
    setLoading(true);
    setToast(null);

    if (!reason) {
      setToast({ type: "error", message: "Veuillez sélectionner une raison" });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, reason, details }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ type: "error", message: data.error || "Erreur lors de l'envoi du signalement" });
      } else {
        setToast({ type: "success", message: "Signalement envoyé. Merci !" });
        setOpen(false);
        setReason("");
        setDetails("");
      }
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Erreur serveur inattendue" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-500 hover:underline flex items-center gap-1"
      >
        <Flag className="w-4 h-4" />
        Signaler
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Signaler la vidéo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Sélectionnez la raison du signalement :
            </p>

            <RadioGroup onValueChange={handleReasonChange} className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <RadioGroupItem value={r} id={r} />
                  <label htmlFor={r} className="text-sm cursor-pointer">{r}</label>
                </div>
              ))}
            </RadioGroup>

            <Textarea
              placeholder="Détails (facultatif)"
              value={details}
              onChange={handleDetailsChange}
            />
          </div>

          <DialogFooter>
            <Button
              disabled={!reason || loading}
              onClick={submitReport}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 transition-opacity duration-300 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
