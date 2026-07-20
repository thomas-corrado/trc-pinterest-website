/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // This tells Next.js to automatically serve AVIF or WebP to browsers that support them
    formats: ["image/avif", "image/webp"],
  },
  remotePatterns: [
    {
      protocol: "https",
      hostname: "*.public.blob.vercel-storage.com",
    },
  ],
};

module.exports = nextConfig;
