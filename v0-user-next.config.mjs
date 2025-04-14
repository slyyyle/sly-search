/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Only set up rewrites if the backend URL is defined
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
        },
      ];
    }
    
    // Return empty array if no backend URL is defined
    return [];
  },
};

export default nextConfig;
