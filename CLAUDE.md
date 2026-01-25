# Merge DNA - Claude Context File

## Project Overview

A privacy-first web application for merging and converting DNA test files from consumer genealogy services (AncestryDNA, MyHeritage, 23andMe, LivingDNA). All processing happens client-side in the browser - genetic data never leaves the user's computer.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: styled-components
- **Testing**: Vitest + Testing Library
- **Internationalization**: i18next
- **Routing**: React Router v7
- **Code Quality**: ESLint, Prettier, Husky (pre-commit hooks)

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── DNAFileUpload.tsx
│   ├── LanguageSwitcher.tsx
│   ├── ProgressBar.tsx
│   ├── Tag.tsx
│   └── Tooltip.tsx
├── pages/              # Page components
│   └── Home.tsx
├── utils/
│   ├── dna/           # Core DNA processing logic
│   │   ├── parsers/   # Format-specific parsers (Ancestry, MyHeritage, 23andMe, LivingDNA)
│   │   ├── formatters/ # Output formatters and log generation
│   │   ├── merger.ts  # Merge algorithm with conflict resolution
│   │   ├── validation.ts # Data validation framework
│   │   ├── format-detector.ts # Auto-detect file formats
│   │   └── types.ts   # TypeScript type definitions
│   ├── dnaParser.ts   # Main parser orchestrator
│   ├── downloadManager.ts
│   └── localStorage.ts
├── i18n/              # Internationalization config
├── styles/            # Global styles and theme
└── test/              # Test configuration
```

## Core Functionality

### Supported DNA File Formats

1. **Ancestry Format** (.txt) - Tab-separated with separate alleles
2. **MyHeritage Format** (.csv) - Comma-separated with combined genotypes
3. **23andMe Format** - Tab-separated with combined genotypes
4. **LivingDNA Format** - Comma-separated variant

### Key Features

- **Single File Mode**: Auto-convert between formats
- **Two File Mode**: Merge with intelligent conflict resolution
- **Conflict Resolution Strategies**:
  - Fill missing values (-- or 00) with real data
  - Prefer specific source for genuine conflicts
- **Comprehensive Logging**: Detailed reports with conflict explanations
- **Client-side Processing**: Privacy-first architecture

## Development Guidelines

### Code Quality Standards

- **TypeScript**: Strict typing required
- **Testing**: Unit tests for parsers, formatters, and core logic
- **Formatting**: Prettier enforced via pre-commit hooks
- **Linting**: ESLint with React and TypeScript rules
- **Pre-commit**: Type checking + linting + formatting

### Key Files to Understand

1. **src/utils/dna/parsers/** - Each parser handles format-specific quirks
2. **src/utils/dna/merger.ts** - Core merge algorithm and conflict resolution
3. **src/utils/dna/validation.ts** - Validates chromosomes, genotypes, positions
4. **src/utils/dna/format-detector.ts** - Auto-detects input file format
5. **src/utils/dna/types.ts** - Central type definitions

### Testing Strategy

- Parser tests: Validate format-specific parsing logic
- Formatter tests: Ensure correct output generation
- Merger tests: Test conflict resolution scenarios
- Validation tests: Edge cases for data integrity

### Important Constraints

1. **No Server Communication**: All processing must remain client-side
2. **Data Validation**: Always validate chromosome values (1-22, X, Y, MT/M)
3. **Genotype Normalization**: Handle format differences (e.g., "AT" vs A,T)
4. **Error Handling**: Graceful degradation with detailed logging
5. **Privacy**: Never suggest features that require server uploads

## Common Tasks

### Adding a New DNA Format

1. Create parser in `src/utils/dna/parsers/<format>.ts`
2. Implement format detection logic in `format-detector.ts`
3. Add formatter in `src/utils/dna/formatters/<format>.ts`
4. Write comprehensive tests
5. Update type definitions if needed
6. Update documentation

### Modifying Merge Logic

- Main algorithm: `src/utils/dna/merger.ts`
- Conflict resolution priorities are order-dependent
- Always maintain detailed logging for transparency

### UI Components

- Use styled-components for styling
- Follow existing component patterns
- Support i18n for all user-facing text
- Keep components small and focused

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build (includes type checking)
npm run typecheck    # Type check without building
npm test             # Run tests in watch mode
npm test:coverage    # Generate coverage report
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

## Key Architectural Decisions

1. **Parser/Formatter Separation**: Clean separation between input parsing and output formatting
2. **Format Detection**: Auto-detect format to reduce user friction
3. **Validation Framework**: Centralized validation for data integrity
4. **Conflict Transparency**: Detailed logging shows all resolution decisions
5. **Type Safety**: Comprehensive TypeScript types prevent runtime errors

## Working with This Codebase

### When Making Changes

- Run `npm run typecheck` before committing
- Tests run automatically with `npm test`
- Pre-commit hooks enforce quality standards
- Check existing tests for examples
- Update tests when changing logic

### Code Organization Philosophy

- Pure functions where possible
- Separate concerns (parsing, validation, merging, formatting)
- Comprehensive error messages for debugging
- Type safety over runtime checks
- Test complex logic thoroughly

### Performance Considerations

- Large files (700k+ SNPs) must process smoothly
- Client-side processing limits on browser memory
- Efficient sorting and deduplication
- Progress feedback for long operations

## Documentation

- README.md: User-facing documentation
- CONTRIBUTING.md: Development guidelines
- Code comments: Explain "why" not "what"
- Type definitions serve as inline documentation

## Notes for Claude

- Prioritize data validation and error handling
- Never compromise on privacy (client-side only)
- Match existing code style and patterns
- Test edge cases with DNA data (missing values, conflicts, invalid chromosomes)
- Consider international users (i18n support required)
- Respect genetic data sensitivity in all suggestions
