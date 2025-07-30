import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'https://4vzgnuhfk7m5sdhs.public.blob.vercel-storage.com',
        port: '',
      },
    ],
  }
};

export default nextConfig;
