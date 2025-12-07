/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import path from "path";
import { readFileSync } from "fs";

// import("./app/env");

const __dirname = path.resolve();
const packageJsonPath = path.join(__dirname, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const sassPaths = [
    path.join(__dirname, "./app/styles"),
]

export const images = {
    domains: ['t1.gstatic.com',
    "picsum.photos",
    "loremflickr.com",
    "s3.eu-north-1.amazonaws.com",
    "localhost"
]}

/** @type {import("next").NextConfig} */
const config = {
    output: "standalone",
    images,
    env: {
        APP_VERSION: packageJson.version,
    },
    sassOptions: {
        includePaths: sassPaths,
    },
    serverExternalPackages: ['pdfkit'],
    // experimental: {
    //     serverActions: true,
    //     serverComponentsExternalPackages: ['@react-pdf/renderer']
    // },
    // webpack: (config, { isServer }) => {
    //     if (isServer) {
    //         config.externals = [...(config.externals || []), {
    //             canvas: 'canvas',
    //             '@react-pdf/renderer': '@react-pdf/renderer'
    //         }];
    //     }
        
    //     return config;
    // }
};

export default config;
