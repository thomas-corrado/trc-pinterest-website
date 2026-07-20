/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // This tells Next.js to automatically serve AVIF or WebP to browsers that support them
    formats: ["image/avif", "image/webp"],

    // MOVED HERE: Now Next.js knows these remote patterns belong to the image optimizer
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
