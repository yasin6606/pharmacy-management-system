/**
 * Lightweight offline draft queue for counter sales when the network drops.
 * Stores pending POST payloads in localStorage and flushes when online.
 *
 * NOTE: Stock is NOT decremented offline — drafts must be confirmed against
 * the server to avoid oversell. This is a UX continuity aid, not offline ERP.
 */

const KEY = 'pharmacy_offline_queue_v1';

export type OfflineJob = {
    id: string;
    createdAt: string;
    method: 'post' | 'put' | 'patch';
    url: string;
    body?: unknown;
    label?: string;
};

function read(): OfflineJob[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as OfflineJob[]) : [];
    } catch {
        return [];
    }
}

function write(jobs: OfflineJob[]) {
    localStorage.setItem(KEY, JSON.stringify(jobs));
}

export function enqueueOfflineJob(job: Omit<OfflineJob, 'id' | 'createdAt'>) {
    const full: OfflineJob = {
        ...job,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    const jobs = read();
    jobs.push(full);
    write(jobs);
    return full;
}

export function listOfflineJobs() {
    return read();
}

export function clearOfflineJob(id: string) {
    write(read().filter((j) => j.id !== id));
}

export function clearAllOfflineJobs() {
    write([]);
}

/** Attempt to flush queue using a poster function (e.g. apiPost). */
export async function flushOfflineQueue(
    poster: (method: string, url: string, body?: unknown) => Promise<unknown>
) {
    const remaining: OfflineJob[] = [];
    const results: {id: string; ok: boolean; error?: string}[] = [];
    for (const job of read()) {
        try {
            await poster(job.method, job.url, job.body);
            results.push({id: job.id, ok: true});
        } catch (e: any) {
            remaining.push(job);
            results.push({id: job.id, ok: false, error: e?.message || 'failed'});
        }
    }
    write(remaining);
    return results;
}

export function isBrowserOnline() {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
}
