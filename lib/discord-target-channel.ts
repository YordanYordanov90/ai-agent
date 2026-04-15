/**
 * Chat SDK Discord adapter uses encoded thread IDs:
 * `discord:{guildId}:{parentChannelSnowflake}` or
 * `discord:{guildId}:{parentChannelSnowflake}:{threadSnowflake}`.
 * Discord REST API requires the actual channel / thread snowflake.
 */
export function resolveDiscordApiChannelId(encodedOrSnowflake: string): string {
  const trimmed = encodedOrSnowflake.trim();
  if (!trimmed) {
    throw new Error("Missing thread/channel id");
  }

  // Raw snowflake (DM or legacy callers)
  if (/^\d{5,32}$/.test(trimmed)) {
    return trimmed;
  }

  if (!trimmed.startsWith("discord:")) {
    throw new Error(`Unrecognized Discord thread id format: ${trimmed.slice(0, 80)}`);
  }

  const parts = trimmed.split(":");
  if (parts.length < 3 || parts[0] !== "discord") {
    throw new Error(`Invalid encoded Discord thread id: ${trimmed.slice(0, 80)}`);
  }

  const parentChannelId = parts[2];
  const threadSnowflake = parts[3];
  const target = threadSnowflake || parentChannelId;
  if (!target || !/^\d{5,32}$/.test(target)) {
    throw new Error("Could not resolve Discord API channel id from encoded thread id");
  }

  return target;
}
