import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

interface FlashMessageProps {
  message: string;
  onClose?: () => void;
  duration?: number; // ms avant auto-disparition (défaut 3500)
}

// Mots-clés qui indiquent un succès
const SUCCESS_KEYWORDS = [
  "succès",
  "succes",
  "Bienvenue",
  "✅",
  "créé",
  "cree",
  "créée",
  "crée",
  "mis à jour",
  "mise à jour",
  "modifié",
  "modifiée",
  "modifie",
  "supprimé",
  "supprimée",
  "supprime",
  "validé",
  "validée",
  "valide",
  "enregistré",
  "enregistrée",
  "enregistre",
  "ajouté",
  "ajoutée",
  "ajoute",
  "retiré",
  "retirée",
  "retire",
  "annulé",
  "annulée",
  "annule",
  "Mouvement",
  "Paiement",
  "Statut",
  "Compte",
  "Table",
  "Réservation",
  "Commande",
  "Rendu monnaie",
  "ticket clôturé",
  "Stock mis à jour",
  "Ingrédient",
];

const INFO_KEYWORDS = ["Chargement", "en cours", "traitement"];

const FlashMessage: React.FC<FlashMessageProps> = ({
  message,
  onClose,
  duration = 3500,
}) => {
  // Auto-dismiss
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  const text = message.replace("✅ ", "").replace("❌ ", "");

  const isError =
    message.startsWith("❌") ||
    message.toLowerCase().includes("erreur") ||
    message.toLowerCase().includes("invalide") ||
    message.toLowerCase().includes("refusé") ||
    message.toLowerCase().includes("impossible");
  const isInfo = !isError && INFO_KEYWORDS.some((k) => message.includes(k));
  const isSuccess =
    !isError &&
    !isInfo &&
    SUCCESS_KEYWORDS.some((k) =>
      message.toLowerCase().includes(k.toLowerCase()),
    );

  return (
    <div
      role="alert"
      className={cn(
        "fixed bottom-4 right-4 z-[110] max-w-sm w-full p-4 rounded-xl shadow-2xl border",
        "animate-in slide-in-from-bottom-4 fade-in duration-200",
        isSuccess && "bg-green-500/20 text-green-300 border-green-500/30",
        isError && "bg-red-500/20   text-red-300   border-red-500/30",
        isInfo && "bg-blue-500/20  text-blue-300  border-blue-500/30",
        !isSuccess &&
          !isError &&
          !isInfo &&
          "bg-primary/20 text-primary border-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed">{text}</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashMessage;
