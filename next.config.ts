
import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  /* eslint: {
    ignoreDuringBuilds: true,
  }, */
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { 
            key: 'Content-Security-Policy', 
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://*.vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live; font-src 'self' data: https://fonts.gstatic.com https://vercel.live https://assets.vercel.com; img-src 'self' data: blob: https: https://*.cloudinary.com https://res.cloudinary.com https://*.googleusercontent.com https://*.googleapis.com https://*.gstatic.com https://api.dicebear.com https://upload.wikimedia.org https://placehold.co https://cnrct.ci https://vercel.live https://vercel.com https://www.googletagmanager.com https://www.google-analytics.com https://server.arcgisonline.com https://*.arcgisonline.com https://*.tile.openstreetmap.org https://*.openstreetmap.org https://*.basemaps.cartocdn.com https://*.cartocdn.com https://unpkg.com https://cdnjs.cloudflare.com; connect-src 'self' https: wss: https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://vercel.live https://*.vercel.live https://*.pusher.com wss://*.pusher.com https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://res.cloudinary.com https://*.cloudinary.com https://server.arcgisonline.com https://*.arcgisonline.com https://*.tile.openstreetmap.org https://*.openstreetmap.org https://*.basemaps.cartocdn.com https://*.cartocdn.com; frame-src 'self' https://www.google.com https://www.google.com/recaptcha/ https://recaptcha.google.com https://*.firebaseapp.com https://vercel.live;"
          }
        ],
      }
    ]
  },
  serverExternalPackages: ['google-auth-library', 'xlsx', 'firebase-admin', 'docx'],
};

export default withPWA(nextConfig);
