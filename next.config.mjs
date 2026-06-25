/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://makz-api-ayawaha6grc8cnhs.westeurope-01.azurewebsites.net";
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
