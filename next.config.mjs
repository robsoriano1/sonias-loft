/* Photos the owner uploads through Owner -> Website live in Supabase Storage,
   not in the repo, so next/image has to be told that host is allowed. The
   hostname is derived from the project URL rather than hard-coded, and the
   path is pinned to the public object route - nothing else on the domain. */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Everything that ships with the site is local, in /public/images.
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
