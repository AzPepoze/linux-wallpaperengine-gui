# Contributing to Linux Wallpaper Engine GUI

Thank you for your interest in contributing to this project! We appreciate your help in making this project better.

## How to Contribute

Feel free to contribute to this project by:
- Opening issues to report bugs or suggest features
- Submitting pull requests with improvements or fixes

## Pull Request Guidelines

> [!IMPORTANT]
> Please make sure to select the `dev` branch when submitting pull requests.

## Development

To set up your development environment:

```bash
# Install dependencies
bun install

# Start development server
bun run dev:frontend

# Or run the full app
bun run dev

# Build for all platforms
bun run build:all

# Run checks/linting
bun run check
```

## Branch Structure

- `main` - Stable release branch
- `dev` - Development branch (base for pull requests)

## Code Quality

Please ensure your code passes all checks before submitting:

```bash
bun run check
```

This runs:
- Frontend (Svelte Check & TypeScript)
- Backend (Go Vet, Golangci-lint & Go Test)

Thank you for contributing! 🎉
