# Contributing to Merge DNA

Thank you for your interest in contributing to Merge DNA! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to maintaining a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## Getting Started

Before you begin:

- Make sure you have [Node.js](https://nodejs.org/) installed (version 18 or higher recommended)
- Have a basic understanding of React, TypeScript, and genetic data formats
- Read the [README.md](README.md) to understand the project's purpose and functionality

## Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/dna-merge.git
   cd dna-merge
   ```

3. **Add the upstream repository** as a remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/dna-merge.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Verify your setup** by running tests:
   ```bash
   npm test
   ```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes** - Fix issues in the code
- **New features** - Add support for new DNA formats, improve conflict resolution, enhance UI/UX
- **Documentation** - Improve README, add code comments, create tutorials
- **Tests** - Add or improve test coverage
- **Code quality** - Refactor code, improve performance, fix TypeScript issues

### Areas Where You Can Help

- **Format Support**: Add parsers for additional DNA file formats (FamilyTreeDNA, Living DNA, etc.)
- **Validation**: Enhance data validation and error handling
- **UI/UX**: Improve the user interface and user experience
- **Performance**: Optimize processing of large DNA files
- **Testing**: Add comprehensive test coverage for edge cases
- **Documentation**: Add examples, tutorials, or improve existing docs
- **Accessibility**: Make the tool more accessible to all users

## Development Workflow

1. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit your changes** using clear commit messages

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** against the main repository

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode and fix all type errors
- Avoid using `any` - use proper types or `unknown`
- Export types and interfaces for reusability

### React

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract complex logic into custom hooks
- Use meaningful component and prop names

### File Organization

- Place React components in `src/components/`
- Place utility functions in `src/utils/`
- Place type definitions in the relevant files or `src/types/`
- Group related files together

### Code Style

- Use consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Follow the existing code style in the project

### Formatting

We use Prettier for code formatting:

```bash
npm run format
```

We use ESLint for code linting:

```bash
npm run lint
```

Please run these commands before committing to ensure code consistency.

## Testing Guidelines

### Writing Tests

- Write tests for all new features and bug fixes
- Place test files next to the code they test with `.test.ts` or `.test.tsx` extension
- Use descriptive test names that explain what is being tested
- Test edge cases and error conditions
- Aim for high code coverage, but focus on meaningful tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```typescript
describe('ComponentName or functionName', () => {
  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });

  it('should handle edge case', () => {
    // Test implementation
  });
});
```

## Commit Message Guidelines

Write clear, descriptive commit messages following this format:

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no functional changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Examples

```
feat: add support for FamilyTreeDNA format

Implement parser for FamilyTreeDNA CSV files with proper validation
and conversion to internal format.

Closes #123
```

```
fix: resolve conflict resolution bug with missing alleles

Previously, the merger would crash when encountering certain patterns
of missing data. Now properly handles all missing value cases.

Fixes #456
```

## Pull Request Process

1. **Update documentation** if you've added or changed functionality

2. **Add or update tests** for your changes

3. **Ensure all tests pass**:
   ```bash
   npm test
   npm run build
   npm run lint
   ```

4. **Write a clear PR description** that includes:
   - What problem does this solve?
   - How does it solve it?
   - What testing did you do?
   - Screenshots (if applicable for UI changes)
   - Any breaking changes or migration notes

5. **Link related issues** using keywords like "Fixes #123" or "Closes #456"

6. **Be responsive** to code review feedback

7. **Keep PRs focused** - one feature or fix per PR when possible

### PR Title Format

Use the same format as commit messages:

```
feat: add support for new DNA format
fix: resolve parsing error with chromosome X
docs: update installation instructions
```

## Reporting Bugs

### Before Submitting a Bug Report

- Check if the bug has already been reported in [Issues](../../issues)
- Try to reproduce the bug with the latest version
- Collect information about your environment

### How to Submit a Bug Report

Open an issue with the following information:

- **Clear title** describing the bug
- **Steps to reproduce** the bug
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Environment information**:
  - Browser and version
  - Operating system
  - File format and sample data (if possible, without personal genetic data)
- **Error messages** or console logs

### Example Bug Report

```markdown
**Title**: Merge fails with MyHeritage files containing MT chromosome

**Description**:
When merging two MyHeritage files that include mitochondrial DNA (MT chromosome), the merge process fails with a validation error.

**Steps to Reproduce**:
1. Load MyHeritage file A with MT chromosome data
2. Load MyHeritage file B with MT chromosome data
3. Click "Merge Files"
4. Error appears: "Invalid chromosome: MT"

**Expected**: MT chromosome should be recognized as valid
**Actual**: Validation error occurs

**Environment**:
- Browser: Chrome 120.0.6099.109
- OS: macOS 14.2
```

## Suggesting Features

### Before Suggesting a Feature

- Check if the feature has already been requested
- Consider if it aligns with the project's goals
- Think about how it would benefit other users

### How to Suggest a Feature

Open an issue with:

- **Clear title** describing the feature
- **Use case** - why is this feature needed?
- **Proposed solution** - how should it work?
- **Alternatives considered** - what other approaches did you think about?
- **Additional context** - mockups, examples, or references

### Example Feature Request

```markdown
**Title**: Add support for Living DNA format

**Use Case**:
Many users have DNA tests from Living DNA and want to merge them with other test results. Currently, only Ancestry and MyHeritage formats are supported.

**Proposed Solution**:
Add a parser for Living DNA CSV format with:
- Auto-detection based on header format
- Validation for Living DNA-specific fields
- Conversion to internal format
- Documentation for the format structure

**Alternatives**:
Users could manually convert their files, but this is error-prone and time-consuming.
```

## Questions?

If you have questions about contributing, feel free to:

- Open an issue with the "question" label
- Check existing documentation and closed issues
- Reach out to the maintainers

## License

By contributing to Merge DNA, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Merge DNA!
