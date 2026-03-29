"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BikeCalculator } from "@/components/tax/bike-calculator";
import { TaxProfileForm } from "@/components/tax/tax-profile-form";
import { useTaxProfile } from "@/lib/use-tax-profile";
import type { Bike } from "@/adapters/types";
import { Button } from "@/components/ui/button";
import { Settings2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  bike: Bike;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalcModal({ bike, open, onOpenChange }: Props) {
  const { profile, saveProfile, clearProfile } = useTaxProfile();
  const [showProfile, setShowProfile] = useState(false);

  const listPrice = bike.listPrice ?? bike.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base leading-snug">{bike.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {bike.dealer} · {listPrice.toLocaleString("de-DE", { minimumFractionDigits: 0 })} € UVP
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {/* Tax profile toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between gap-2 text-xs"
            onClick={() => setShowProfile((v) => !v)}
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              Steuerprofil
              {profile ? (
                <span className="text-green-600 dark:text-green-400">gespeichert ✓</span>
              ) : (
                <span className="text-muted-foreground">– Standardwerte (45k€, Klasse 1)</span>
              )}
            </span>
            {showProfile ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>

          {showProfile && (
            <TaxProfileForm
              initialProfile={profile}
              onSave={(p) => {
                saveProfile(p);
                setShowProfile(false);
              }}
              onClear={clearProfile}
            />
          )}

          <BikeCalculator profile={profile} initialListPrice={listPrice} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
