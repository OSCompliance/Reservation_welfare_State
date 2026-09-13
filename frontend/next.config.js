/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // For Cloudflare Pages deployment
  experimental: {
    isrMemoryCacheSize: 0,
  },
}

module.exports = nextConfig
