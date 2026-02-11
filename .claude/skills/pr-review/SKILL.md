---
name: pr-review
description: Review code changes on the current branch for quality, bugs, performance, and security
disable-model-invocation: true
argument-hint: "[optional: LINEAR-TICKET-ID]"
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git branch:*), Bash(gh pr:*), Bash(gh api:*), Bash(~/.claude/scripts/fetch-github-pr.sh:*), Bash(~/.claude/scripts/fetch-sentry-data.sh:*), Bash(~/.claude/scripts/fetch-slack-thread.sh:*)
---

# Code Review

You are reviewing code changes on the current branch. Your review must be based on the **current state of the code right now**, not on anything you've seen earlier in this conversation.

## CRITICAL: Always Use Fresh Data

**IGNORE any file contents, diffs, or line numbers you may have seen earlier in this conversation.** They may be stale. You MUST re-fetch everything from scratch using the commands below.

## Step 1: Get the Current Diff and PR Context

Run ALL of these commands to get a fresh view:

```bash
# The authoritative diff -- only review what's in HERE
git diff main...HEAD

# Recent commits on this branch
git log --oneline main..HEAD

# PR description and comments
gh pr view --json number,title,body,comments,reviews,reviewRequests
```

Also fetch PR review comments (inline code comments):

```bash
# Get the PR number
PR_NUMBER=$(gh pr view --json number -q '.number')

# Fetch all review comments (inline comments on specific lines)
gh api repos/{owner}/{repo}/pulls/$PR_NUMBER/comments --jq '.[] | {path: .path, line: .line, body: .body, user: .user.login, created_at: .created_at}'

# Fetch review-level comments (general review comments)
gh api repos/{owner}/{repo}/pulls/$PR_NUMBER/reviews --jq '.[] | {state: .state, body: .body, user: .user.login}'
```

## Step 2: Understand Context from PR Comments

Before reviewing, read through the PR comments and review comments. Note **who** said what (by username).

- **Already-addressed feedback**: If a reviewer pointed out an issue and the author has already fixed it (the fix is visible in the current diff), do NOT re-raise it.
- **Ongoing discussions**: Note any unresolved threads -- your review should take these into account.
- **Previous approvals/requests for changes**: Understand what reviewers have already looked at.

**IMPORTANT**: Your review is YOUR independent review. Do not take credit for or reference other reviewers' findings as if they were yours. If another reviewer already flagged something, you can note "as [reviewer] pointed out" but do not present their feedback as your own prior review. Your verdict should be based solely on your own analysis of the current code.

## Step 3: Get Requirements Context

Check if a Linear ticket ID was provided as an argument ($ARGUMENTS). If not, try to extract it from the branch name (pattern: `{username}/{linear-ticket}-{title}`).

If a Linear ticket is found:
- Use Linear MCP tools (`get_issue`) to get the issue details and comments
- **Check for a parent ticket**: If the issue has a parent issue, fetch the parent too. Our pattern is to have a parent ticket with project-wide requirements and sub-tickets for specific tasks (often one per repo/PR). The parent ticket will contain the full scope of the project, while the sub-ticket scopes what this specific PR should cover. Use both to assess completeness — the PR should fulfill the sub-ticket's scope, and that scope should be a reasonable subset of the parent's backend-related requirements.
- Look for Sentry links in the description/comments; if found, use Sentry MCP tools to get error details
- Assess whether the changes fulfill the ticket requirements

If no ticket is found, check the PR description for context on what the changes are meant to accomplish.

## Step 4: Review the Code

Review ONLY the changed lines (from `git diff main...HEAD`). Do not comment on unchanged code.

**When referencing code, always use the file path and quote the actual code snippet** rather than citing line numbers, since line numbers shift as the branch evolves.

### Code Quality
- Is the code well-structured and maintainable?
- Does it follow CLAUDE.md conventions? (import grouping, error handling with lib/errors, naming, alphabetization, etc.)
- Any AI-generated slop? (excessive comments, unnecessary abstractions, over-engineering)

### Performance
- N+1 queries, inefficient loops, missing indexes for new queries
- Unbuffered writes in hot paths (especially ClickHouse)
- Missing LIMIT clauses on potentially large result sets

### Bugs
- Nil pointer risks (especially on struct pointer params and optional relations)
- Functions returning `nil, nil` (violates convention)
- Missing error handling
- Race conditions in concurrent code paths

### Security
- Hardcoded secrets or sensitive data exposure
- Missing input validation on service request structs

### Tests
- Are there tests for the new/changed code?
- Do the tests cover edge cases and error paths?
- Are test assertions specific (not just "no error")?

## Step 5: Present the Review

Structure your review as:

```
## Summary
[1-2 sentences: what this PR does and overall assessment]

## Requirements Check
[Does the PR fulfill the Linear ticket / PR description requirements? Any gaps?]

## Issues
### Critical (must fix before merge)
- [blocking issues]

### Suggestions (nice to have)
- [non-blocking improvements]

## Prior Review Activity
[Summarize what other reviewers have flagged, attributed by name. Note which of their concerns have been addressed in the current code and which remain open.]

## Verdict
[LGTM / Needs changes / Needs discussion -- based on YOUR analysis, not other reviewers' findings]
```

## Guidelines

- Be concise. Don't pad with praise or filler.
- Only raise issues that matter. Don't nitpick formatting (that's what linters are for).
- Quote code snippets rather than referencing line numbers.
- If PR comments show a discussion was already resolved, don't reopen it.
- If you're unsure about something, flag it as a question rather than a definitive issue.
