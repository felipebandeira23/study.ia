import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdfjs-dist as a true Node.js external so it is NOT bundled by
  // Turbopack/Webpack and Next.js file-tracing includes it (with its worker
  // file) in the Vercel deployment.  pdf-parse is listed so its own
  // transitively-required files are also traced.
  serverExternalPackages: ["pdfjs-dist", "pdf-parse"],
};

export default nextConfig;
