/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nepthok/types", "@nepthok/utils"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
