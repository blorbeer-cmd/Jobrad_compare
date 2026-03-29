"use client";

import { useState } from "react";
import type { TaxProfile } from "./tax";

const STORAGE_KEY = "jobrad:tax-profile";

export const DEFAULT_TAX_PROFILE: TaxProfile = {
  annualGrossSalary: 45_000,
  taxClass: 1,
  churchTax: false,
  childCount: 0,
};

function readFromStorage(): TaxProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as TaxProfile) : null;
  } catch {
    return null;
  }
}

export function useTaxProfile() {
  const [profile, setProfile] = useState<TaxProfile | null>(readFromStorage);

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

  return { profile, activeProfile, saveProfile, clearProfile };
}
