"use client";

import { useState } from "react";
import { Trash2, MessageSquare, ExternalLink, GitCompareArrows } from "lucide-react";
import type { Bike } from "@/adapters/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SavedBikeRecord {
  id: string;
  bikeData: Bike;
  dealer: string;
  note: string | null;
  createdAt: string;
}

interface SavedBikeCardProps {
  savedBike: SavedBikeRecord;
  onRemove: () => void;
  onUpdateNote: (note: string | null) => void;
  onCompare: () => void;
  isComparing?: boolean;
}

export function SavedBikeCard({
  savedBike,
  onRemove,
  onUpdateNote,
  onCompare,
  isComparing,
}: SavedBikeCardProps) {
  const { bikeData: bike } = savedBike;
  const [showNote, setShowNote] = useState(!!savedBike.note);
  const [noteText, setNoteText] = useState(savedBike.note ?? "");
  const [noteSaving, setNoteSaving] = useState(false);

  async function handleSaveNote() {
    setNoteSaving(true);
    const value = noteText.trim() || null;
    onUpdateNote(value);
    setNoteSaving(false);
    if (!value) setShowNote(false);
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all",
        isComparing && "ring-2 ring-primary"
      )}
    >
      <div className="flex gap-3 p-4">
        {/* Image */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24">
          {bike.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bike.imageUrl}
              alt={bike.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/20">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {bike.brand}
              </p>
              <h3 className="mt-0.5 font-semibold leading-snug line-clamp-2 text-sm">
                {bike.name}
              </h3>
            </div>
            <button
              onClick={onRemove}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Favorit entfernen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold tabular-nums">
              {bike.price.toLocaleString("de-DE", { minimumFractionDigits: 0 })}
            </span>
            <span className="text-sm text-muted-foreground">&euro;</span>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">{bike.category}</Badge>
            <Badge variant="outline" className="text-xs">{bike.dealer}</Badge>
          </div>
        </div>
      </div>

      {/* Note section */}
      {showNote && (
        <div className="border-t px-4 py-3">
          <Textarea
            placeholder="Deine Notiz zu diesem Fahrrad..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
            className="resize-none text-sm"
          />
          <div className="mt-2 flex justify-end gap-2">
            {savedBike.note !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNoteText("");
                  onUpdateNote(null);
                  setShowNote(false);
                }}
              >
                Löschen
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={noteSaving || noteText === (savedBike.note ?? "")}
            >
              Speichern
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 border-t px-3 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNote(!showNote)}
          className="gap-1.5 text-xs"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {savedBike.note ? "Notiz" : "Notiz"}
        </Button>
        <Button
          variant={isComparing ? "default" : "secondary"}
          size="sm"
          onClick={onCompare}
          className="gap-1.5 text-xs"
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
          {isComparing ? "Gewählt" : "Vergleich"}
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-xs" asChild>
          <a href={bike.dealerUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Händler
          </a>
        </Button>
      </div>
    </div>
  );
}
