import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { API_CATALOG } from "@/lib/docs/catalog";

export default function DocsPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        title="API"
        description="Validated REST endpoints for platforms, events, incidents, webhooks, configuration, and simulation."
      />
      <Card padded={false}>
        <ul>
          {API_CATALOG.map((endpoint) => (
            <li key={`${endpoint.method}-${endpoint.path}`} className="flex flex-col gap-1 border-b border-line px-7 py-5 last:border-0 md:flex-row md:items-baseline md:gap-8 md:px-8">
              <span className="w-16 text-[12px] font-medium text-faint">{endpoint.method}</span>
              <code className="text-[14px] tracking-[-0.01em]">{endpoint.path}</code>
              <span className="text-[14px] text-muted md:ml-auto">{endpoint.summary}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Webhook validation</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
          Inbound webhooks are signed with HMAC-SHA256 using <code>WEBHOOK_SECRET</code>. Send the digest in
          <code> x-ops-signature</code> or <code>x-n8n-signature</code>. Unsigned payloads are accepted when{" "}
          <code>DEMO_MODE</code> is enabled so local testing does not require extra tooling.
        </p>
      </Card>
    </div>
  );
}
