# Pull Request

## Description

Brief description of changes (1-3 sentences).

## Related Issue

Closes #(issue number)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test improvements

## Changes Made

List specific changes:

- Change 1
- Change 2
- Change 3

## Testing

### Test Coverage

- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Coverage meets minimum threshold (≥85%)

### Manual Testing

Describe how you tested your changes:

```bash
# Commands run for testing
tddai init
tddai generate src/example.ts
```

**Test Results**:
- [ ] All tests passing locally
- [ ] No new warnings or errors

## Documentation

- [ ] Updated relevant documentation (docs/)
- [ ] Updated CHANGELOG.md
- [ ] Added/updated code comments
- [ ] Updated README if needed

## Code Quality

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] ESLint passing (`pnpm lint`)
- [ ] Prettier formatting applied (`pnpm format`)
- [ ] TypeScript compiles without errors (`pnpm build`)

## Breaking Changes

If this PR includes breaking changes, describe:

### What breaks?

(Describe what existing functionality changes)

### Migration guide

(How should users update their code?)

### Deprecation plan

(If applicable, what's the timeline for deprecating old behavior?)

## Screenshots (if applicable)

For UI or CLI output changes, add screenshots or terminal output:

```
Before:
...

After:
...
```

## Performance Impact

- [ ] No performance impact
- [ ] Performance improvement (describe)
- [ ] Potential performance regression (justify)

## Additional Notes

Any other information reviewers should know:

---

## Checklist

Before submitting this PR, verify:

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
- [ ] I have checked my code and corrected any misspellings

## Reviewer Notes

(Space for reviewers to add comments during review)
