import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // build de Docker: server mínimo autocontenido, sin copiar node_modules completo
  output: "standalone",
};

export default nextConfig;
