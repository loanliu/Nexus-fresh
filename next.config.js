/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< Updated upstream
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'supabase.co'],
=======
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Output configuration for Netlify
  output: 'export',
  trailingSlash: true,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
>>>>>>> Stashed changes
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig
