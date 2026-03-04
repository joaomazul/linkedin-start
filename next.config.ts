import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/feed',
        permanent: false,
      },
      {
        source: '/settings',
        destination: '/settings/prompts',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        // Headers aplicados a todas as rotas
        source: '/(.*)',
        headers: [
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com blob:; script-src-elem 'self' 'unsafe-inline' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com blob:; connect-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://api.clerk.com https://api4.unipile.com https://api21.unipile.com wss://ws.pusherapp.com https://sockjs.pusher.com; img-src 'self' blob: data: https: https://*.clerk.com https://img.clerk.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com; frame-ancestors 'self'; worker-src 'self' blob:;"
          }
        ],
      },
    ]
  },
};

export default nextConfig;
