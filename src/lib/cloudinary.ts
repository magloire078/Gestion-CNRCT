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

    const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload error:', errorData);
        throw new Error(errorData.error || 'Échec de l\'upload du fichier');
    }

    const data = await response.json();
    return data.url;
}
