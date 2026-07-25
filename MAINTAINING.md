# Fork maintenance

This fork starts from upstream tag `3.1.18`.

## Remotes and branch

- `origin`: `https://github.com/anohaca/Auto_Bangumi.git`
- `upstream`: `https://github.com/EstrellaXD/Auto_Bangumi.git`
- maintenance branch: `maintain/3.1.18`

Fetch upstream changes without mixing them into the maintenance branch:

```bash
git fetch upstream --tags
```

Apply an individual upstream fix with:

```bash
git cherry-pick <commit>
```

## Tests

Backend:

```bash
cd backend/src
mkdir -p config
pytest
```

WebUI:

```bash
cd webui
pnpm install --frozen-lockfile
pnpm test:build
pnpm build
```

## Publish the container

Run the **CI and container** workflow manually to publish:

```text
ghcr.io/anohaca/auto_bangumi:maintain-3.1.18
```

Pushing a tag such as `v3.1.18.1` publishes the corresponding
`ghcr.io/anohaca/auto_bangumi:3.1.18.1` image. The workflow authenticates with
GitHub's built-in `GITHUB_TOKEN`; no personal access token or Docker Hub secret
is required.
