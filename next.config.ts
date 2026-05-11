import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdf-parse and its native dependencies (pdfjs-dist, @napi-rs/canvas)
  // as true Node.js externals so they are NOT bundled by Turbopack/Webpack.
  // This ensures native binaries are resolved at runtime from node_modules,
  // and that Next.js file-tracing includes them in the Vercel deployment.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
