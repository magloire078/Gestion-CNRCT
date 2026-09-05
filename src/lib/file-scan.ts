import 'server-only';

export interface ScanResult {
    clean: boolean;
    /** Name of the detected threat, when clean === false */
    threat?: string;
    /** True when no scanner backend was configured, so the file was let through unchecked */
    skipped?: boolean;
}

/**
 * Scans a file buffer for malware before it is stored/served to other users.
 *
 * Backend selection (checked in this order):
 * 1. CLAMAV_SCANNER_URL — a self-hosted ClamAV REST wrapper (see docker/clamav-scanner).
 *    Free, unlimited, and keeps file contents inside our own infrastructure.
 * 2. VIRUSTOTAL_API_KEY — VirusTotal public API fallback (rate-limited, sends the
 *    file to a third party).
 * If neither is configured, scanning is skipped (fail-open) and a warning is logged —
 * production deployments should set CLAMAV_SCANNER_URL.
 */
export async function scanFile(buffer: Buffer, filename: string): Promise<ScanResult> {
    const clamAvUrl = process.env.CLAMAV_SCANNER_URL;
    if (clamAvUrl) {
        return scanWithClamAv(clamAvUrl, buffer, filename);
    }

    const virusTotalKey = process.env.VIRUSTOTAL_API_KEY;
    if (virusTotalKey) {
        return scanWithVirusTotal(virusTotalKey, buffer, filename);
    }

    console.warn('[file-scan] No malware scanner configured (CLAMAV_SCANNER_URL or VIRUSTOTAL_API_KEY). Upload allowed unscanned.');
    return { clean: true, skipped: true };
}

async function scanWithClamAv(scannerUrl: string, buffer: Buffer, filename: string): Promise<ScanResult> {
    const formData = new FormData();
    formData.append('file', new Blob([buffer]), filename);

    const response = await fetch(new URL('/scan', scannerUrl), {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`ClamAV scanner returned HTTP ${response.status}`);
    }

    const result = await response.json() as { clean: boolean; virus?: string };
    return { clean: result.clean, threat: result.virus };
}

async function scanWithVirusTotal(apiKey: string, buffer: Buffer, filename: string): Promise<ScanResult> {
    const formData = new FormData();
    formData.append('file', new Blob([buffer]), filename);

    const uploadResponse = await fetch('https://www.virustotal.com/api/v3/files', {
        method: 'POST',
        headers: { 'x-apikey': apiKey },
        body: formData,
    });

    if (!uploadResponse.ok) {
        throw new Error(`VirusTotal upload failed with HTTP ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    const analysisId = uploadData.data?.id;
    if (!analysisId) {
        throw new Error('VirusTotal did not return an analysis id');
    }

    // Poll for the analysis result. VirusTotal analyses usually complete within seconds.
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
            headers: { 'x-apikey': apiKey },
        });
        if (!analysisResponse.ok) continue;

        const analysisData = await analysisResponse.json();
        const status = analysisData.data?.attributes?.status;
        if (status !== 'completed') continue;

        const stats = analysisData.data?.attributes?.stats;
        const malicious = stats?.malicious ?? 0;
        const suspicious = stats?.suspicious ?? 0;

        if (malicious > 0 || suspicious > 0) {
            const results = analysisData.data?.attributes?.results ?? {};
            const firstHit = Object.values(results).find((r: any) => r.category === 'malicious' || r.category === 'suspicious') as any;
            return { clean: false, threat: firstHit?.result || 'Menace détectée' };
        }
        return { clean: true };
    }

    throw new Error('VirusTotal analysis timed out');
}
