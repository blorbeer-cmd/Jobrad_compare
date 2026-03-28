"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, Database, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDataAge } from "@/lib/freshness";
import type { AdapterHealth } from "@/adapters/types";

interface AdapterStatusResponse {
  adapters: AdapterHealth[];
}

function formatTtl(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  return `${m}min`;
}

export default function AdaptersPage() {
  const [data, setData] = useState<AdapterStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/adapters");
      if (res.ok) {
        setData(await res.json());
        setLastRefreshed(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function clearCache() {
    setCacheClearing(true);
    try {
      await fetch("/api/bikes/cache", { method: "DELETE" });
      await load();
    } finally {
      setCacheClearing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Adapter-Status</h2>
          <p className="text-sm text-muted-foreground">
            Übersicht der Datenquellen und ihres Fetch-Zustands.
            {lastRefreshed && (
              <span className="ml-2">Stand: {formatDataAge(lastRefreshed.toISOString())}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            disabled={cacheClearing}
            className="gap-1.5"
          >
            <Database className="h-4 w-4" />
            Cache leeren
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      ) : !data?.adapters.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 font-medium">Keine Adapter konfiguriert</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.adapters.map((adapter) => (
            <div
              key={adapter.name}
              className="rounded-xl border bg-card p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{adapter.name}</h3>
                {adapter.lastFetchAt ? (
                  adapter.isHealthy ? (
                    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700 shrink-0">
                      <CheckCircle className="h-3 w-3" />
                      OK
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 shrink-0">
                      <XCircle className="h-3 w-3" />
                      Fehler
                    </Badge>
                  )
                ) : (
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Clock className="h-3 w-3" />
                    Ausstehend
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Letzter Fetch</dt>
                  <dd className="font-medium">
                    {adapter.lastFetchAt
                      ? formatDataAge(new Date(adapter.lastFetchAt).toISOString())
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Einträge</dt>
                  <dd className="font-medium tabular-nums">{adapter.listingCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cache-TTL</dt>
                  <dd className="font-medium">{formatTtl(adapter.cacheTtlMs)}</dd>
                </div>
              </dl>

              {/* Error message */}
              {adapter.lastError && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <p className="font-medium">Letzter Fehler:</p>
                  <p className="mt-0.5 break-words">{adapter.lastError}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
