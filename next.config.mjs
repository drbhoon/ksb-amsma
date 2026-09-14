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
      bodySizeLimit: '20mb', // must exceed MAX_UPLOAD_BYTES in lib/uploads.ts
    },
  },
};

export default nextConfig;
