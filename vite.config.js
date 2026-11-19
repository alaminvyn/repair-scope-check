import { defineConfig } from "vite";

export default defineConfig({
  plugins: [{
    name: "production-content-security-policy",
    apply: "build",
    transformIndexHtml() {
      return [{
        tag: "meta",
        attrs: {
          "http-equiv": "Content-Security-Policy",
          content: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src https://rpc-bradbury.genlayer.com; base-uri 'none'; object-src 'none'; form-action 'none'",
        },
        injectTo: "head-prepend",
      }];
    },
  }],
});
