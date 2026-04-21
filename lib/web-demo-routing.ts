import { createHash } from "node:crypto";
import { sanitizeRoutingLabel } from "./agent-context";

const ROUTING_SALT = process.env.WEB_DEMO_ROUTING_SALT ?? "cody-web-demo-salt-v1";
const MAX_LABEL_LEN = 256;

export function getWebDemoRoutingLabels(clientIp: string): { userId: string; channelId: string } {
  const input = `${ROUTING_SALT}:${clientIp}`;
  const hash = createHash("sha256").update(input, "utf8").digest("hex");
  const userId = `web-user-${hash.slice(0, 16)}`;
  const channelId = `web-channel-${hash.slice(16, 32)}`;
  return {
    userId: sanitizeRoutingLabel(userId, MAX_LABEL_LEN),
    channelId: sanitizeRoutingLabel(channelId, MAX_LABEL_LEN),
  };
}
