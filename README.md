# CP/M Recipes

CP/M Recipes is a small static registry of file-based Triptych workspaces.
Recipes describe files by CP/M name, URL, byte count and SHA-256. The browser
fetches the selected files, verifies them, builds a fresh bootable two-MiB
Triptych disk and opens it as a writable A drive.

The Atom CP/M workshop puts Atom 0.3.5, Edit 0.2.0, and an editable demo on a
fresh writable A: drive. Run `ATOMDEMO.COM` to see a short CP/M console demo;
edit `ATOMDEMO.ASM` and assemble it again with Atom. The recipe records the
size and SHA-256 of every file before Triptych accepts it.

The Horton Commander preview recipe targets Triptych's four-drive profile. It
places `HC.COM` on A and gives the program writable B, C and D work disks. The
current HC build statically includes Edit's GPL-3.0-or-later editing core; the
combined executable and corresponding source are distributed under
GPL-3.0-or-later. The recipe card links to the exact source revision and its
license.

The site is static GitHub Pages content. It has no account or server-side
state; Triptych verifies each selected file before creating the disk.
