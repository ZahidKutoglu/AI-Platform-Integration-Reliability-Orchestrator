import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "/*": ["./prisma/dev.db", "./lib/demo.db"],
    "/api/*": ["./prisma/dev.db", "./lib/demo.db"],
    "/api/**/*": ["./prisma/dev.db", "./lib/demo.db"],
    "/**": ["./prisma/dev.db", "./lib/demo.db"],
  },
  agentRules: false,
};

export default nextConfig;
