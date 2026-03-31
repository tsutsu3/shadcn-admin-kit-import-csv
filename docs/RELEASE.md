# Release Guide

This document describes the full release process — from creating a release branch to publishing the package to npm.

## Overview

The release pipeline is fully automated via GitHub Actions. The only manual steps are:

1. Update the version in `package.json`
2. Create a `release-v<version>` branch and open a PR
3. Merge the PR
4. Publish the draft GitHub Release

Everything else (changelog generation, GitHub Release creation, npm publish) is handled automatically.

## Step-by-step

### 1. Bump the version

Edit `package.json` and update the `version` field, or use npm:

```bash
npm version patch   # 0.2.0 → 0.2.1
npm version minor   # 0.2.0 → 0.3.0
npm version major   # 0.2.0 → 1.0.0
```

> `npm version` also commits and tags locally — if you use it, reset the local tag before pushing (`git tag -d v<version>`). The tag is created by GitHub Actions, not locally.

### 2. Create a release branch

The branch name **must** start with `release-v` for the CI workflows to trigger.

```bash
git checkout -b release-v<version>   # e.g. release-v0.3.0
git push origin release-v<version>
```

### 3. Open a Pull Request

Open a PR from `release-v<version>` → `main`.

**`prepare.yml` runs automatically and:**
- Generates / updates `CHANGELOG.md` using [git-cliff](https://git-cliff.org/) based on conventional commits
- Commits the updated changelog back to the branch
- Renames the PR title to `chore(release): prepare for v<version>`

Wait for the workflow to finish, then review the generated `CHANGELOG.md` in the PR.

### 4. Merge the PR

Merge the PR into `main`.

**`release.yml` runs automatically and:**
- Reads the version from `package.json`
- Extracts the latest section from `CHANGELOG.md` as release notes
- Creates a **draft** GitHub Release with tag `v<version>`

### 5. Publish the draft release

Go to [Releases](https://github.com/tsutsu3/shadcn-admin-kit-import-csv/releases) on GitHub, review the draft, and click **Publish release**.

**`publish.yml` runs automatically and:**
- Runs `pnpm typecheck`, `pnpm test`, `pnpm build` on Node.js 20, 22, and 24
- Publishes the package to npm via `npm publish --access public --provenance`

## Workflow summary

```
package.json version bump
        │
        ▼
git checkout -b release-v<version>
git push origin release-v<version>
        │
        ▼
Open PR (release-v<version> → main)
        │
        ▼
[CI: prepare.yml]
  - Generate CHANGELOG.md (git-cliff)
  - Commit changelog to branch
  - Update PR title
        │
        ▼
Merge PR
        │
        ▼
[CI: release.yml]
  - Create draft GitHub Release (tag: v<version>)
        │
        ▼
Publish draft release on GitHub
        │
        ▼
[CI: publish.yml] triggered by tag push
  - typecheck / test / build (Node 20, 22, 24)
  - npm publish --provenance
        │
        ▼
Package live on npm 🎉
```

## Dry-run publish

To verify the publish step without actually pushing to npm, trigger `publish.yml` manually from the [Actions tab](https://github.com/tsutsu3/shadcn-admin-kit-import-csv/actions/workflows/publish.yml) with **dry-run** set to `true`.

## Conventional Commits

Changelog generation relies on [Conventional Commits](https://www.conventionalcommits.org/). Use these prefixes to ensure commits appear in the right section:

| Prefix | Changelog section |
| --- | --- |
| `feat:` | 🚀 Features |
| `fix:` | 🐛 Bug Fixes |
| `refactor:` | 🚜 Refactor |
| `docs:` | 📚 Documentation |
| `perf:` | ⚡ Performance |
| `style:` | 🎨 Styling |
| `test:` | 🧪 Testing |
| `chore:`, `ci:` | ⚙️ Miscellaneous Tasks |

Commits prefixed with `chore(release):` or `chore(deps)` are automatically excluded from the changelog (see `cliff.toml`).
