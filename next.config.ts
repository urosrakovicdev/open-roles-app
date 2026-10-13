// Next.js configuration.
// Docs: https://nextjs.org/docs/app/api-reference/config/next-config-js
//
// `cacheComponents` turns on the Next.js 16 opt-in caching model (`use cache`,
// cacheTag, cacheLife). See docs/03-architecture.md §2.

import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,

  // Self-hosting multiple instances only (not needed on Vercel):
  //   deploymentId: process.env.DEPLOYMENT_VERSION,
  //   cacheHandler: require.resolve("./cache-handler.js"),
  //   cacheMaxMemorySize: 0,
  // Docs: https://nextjs.org/docs/app/guides/self-hosting
}

export default nextConfig
