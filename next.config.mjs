/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5090",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "khaledsabry-backend.onrender.com",
        pathname: "/**"
      }
    ]
  }
};

export default nextConfig;
