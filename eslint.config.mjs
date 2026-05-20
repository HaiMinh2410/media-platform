import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/features/analytics",
              from: "./src/features",
              except: ["./analytics"],
              message: "Giao tiep cheo giua cac features phai thong qua public API (@features/feature-name). Khong duoc import truc tiep tu internals cua feature khac."
            },
            {
              target: "./src/features/dashboard",
              from: "./src/features",
              except: ["./dashboard"],
              message: "Giao tiep cheo giua cac features phai thong qua public API (@features/feature-name). Khong duoc import truc tiep tu internals cua feature khac."
            },
            {
              target: "./src/features/inbox",
              from: "./src/features",
              except: ["./inbox"],
              message: "Giao tiep cheo giua cac features phai thong qua public API (@features/feature-name). Khong duoc import truc tiep tu internals cua feature khac."
            },
            {
              target: "./src/features/posts",
              from: "./src/features",
              except: ["./posts"],
              message: "Giao tiep cheo giua cac features phai thong qua public API (@features/feature-name). Khong duoc import truc tiep tu internals cua feature khac."
            },
            {
              target: "./src/features/settings",
              from: "./src/features",
              except: ["./settings"],
              message: "Giao tiep cheo giua cac features phai thong qua public API (@features/feature-name). Khong duoc import truc tiep tu internals cua feature khac."
            },
            {
              target: "./src/features/ai-agent",
              from: "./src/features",
              except: ["./ai-agent"],
              message: "Giao tiep cheo giua cac features phai thong qua public API (@features/feature-name). Khong duoc import truc tiep tu internals cua feature khac."
            },
            {
              target: "./src/features/auth",
              from: "./src/features",
              except: ["./auth"],
              message: "Giao tiep cheo giua cac features phai thong qua public API (@features/feature-name). Khong duoc import truc tiep tu internals cua feature khac."
            }
          ]
        }
      ]
    }
  }
]);

export default eslintConfig;
