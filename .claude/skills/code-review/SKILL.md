# Code Review Skill

## Purpose

Review code like a senior software engineer.

## Review Checklist

### 1. Bugs
- Find logic errors.
- Find runtime errors.
- Find edge cases.

### 2. Security
- SQL Injection
- XSS
- CSRF
- Authentication issues
- Authorization issues
- Sensitive data exposure

### 3. Performance
- Unnecessary loops
- Expensive database queries
- Memory leaks
- Duplicate work

### 4. Clean Code
- Meaningful variable names
- Small functions
- Remove duplicate code
- Improve readability

### 5. Best Practices
- Follow language conventions.
- Follow framework conventions.
- Recommend modern APIs.

### 6. Maintainability
- Reduce complexity.
- Improve modularity.
- Suggest refactoring.

## Output Format

For every issue provide:

Severity:
- Critical
- High
- Medium
- Low

Explain:
- What is wrong.
- Why it is a problem.
- How to fix it.

Show corrected code whenever possible.

Finish with:

- Overall Score (/10)
- Security Score
- Performance Score
- Readability Score
- Production Ready: Yes/No