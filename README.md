# family-home

Static family website for https://jljcd.com.

Content is authored and maintained in a local directory, then published to this GitHub repository with `publish.bat`.

## Scripts

- `publish.bat` — copies the source site into this repo with `robocopy /MIR`, commits everything, and pushes to GitHub (`origin main`). Use `publish.bat nocopy` to commit and push without copying.
- `init.bat` — one-time setup to initialize the repo and push the first commit.
