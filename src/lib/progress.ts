"use client";

/**
 * Reading progress, kept in localStorage so it survives reloads. It lives only
 * in this browser: nothing is sent anywhere. Components subscribe through
 * useProgress(), which also stays in sync across open tabs.
 */
import { useSyncExternalStore } from "react";

export interface ModuleProgress {
  /** Marked as done by the reader. */
  done?: boolean;
  /** How far down the page the reader has scrolled, 0..1. */
  scrolled?: number;
  /** Furthest point ever reached, 0..1. */
  furthest?: number;
  /** id and text of the section the reader was in last. */
  sectionId?: string;
  sectionTitle?: string;
  /** Unix ms of the last visit. */
  visitedAt?: number;
}

export interface ProgressState {
  modules: Record<string, ModuleProgress>;
  /** Key of the module read most recently. */
  lastKey?: string;
}

const STORAGE_KEY = "scn:progress:v1";
const EMPTY: ProgressState = { modules: {} };

let current: ProgressState | null = null;
const listeners = new Set<() => void>();

function read(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed && typeof parsed === "object" && parsed.modules && typeof parsed.modules === "object") return parsed;
  } catch {
    // Storage can be blocked (private mode) or hold junk; start fresh.
  }
  return EMPTY;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY) return;
  current = read();
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): ProgressState {
  current ??= read();
  return current;
}

function getServerSnapshot(): ProgressState {
  return EMPTY;
}

function write(next: ProgressState): void {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or privacy settings; progress then lasts for this tab only.
  }
  emit();
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateModule(key: string, patch: Partial<ModuleProgress>, options: { markLast?: boolean } = {}): void {
  const state = getSnapshot();
  const previous = state.modules[key] ?? {};
  const merged: ModuleProgress = { ...previous, ...patch };
  if (patch.scrolled !== undefined) merged.furthest = Math.max(previous.furthest ?? 0, patch.scrolled);
  write({
    ...state,
    modules: { ...state.modules, [key]: merged },
    lastKey: options.markLast ? key : state.lastKey,
  });
}

export function setDone(key: string, done: boolean): void {
  updateModule(key, { done });
}

export function clearProgress(keys?: string[]): void {
  if (!keys) {
    write(EMPTY);
    return;
  }
  const state = getSnapshot();
  const modules = { ...state.modules };
  for (const key of keys) delete modules[key];
  write({ modules, lastKey: state.lastKey && keys.includes(state.lastKey) ? undefined : state.lastKey });
}

/** Share of the given modules that are marked done, 0..100. */
export function percentDone(state: ProgressState, keys: string[]): number {
  if (keys.length === 0) return 0;
  const done = keys.filter((key) => state.modules[key]?.done).length;
  return Math.round((done / keys.length) * 100);
}

/** Current saved progress for one module (client only). */
export function getModuleProgress(key: string): ModuleProgress | undefined {
  return getSnapshot().modules[key];
}
