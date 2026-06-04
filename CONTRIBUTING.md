# Contributing to Linux Wallpaper Engine GUI

Thank you for your interest in contributing to this project! We appreciate your help in making this project better.

## Table of Contents
- [How to Contribute](#how-to-contribute)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development](#development)
- [Internationalization (i18n)](#internationalization-i18n)
- [Branch Structure](#branch-structure)
- [Code Quality](#code-quality)

## How to Contribute

Feel free to contribute to this project by:
- Opening issues to report bugs or suggest features
- Submitting pull requests with improvements or fixes

## Pull Request Guidelines

> [!IMPORTANT]
> Please make sure to select the `dev` branch when submitting pull requests.

## Development

To set up your development environment:

| Command | Description |
| :--- | :--- |
| `bun install` | Install dependencies |
| `bun run dev:frontend` | Start development server |
| `bun run dev` | Run the full app |
| `bun run build:all` | Build for all platforms |
| `bun run check` | Run checks/linting |

## Internationalization (i18n)

This project uses a dynamically loaded, namespace-based translation system. English (`en`) is the source of truth for all localization.

### How to add or edit translations
1. **Always edit English first**: Add or modify keys in `src/frontend/svelte/i18n/locales/en/`.
2. **Sync structure**: Run `bun run check` (or specifically `bun run i18n:generate`). 
   - This automatically copies missing files and keys into other languages (like `zh`).
   - Missing translations are prepended with `[NYT_LANG]` (Not Yet Translated) so translators can easily spot them. 
   - *Note: These prefixes are automatically stripped when the app runs, so users only see the clean English fallback text.*
3. **Translate**: Open the other language files and translate the strings that have the `[NYT_LANG]` prefix, removing the prefix once done.
4. **Verify**: Use `bun run check:frontend` (or `bun run i18n:check`) to see a report of any missing keys.

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
