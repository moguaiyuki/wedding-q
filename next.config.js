/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.disney.com',
      },
      {
        protocol: 'https',
        hostname: '**.wdprapps.disney.com',
      },
    ],
  },
}

module.exports = nextConfig