import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  Unsubscribe,
} from "@/lib/firebase";
import { db } from "@/lib/firebase";
import type { ChiefEvent } from "@/types/chief-event";

const eventsCollection = collection(db, "chiefEvents");

// ─── Read ──────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<ChiefEvent[]> {
  const snap = await getDocs(query(eventsCollection, orderBy("date", "asc")));
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ChiefEvent));
}

export async function getEventsByRegion(region: string): Promise<ChiefEvent[]> {
  const q = query(eventsCollection, where("region", "==", region), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ChiefEvent));
}

export function subscribeToEvents(
  callback: (events: ChiefEvent[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(eventsCollection, orderBy("date", "asc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ChiefEvent))),
    (err) => { console.error("subscribeToEvents error:", err); onError?.(err); }
  );
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function createEvent(data: Omit<ChiefEvent, "id">): Promise<ChiefEvent> {
  const now = new Date().toISOString();
  const payload = { ...data, createdAt: now, updatedAt: now };
  const ref = await addDoc(eventsCollection, payload);
  return { id: ref.id, ...payload };
}

export async function updateEvent(id: string, data: Partial<Omit<ChiefEvent, "id">>): Promise<void> {
  await updateDoc(doc(db, "chiefEvents", id), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, "chiefEvents", id));
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Expand yearly recurring events into the given year so the calendar always
 * shows them, even if their stored date is from a previous year.
 */
export function expandRecurringEvents(events: ChiefEvent[], year: number): ChiefEvent[] {
  const result: ChiefEvent[] = [];
  for (const ev of events) {
    result.push(ev);
    if (ev.recursYearly) {
      const original = new Date(ev.date);
      if (original.getFullYear() !== year) {
        const projected = new Date(original);
        projected.setFullYear(year);
        result.push({
          ...ev,
          id: `${ev.id}-${year}`,
          date: projected.toISOString().split("T")[0],
          endDate: ev.endDate
            ? (() => {
                const e = new Date(ev.endDate);
                e.setFullYear(year);
                return e.toISOString().split("T")[0];
              })()
            : undefined,
        });
      }
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}
