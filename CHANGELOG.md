# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation restructure with organized folders
- Quick Start Tutorial for building first MCP server in 10 minutes
- Core Concepts guide explaining MCP fundamentals
- Deployment Guide covering multiple deployment strategies
- Architecture documentation section with ADR support
- Troubleshooting section for common issues
- Contributing guidelines and PR best practices

### Changed
- Reorganized documentation into topic-based folders
- Improved naming conventions (lowercase with hyphens)
- Enhanced README.md with better navigation and quick links
- Updated build scripts for better production optimization

### Fixed
- Documentation inconsistencies across different servers
- Missing cross-references between related topics

## [0.2.0] - 2024-01-15

### Added
- Petstore API server with comprehensive OpenAPI integration
- Advanced middleware support for request/response processing
- Streaming response capabilities for large datasets
- Custom transport layer abstractions
- Performance monitoring and metrics collection
- Generator for creating new MCP servers (`npm run mcp:new`)

### Changed
- Upgraded to latest MCP SDK version
- Improved TypeScript configuration for better type safety
- Enhanced error handling across all servers

### Fixed
- Memory leak in long-running server processes
- Connection timeout issues with stdio transport

## [0.1.0] - 2023-12-01

### Added
- Initial Nx workspace setup for MCP development
- Basic MCP server template with TypeScript support
- stdio and HTTP transport implementations
- Example tools, resources, and prompts
- Jest testing configuration
- ESLint and Prettier setup
- Basic documentation structure

### Security
- Input validation for all tool parameters
- Sandboxed file system operations
- API key authentication support

## [0.0.1] - 2023-11-15

### Added
- Project initialization
- Basic workspace structure
- Initial README and LICENSE

---

## Version Guidelines

### Major Version (X.0.0)
- Breaking changes to MCP server APIs
- Incompatible transport protocol changes
- Major architectural restructuring
- Removal of deprecated features

### Minor Version (0.X.0)
- New features and capabilities
- New MCP servers added
- Backward-compatible API additions
- Performance improvements

### Patch Version (0.0.X)
- Bug fixes
- Documentation updates
- Security patches
- Minor performance improvements

## Upgrade Guide

### From 0.1.x to 0.2.x

1. **Update dependencies:**
   ```bash
   npm update @modelcontextprotocol/sdk
   ```

2. **Update server implementations:**
   - Replace deprecated `server.handle()` with `server.setRequestHandler()`
   - Update tool schemas to use new validation format

3. **Test thoroughly:**
   ```bash
   nx test --all
   ```

### From 0.0.x to 0.1.x

1. **Migrate to Nx workspace structure**
2. **Update import paths to use workspace aliases**
3. **Convert JavaScript files to TypeScript**

[Unreleased]: https://github.com/your-org/mcp-workspace/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-org/mcp-workspace/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-org/mcp-workspace/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/your-org/mcp-workspace/releases/tag/v0.0.1 