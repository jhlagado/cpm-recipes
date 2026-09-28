import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const registryPath = resolve(root, "registry.json");
const registry = JSON.parse(await readFile(registryPath, "utf8"));
assert.equal(registry.schema, "cpm-recipes-registry-v1");
assert.ok(Array.isArray(registry.recipes) && registry.recipes.length > 0);

const idPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const profilePattern = /^triptych-cpu-v0\.1-2m-n(?:0[1-9]|1[0-6])$/;
const fileNamePattern = /^[A-Za-z0-9_$#@?-]{1,8}(?:\.[A-Za-z0-9_$#@?-]{1,3})?$/;
const hashPattern = /^[0-9a-f]{64}$/;
const text = (value, maximum, label) => {
  assert.ok(
    typeof value === "string" &&
      value.length > 0 &&
      value.length <= maximum &&
      value.isWellFormed() &&
      !/[\u0000-\u001f\u007f]/u.test(value) &&
      Buffer.byteLength(value, "utf8") <= maximum,
    `invalid ${label}`,
  );
};
const keys = (value, required, optional = []) => {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value));
  assert.deepEqual(
    Object.keys(value).sort(),
    [...required, ...optional].filter((key) => Object.hasOwn(value, key)).sort(),
    "unsupported or missing descriptor fields",
  );
  for (const key of required) assert.ok(Object.hasOwn(value, key), `missing ${key}`);
};

const ids = new Set();
for (const entry of registry.recipes) {
  keys(entry, ["id", "url"], ["sourceUrl"]);
  assert.ok(typeof entry.id === "string" && idPattern.test(entry.id));
  assert.ok(!ids.has(entry.id), `duplicate recipe id ${entry.id}`);
  ids.add(entry.id);
  const recipePath = resolve(root, entry.url);
  assert.ok(recipePath.startsWith(`${root}/`), "recipe path escapes the site");
  const recipe = JSON.parse(await readFile(recipePath, "utf8"));
  keys(recipe, ["schema", "id", "revision", "name", "instruction", "profile", "components"], ["workDrives"]);
  assert.equal(recipe.schema, "triptych-file-recipe-v1");
  assert.equal(recipe.id, entry.id);
  assert.ok(idPattern.test(recipe.id), "invalid recipe id");
  assert.ok(idPattern.test(recipe.revision), "invalid recipe revision");
  text(recipe.name, 128, "recipe name");
  assert.ok(
    typeof recipe.instruction === "string" &&
      recipe.instruction.length <= 255 &&
      recipe.instruction.isWellFormed(),
    "invalid instruction",
  );
  assert.ok(profilePattern.test(recipe.profile), "unsupported machine profile");
  assert.ok(
    Array.isArray(recipe.components) &&
      recipe.components.length > 0 &&
      recipe.components.length <= 32,
    "invalid components",
  );
  const workDrives = recipe.workDrives ?? ["B"];
  const driveCount = Number(recipe.profile.slice(-2));
  assert.ok(
    Array.isArray(workDrives) &&
      workDrives.length > 0 &&
      workDrives.length <= Math.min(driveCount - 1, 3) &&
      new Set(workDrives).size === workDrives.length &&
      workDrives.every((drive) => typeof drive === "string" && /^[BCD]$/.test(drive)),
    "invalid writable drives",
  );

  const componentIds = new Set();
  let totalFiles = 0;
  let totalBytes = 0;
  const recipeUrl = pathToFileURL(recipePath);
  for (const component of recipe.components) {
    keys(component, ["id", "name", "description", "files"]);
    assert.ok(idPattern.test(component.id), "invalid component id");
    assert.ok(!componentIds.has(component.id), `duplicate component id ${component.id}`);
    componentIds.add(component.id);
    text(component.name, 128, "component name");
    assert.ok(
      typeof component.description === "string" &&
        component.description.length <= 255 &&
        component.description.isWellFormed(),
      "invalid component description",
    );
    assert.ok(
      Array.isArray(component.files) && component.files.length > 0,
      "invalid component files",
    );
    for (const file of component.files) {
      keys(file, ["name", "url", "bytes", "sha256"]);
      assert.match(file.name, fileNamePattern);
      assert.ok(
        typeof file.url === "string" && file.url.length <= 2048,
        `invalid ${file.name} URL`,
      );
      assert.ok(Number.isInteger(file.bytes) && file.bytes > 0 && file.bytes <= 256 * 1024);
      assert.match(file.sha256, hashPattern);
      totalFiles += 1;
      totalBytes += file.bytes;
      assert.ok(totalFiles <= 64, "too many files");
      assert.ok(totalBytes <= 1024 * 1024, "recipe files exceed 1 MiB");
      const url = new URL(file.url, recipeUrl);
      assert.ok(
        url.protocol === "https:" || url.protocol === "file:",
        `${file.name} must resolve to HTTPS`,
      );
      assert.equal(url.username, "", `${file.name} URL has credentials`);
      assert.equal(url.password, "", `${file.name} URL has credentials`);
      assert.equal(url.hash, "", `${file.name} URL has a fragment`);
    }
  }
  for (const component of recipe.components) {
    for (const file of component.files) {
      const url = new URL(file.url, recipeUrl);
      if (url.protocol !== "file:") continue;
      const filePath = fileURLToPath(url);
      assert.ok(filePath.startsWith(`${root}/`), `${file.name} escapes the site`);
      const bytes = await readFile(filePath);
      assert.equal(bytes.length, file.bytes, `${file.name} byte count`);
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        file.sha256,
        `${file.name} SHA-256`,
      );
    }
  }
  if (entry.sourceUrl) {
    const sourceUrl = new URL(entry.sourceUrl);
    assert.equal(sourceUrl.protocol, "https:");
    assert.equal(sourceUrl.username, "");
    assert.equal(sourceUrl.password, "");
    assert.equal(sourceUrl.hash, "");
    if (entry.id === "horton-commander") {
      assert.match(
        sourceUrl.href,
        /^https:\/\/github\.com\/jhlagado\/horton-commander\/tree\/[0-9a-f]{40}$/,
        "Horton source must pin the exact corresponding commit",
      );
    }
  }
  assert.ok(Buffer.byteLength(JSON.stringify(recipe), "utf8") <= 16 * 1024);
  process.stdout.write(`verified ${recipe.id} (${recipe.components.length} components)\n`);
}
