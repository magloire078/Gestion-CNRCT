
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
    ],
  },
  serverExternalPackages: ['genkit', '@genkit-ai', 'google-auth-library', 'xlsx'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Node.js native modules for server-side bundles
      config.externals = config.externals || [];
      config.externals.push({
        'bufferutil': 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      });
    }
    return config;
  },
};

export default nextConfig;
