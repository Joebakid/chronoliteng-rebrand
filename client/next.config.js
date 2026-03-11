/** @type {import('next').NextConfig} */
const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000"
      }
    ]
  }
};

export default nextConfig;
