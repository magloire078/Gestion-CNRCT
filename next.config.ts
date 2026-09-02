
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  /* eslint: {
    ignoreDuringBuilds: true,
  }, */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "cnrct.ci",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  serverExternalPackages: ['google-auth-library', 'firebase-admin', 'docx'],

  // En-têtes HTTP de sécurité — appliqués à toutes les routes.
  // Voir https://owasp.org/www-project-secure-headers/
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Empêche le "MIME sniffing" — le navigateur respecte le Content-Type déclaré.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Bloque le rendu de l'app dans une iframe cross-origin (protection clickjacking).
          { key: 'X-Frame-Options', value: 'DENY' },
          // Réduit l'information de referer envoyée vers l'extérieur.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Désactive par défaut les API sensibles du navigateur non utilisées.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
          // HSTS — force HTTPS sur 1 an, inclut les sous-domaines. Ne pas activer avant la mise en prod HTTPS complète.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Empêche le préchargement DNS croisé.
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
        ],
      },
    ];
  },
};

export default nextConfig;
