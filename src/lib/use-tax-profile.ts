"use client";

import { useState, useEffect } from "react";
import type { TaxProfile } from "./tax";

const STORAGE_KEY = "jobrad:tax-profile";

export const DEFAULT_TAX_PROFILE: TaxProfile = {
  annualGrossSalary: 45_000,
  taxClass: 1,
  churchTax: false,
  childCount: 0,
};

export function useTaxProfile() {
  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored) as TaxProfile);
      }
    } catch {
      // Ignore parse errors — start fresh
    }
    setLoaded(true);
  }, []);

  function saveProfile(p: TaxProfile) {
    setProfile(p);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      // localStorage unavailable (private mode etc.) — keep in state only
    }
  }

  function clearProfile() {
    setProfile(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /** Profile to use for calculations: saved profile or fallback defaults */
  const activeProfile = profile ?? DEFAULT_TAX_PROFILE;

  return { profile, activeProfile, saveProfile, clearProfile, loaded };
}
