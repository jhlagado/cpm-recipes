# CP/M Recipes

CP/M Recipes is a small static registry of file-based Triptych workspaces.
Recipes describe files by CP/M name, URL, byte count and SHA-256. The browser
fetches the selected files, verifies them, builds a fresh bootable two-MiB
Triptych disk and opens it as a writable A drive.

The first recipe is an Atom starter containing `ATOM.COM`, `EDIT.COM` and a
standalone `EXAMPLE.ASM`. `EDIT.COM` is retained here as a distribution copy of
the [Edit 0.1.1 release](https://github.com/jhlagado/edit/releases/tag/v0.1.1)
because that release currently publishes its binary through a redirecting
GitHub asset rather than a CORS-enabled Pages file. Its hash is recorded in the
recipe; the copy is not modified.

The site deliberately has no account, server or database. It is published as
static GitHub Pages content. Future work can add provider URLs, Nucleus and
Skate recipes, drive selection, historical read-only collections and optional
image export without changing this first file contract.
