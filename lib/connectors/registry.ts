import type { PlatformConnector } from "@/lib/connectors/types";
import {
  ChatGPTConnector,
  ClaudeConnector,
  IdentityConnector,
  N8nConnector,
  ReplitConnector,
  ServiceNowConnector,
  SlackConnector,
} from "@/lib/connectors/implementations";

const connectors: Record<string, PlatformConnector> = {
  chatgpt: new ChatGPTConnector(),
  claude: new ClaudeConnector(),
  replit: new ReplitConnector(),
  n8n: new N8nConnector(),
  entra: new IdentityConnector(),
  servicenow: new ServiceNowConnector(),
  slack: new SlackConnector(),
};

export function getConnector(slug: string): PlatformConnector {
  const connector = connectors[slug];
  if (!connector) {
    throw new Error(`No connector registered for "${slug}".`);
  }
  return connector;
}

export function listConnectors() {
  return Object.values(connectors).map((connector) => ({
    slug: connector.slug,
    vendor: connector.vendor,
  }));
}

export function registerConnector(connector: PlatformConnector) {
  connectors[connector.slug] = connector;
}
