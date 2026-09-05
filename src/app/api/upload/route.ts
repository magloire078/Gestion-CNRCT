import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { requireAuth, requireAppCheck } from '@/lib/api-auth';
import { scanFile } from '@/lib/file-scan';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo

/**
 * Point d'entrée unique pour tous les uploads de fichiers de l'application
 * (documents du repository, photos employés/chefs, etc.).
 *
 * Le fichier est d'abord scanné (voir src/lib/file-scan.ts) puis, s'il est
 * sain, envoyé à Cloudinary via un upload signé côté serveur (les identifiants
 * Cloudinary ne sont donc jamais exposés au navigateur).
 */
export async function POST(req: NextRequest) {
    try {
        const appCheckError = await requireAppCheck(req);
        if (appCheckError) return appCheckError;

        const { errorResponse } = await requireAuth(req);
        if (errorResponse) return errorResponse;

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'Fichier trop volumineux (25 Mo maximum).' }, { status: 413 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const scanResult = await scanFile(buffer, file.name);
        if (!scanResult.clean) {
            console.warn(`[API Upload] Fichier rejeté (${file.name}): menace détectée - ${scanResult.threat}`);
            return NextResponse.json(
                { error: `Fichier rejeté : une menace a été détectée (${scanResult.threat || 'inconnue'}).` },
                { status: 422 }
            );
        }

        const url = await uploadToCloudinarySigned(buffer, file.name);
        return NextResponse.json({ url });
    } catch (error: any) {
        console.error('[API Upload] Erreur:', error.message);
        return NextResponse.json(
            { error: 'Erreur lors du traitement du fichier.', detail: error.message },
            { status: 500 }
        );
    }
}

async function uploadToCloudinarySigned(buffer: Buffer, filename: string): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error('Configuration Cloudinary manquante (CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).');
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `timestamp=${timestamp}`;
    const signature = createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

    const formData = new FormData();
    formData.append('file', new Blob([buffer]), filename);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Échec de l\'upload vers Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
}
