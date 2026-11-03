/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'p16-sign-sg.tiktokcdn.com' },
      { hostname: 'p77-sign-sg.tiktokcdn.com' },
      { hostname: 'p16-sign.tiktokcdn-us.com' },
    ],
  },
};

module.exports = nextConfig;
