import { Tree, formatFiles, generateFiles, joinPathFragments, addProjectConfiguration } from '@nx/devkit';
import * as path from 'path';

interface MCPAppGeneratorSchema {
  name: string;
  description?: string;
  transport?: 'stdio' | 'http';
}

export default async function (tree: Tree, options: MCPAppGeneratorSchema) {
  const projectRoot = joinPathFragments('apps', options.name);
  
  // Set defaults
  options.description = options.description || 'An MCP server application';
  options.transport = options.transport || 'stdio';
  
  // Add project configuration
  addProjectConfiguration(tree, options.name, {
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
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    projectRoot,
    {
      ...options,
      tmpl: '',
    }
  );

  await formatFiles(tree);
  
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