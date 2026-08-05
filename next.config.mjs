/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['tesseract.js'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/tesseract.js/**/*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

export default nextConfig
