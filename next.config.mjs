/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment on RDC.ai (Azure Linux)
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // allow larger uploads for admin
    },
  },
};

export default nextConfig;
