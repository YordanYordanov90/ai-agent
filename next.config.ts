import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@chat-adapter/discord", "discord.js", "@discordjs/ws"],
};

export default nextConfig;
