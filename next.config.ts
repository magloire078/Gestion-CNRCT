
import type { NextConfig } from 'next';

// ---------------------------------------------------------------------------
// Content Security Policy
//
// La CSP whiteliste explicitement ce qui doit pouvoir se charger. Toute source
// non listée est bloquée par le navigateur, ce qui neutralise la plupart des
// injections XSS (même en cas de faille React future).
//
// Sources autorisées :
//   - Firebase Auth, Firestore, Storage, Functions
//   - Cloudinary (media hosting)
//   - Google Fonts, Wikipedia (upload.wikimedia.org), placehold.co, dicebear
//   - OpenStreetMap tiles (Leaflet)
//   - reCAPTCHA (Firebase Auth)
//
// TODO amélioration future : passer à un CSP basé sur nonce pour éliminer
//   'unsafe-inline' sur script-src (nécessite un middleware Next.js qui
//   injecte le nonce dans les balises <script> générées).
// ---------------------------------------------------------------------------
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",   // Next.js inline scripts + Firebase SDK
    "'unsafe-eval'",     // Firebase SDK utilise Function() dans certains cas
    'https://apis.google.com',
    'https://www.gstatic.com',
    'https://www.google.com',
    'https://www.googletagmanager.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",   // Tailwind runtime, framer-motion, styled JSX
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',            // large mais raisonnable pour un CMS avec URLs images utilisateur
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://*.googleapis.com',
    'https://*.firebaseio.com',
    'wss://*.firebaseio.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://firestore.googleapis.com',
    'https://firebasestorage.googleapis.com',
    'https://firebaseinstallations.googleapis.com',
    'https://firebaseremoteconfig.googleapis.com',
    'https://api.cloudinary.com',
    'https://res.cloudinary.com',
    'https://*.tile.openstreetmap.org',
    'https://a.tile.openstreetmap.org',
    'https://b.tile.openstreetmap.org',
    'https://c.tile.openstreetmap.org',
  ],
  'frame-src': [
    "'self'",
    'https://*.firebaseapp.com',
    'https://www.google.com',       // reCAPTCHA
    'https://www.recaptcha.net',
  ],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],   // doublon défensif de X-Frame-Options: DENY
} as const;

const CSP_HEADER_VALUE = Object.entries(CSP_DIRECTIVES)
  .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
  .join('; ');

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
          // Content Security Policy — construite au dessus.
          { key: 'Content-Security-Policy', value: CSP_HEADER_VALUE },
        ],
      },
    ];
  },
};

export default nextConfig;
