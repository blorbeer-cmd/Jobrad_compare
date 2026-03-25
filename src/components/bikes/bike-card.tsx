"use client";

import { Heart } from "lucide-react";
import type { Bike } from "@/adapters/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BikeCardProps {
  bike: Bike;
  isSaved?: boolean;
  onToggleSave?: (bike: Bike) => void;
  onCompare?: (bike: Bike) => void;
  isComparing?: boolean;
}

export function BikeCard({ bike, isSaved, onToggleSave, onCompare, isComparing }: BikeCardProps) {
  return (
    <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted">
        {bike.imageUrl ? (
          <img
            src={bike.imageUrl}
            alt={bike.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <svg className="h-16 w-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        )}

        {/* Save button */}
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(bike)}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm transition-colors hover:bg-white"
          >
            <Heart
              className={cn("h-4 w-4", isSaved ? "fill-red-500 text-red-500" : "text-gray-600")}
            />
          </button>
        )}

        {/* Category badge */}
        <Badge className="absolute left-3 top-3" variant="secondary">
          {bike.category}
        </Badge>
      </div>

      {/* Content */}
      <CardContent className="flex-1 p-4">
        <p className="text-xs text-muted-foreground">{bike.brand}</p>
        <h3 className="mt-1 font-semibold leading-tight line-clamp-2">{bike.name}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl font-bold">
            {bike.price.toLocaleString("de-DE", { minimumFractionDigits: 0 })}
          </span>
          <span className="text-sm text-muted-foreground">&euro;</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{bike.dealer}</p>
        {bike.availability && (
          <Badge variant="outline" className="mt-2 text-xs">
            {bike.availability}
          </Badge>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="gap-2 p-4 pt-0">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <a href={bike.dealerUrl} target="_blank" rel="noopener noreferrer">
            Zum H\u00e4ndler
          </a>
        </Button>
        {onCompare && (
          <Button
            variant={isComparing ? "default" : "secondary"}
            size="sm"
            onClick={() => onCompare(bike)}
          >
            {isComparing ? "Ausgew\u00e4hlt" : "Vergleichen"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
