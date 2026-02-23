# Deployment Workflow (Safe Changes Before Public Release)

This guide keeps public users on stable code while you test changes privately.

## Branch Strategy

- `main` = public production code (live users)
- `develop` = staging code (private testing)
- `feature/<name>` = new work branches

Example feature branch names:

- `feature/terms-audit-log`
- `feature/admin-copy-update`
- `feature/stocks-insights-ui`

## Daily Workflow

1. Start from latest `develop`:

```bash
git checkout develop
git pull origin develop
```

2. Create a feature branch:

```bash
git checkout -b feature/my-change
```

3. Build/test locally in Codespaces:

```bash
npm install
npm start
```

4. Push feature branch and open PR into `develop`:

```bash
git push -u origin feature/my-change
```

5. Review on staging/preview URL, then merge into `develop`.

6. When ready for public release, open PR: `develop` -> `main`.

7. Merge into `main` only when you are ready to publish.

## Environment Setup

Use separate environments:

- **Production**: connected to `main`
- **Staging**: connected to `develop`
- **Preview**: auto-created from PR/feature branch (if your host supports it)

Recommended host behavior:

- `main` auto-deploys to your public domain
- `develop` auto-deploys to a private staging URL
- PR branches get temporary preview links

## Protecting Public Users

- Do not push experimental changes directly to `main`
- Require pull requests for `main`
- Enable branch protection on `main`:
  - Require PR before merge
  - Require checks to pass
  - Restrict who can push

## Database Safety

Use separate databases:

- Production DB for `main`
- Staging DB for `develop`/preview

Never test destructive schema or data operations on production DB first.

## Optional: Feature Flags

For hidden changes that are merged but not yet visible:

- Add a flag (env var) like `FEATURE_NEW_TERMS_FLOW=false`
- Deploy code with flag OFF
- Turn ON when ready

## Release Checklist (Before Merging to main)

- [ ] Tested end-to-end on staging
- [ ] Verified login, terms flow, and admin pages
- [ ] Confirmed legal copy/content updates
- [ ] Confirmed no debug/test copy remains
- [ ] Confirmed DB changes are production-safe
- [ ] PR approved and checks passing

## Rollback Plan

If a live issue happens:

1. Revert the merge commit on `main`
2. Redeploy production
3. Hotfix on a new branch and retest in staging

---

If you want, this can be extended into a GitHub Actions pipeline with automatic checks and deploy gates.