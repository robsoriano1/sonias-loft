/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // All photography is local, dropped into /public/images by the owner.
    // No remote patterns on purpose - nothing is fetched from the internet.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
