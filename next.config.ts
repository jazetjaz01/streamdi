import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // ✅ avatars Google OAuth
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // ✅ avatars GitHub OAuth
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com", // ✅ avatars Discord (optionnel)
      },
      {
        protocol: "https",
        hostname: "hqbwruoqgtvxxxqiihog.supabase.co", // ✅ ton bucket Supabase
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com", // ✅ ajoute ce domaine pour corriger ton erreur
      },
    ],
  },
};

export default nextConfig;
