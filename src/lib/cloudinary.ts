/**
 * Uploade un fichier via notre API interne (/api/upload), qui le scanne contre
 * les malwares avant de le transférer à Cloudinary avec des identifiants
 * signés côté serveur. Le fichier ne part plus directement du navigateur vers
 * Cloudinary avec un preset non signé.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
    let headers: HeadersInit = {};
    try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            headers = { 'Authorization': `Bearer ${token}` };
        }

        const { getToken } = await import('firebase/app-check');
        const { appCheck } = await import('@/lib/firebase');
        if (appCheck) {
            const appCheckToken = await getToken(appCheck, false);
            (headers as any)['X-Firebase-AppCheck'] = appCheckToken.token;
        }
    } catch {
        console.warn('[Cloudinary] Auth/AppCheck indisponible pour l\'upload');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers,
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            if (data.url) return data.url;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.warn('[Cloudinary] /api/upload error:', response.status, errorData);
        }
    } catch (apiErr) {
        console.warn('[Cloudinary] /api/upload failed to fetch:', apiErr);
    }

    // Fallback: Direct upload to Cloudinary if upload preset is configured
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (cloudName && uploadPreset) {
        const directFormData = new FormData();
        directFormData.append('file', file);
        directFormData.append('upload_preset', uploadPreset);

        const directResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
            method: 'POST',
            body: directFormData,
        });

        if (directResponse.ok) {
            const directData = await directResponse.json();
            return directData.secure_url || directData.url;
        } else {
            const directError = await directResponse.json().catch(() => ({}));
            console.error('[Cloudinary] Direct upload error:', directError);
            throw new Error(directError.error?.message || 'Échec de l\'envoi de l\'image vers Cloudinary');
        }
    }

    throw new Error('Échec de l\'enregistrement de l\'image. Vérifiez la configuration Cloudinary.');
}
