export const DISCORD_FALLBACK_APP_URL = "https://discord.com/developers/applications";

export function getDiscordInstallUrl(appId: string): string {
  const id = appId.trim();
  if (!id) return DISCORD_FALLBACK_APP_URL;
  return `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(
    id
  )}&permissions=84992&integration_type=0&scope=bot+applications.commands`;
}

