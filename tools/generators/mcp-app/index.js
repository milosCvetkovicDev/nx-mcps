"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const devkit_1 = require("@nx/devkit");
const path = __importStar(require("path"));
async function default_1(tree, options) {
    const projectRoot = (0, devkit_1.joinPathFragments)('apps', options.name);
    // Set defaults
    options.description = options.description || 'An MCP server application';
    options.transport = options.transport || 'stdio';
    // Add project configuration
    (0, devkit_1.addProjectConfiguration)(tree, options.name, {
        root: projectRoot,
        sourceRoot: `${projectRoot}/src`,
        projectType: 'application',
        targets: {
            build: {
                executor: '@nx/js:tsc',
                outputs: ['{options.outputPath}'],
                options: {
                    outputPath: `dist/apps/${options.name}`,
                    main: `${projectRoot}/src/main.ts`,
                    tsConfig: `${projectRoot}/tsconfig.app.json`,
                    assets: [`${projectRoot}/*.md`],
                },
                configurations: {
                    production: {
                        optimization: true,
                        extractLicenses: true,
                        inspect: false,
                    },
                },
            },
            serve: {
                executor: '@nx/js:node',
                defaultConfiguration: 'development',
                options: {
                    buildTarget: `${options.name}:build`,
                    runBuildTargetDependencies: false,
                },
                configurations: {
                    development: {
                        buildTarget: `${options.name}:build:development`,
                    },
                    production: {
                        buildTarget: `${options.name}:build:production`,
                    },
                },
            },
            lint: {
                executor: '@nx/eslint:lint',
                outputs: ['{options.outputFile}'],
                options: {
                    lintFilePatterns: [`${projectRoot}/**/*.ts`],
                },
            },
            test: {
                executor: '@nx/vite:test',
                outputs: ['{options.reportsDirectory}'],
                options: {
                    passWithNoTests: true,
                    reportsDirectory: `../../coverage/${projectRoot}`,
                },
            },
        },
        tags: ['mcp-server', 'type:app'],
    });
    // Generate files from templates
    (0, devkit_1.generateFiles)(tree, path.join(__dirname, 'files'), projectRoot, {
        ...options,
        tmpl: '',
    });
    await (0, devkit_1.formatFiles)(tree);
    return () => {
        console.log(`\n✅ MCP server application "${options.name}" created successfully!`);
        console.log(`📁 Location: ${projectRoot}`);
        console.log(`\n🚀 Next steps:`);
        console.log(`   1. nx build ${options.name}`);
        console.log(`   2. nx serve ${options.name}`);
        console.log(`\n📝 To run the built server:`);
        console.log(`   node dist/apps/${options.name}/main.js`);
    };
}
