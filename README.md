# Report Table Visualization

**This is not an officially supported Google product.**

### What if I find an error or want to suggest improvements?

We welcome your contributions to this open source visualization with a pull
request. Please reach out to Google Cloud support to report an error or suggest
an improvement. You can also extend this visualization for your own use case.

### Local development

You must have Node v16 and `yarn` installed.

#### Install Dependencies

Call `yarn` to install all dependencies, includes React.

```
yarn
```

#### Build javascript

Run `yarn build` to bundle the javascript. The resulting minified .js bundle
will be in the `dist` directory.

```
yarn build
```

#### Local testing and other commands

Check package.json for additional commands.

#### Commit title format

Commit titles on `master` branch follow [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/#summary) message spec. Your commit title must prefix one of 3 types and an optional `!` with the format `TYPE: commit title goes here`.

- `fix` - a commit of the type fix patches a bug (correlates with PATCH in Semantic Versioning). `fix: Correct number formatting`
- `feat` - a commit of the type feat introduces a new feature (correlates with MINOR in Semantic Versioning). `feat: Add column sorting`
- `chore` - a commit of the type chore does not affect viz functionality (corresponds with no change in Semantic Versioning). `chore: Update build process`
- Append an `!` exclamation point to the type if it is a breaking change. `fix!: ...`

#### Release management

This repo uses GitHub workflows with [release-please](https://github.com/googleapis/release-please) [action](https://github.com/google-github-actions/release-please-action) to create Github releases, determine versioning, and generate changelogs.
