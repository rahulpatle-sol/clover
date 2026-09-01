import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  images: {
    domains: ['supabase.co', 'supabase.in'],
  },
}

export default nextConfig
