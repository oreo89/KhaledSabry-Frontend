/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://khaledsabry-backend-6lda.onrender.com";
const apiHostname = new URL(apiBaseUrl).hostname;

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
        hostname: apiHostname,
        pathname: "/**"
      }
    ]
  }
};

export default nextConfig;
