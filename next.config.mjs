/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    // 'domains' is being deprecated in newer Next.js versions in favor of 'remotePatterns'
    // remotePatterns is more secure as it allows specific paths and protocols
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Allows all Supabase project buckets
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com', // Allows Cloudflare R2 storage
      },
      {
        protocol: 'https',
        hostname: 'your-public-r2-domain.com', // ADD YOUR CUSTOM R2 DOMAIN HERE
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn*.gstatic.com', // Wildcard to cover tbn0, tbn1, tbn2, tbn3
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.masshuka.in', // Also allow your own variant images  
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'medias.utsavfashion.com', // Also allow your own variant images   i.pinimg.com
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com', // Also allow your own variant images   i.pinimg.com
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ddb3956a1247026be0c0f8ccc8d223bf.r2.cloudflarestorage.com', // Also allow Google profile images for user accounts
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-e0de9a1218d54806b74c1de9ec3c15d3.r2.dev', // Also allow Google profile images for user accounts
        port: '',
        pathname: '/**',
      },
    ],
  },
    allowedDevOrigins: ['raffle-lavender-refutable.ngrok-free.dev'],

  
};

export default nextConfig;
