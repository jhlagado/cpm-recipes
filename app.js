const TRIPTYCH_URL = "https://jhlagado.github.io/triptych/";
const status = document.querySelector("#status");
const recipes = document.querySelector("#recipes");

function showError(error) {
  status.className = "status error";
  status.textContent = error instanceof Error ? error.message : String(error);
}

function makeLink(recipeUrl, components) {
  const target = new URL(TRIPTYCH_URL);
  target.searchParams.set("workspace", recipeUrl);
  target.searchParams.set("components", components.join(","));
  return target.href;
}

function selectedComponents(card) {
  return [...card.querySelectorAll("input[type=checkbox]:checked")].map(
    (input) => input.value,
  );
}

function renderRecipe(recipe, recipeUrl, sourceUrl) {
  const card = document.createElement("article");
  card.className = "recipe";

  const heading = document.createElement("h2");
  heading.textContent = recipe.name;
  card.append(heading);

  const instruction = document.createElement("p");
  instruction.textContent = recipe.instruction;
  card.append(instruction);

  const components = document.createElement("div");
  components.className = "components";
  for (const component of recipe.components) {
    const label = document.createElement("label");
    label.className = "component";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = component.id;
    input.checked = true;
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = component.name;
    const description = document.createElement("small");
    description.textContent = component.description;
    copy.append(name, description);
    label.append(input, copy);
    components.append(label);
  }
  card.append(components);

  const actions = document.createElement("div");
  actions.className = "actions";
  const launch = document.createElement("a");
  launch.className = "button";
  launch.target = "_blank";
  launch.rel = "noopener";
  launch.textContent = "Open in Triptych";
  const download = document.createElement("a");
  download.className = "button secondary";
  download.textContent = "Download locked recipe";
  download.download = `${recipe.id}.json`;
  if (sourceUrl) {
    const source = document.createElement("a");
    source.className = "button secondary";
    source.href = sourceUrl;
    source.target = "_blank";
    source.rel = "noopener";
    source.textContent = "Source and license";
    actions.append(source);
  }
  const linkOutput = document.createElement("p");
  linkOutput.className = "link-output";
  linkOutput.setAttribute("aria-live", "polite");
  actions.append(launch, download, linkOutput);
  card.append(actions);

  let downloadUrl;
  const update = () => {
    const selected = selectedComponents(card);
    const enabled = selected.length > 0;
    launch.toggleAttribute("aria-disabled", !enabled);
    launch.tabIndex = enabled ? 0 : -1;
    download.toggleAttribute("aria-disabled", !enabled);
    download.tabIndex = enabled ? 0 : -1;
    if (!enabled) {
      launch.removeAttribute("href");
      download.removeAttribute("href");
      linkOutput.textContent = "Select at least one component.";
      return;
    }
    const href = makeLink(recipeUrl, selected);
    launch.href = href;
    linkOutput.textContent = href;
    const locked = {
      ...recipe,
      components: recipe.components.filter((component) =>
        selected.includes(component.id),
      ),
    };
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(
      new Blob([`${JSON.stringify(locked, null, 2)}\n`], {
        type: "application/json",
      }),
    );
    download.href = downloadUrl;
  };
  components.addEventListener("change", update);
  update();
  return card;
}

async function loadJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "omit",
    redirect: "error",
  });
  if (!response.ok || response.redirected)
    throw new Error(`Could not load ${url}.`);
  return response.json();
}

async function start() {
  const registryUrl = new URL("registry.json", document.baseURI);
  const registry = await loadJson(registryUrl.href);
  if (
    registry.schema !== "cpm-recipes-registry-v1" ||
    !Array.isArray(registry.recipes) ||
    registry.recipes.length === 0
  )
    throw new Error("The CP/M recipe registry is invalid.");
  for (const entry of registry.recipes) {
    const recipeUrl = new URL(entry.url, registryUrl).href;
    const recipe = await loadJson(recipeUrl);
    let sourceUrl;
    if (entry.sourceUrl) {
      const parsedSourceUrl = new URL(entry.sourceUrl);
      if (parsedSourceUrl.protocol !== "https:")
        throw new Error(`The ${entry.id} source link must use HTTPS.`);
      sourceUrl = parsedSourceUrl.href;
    }
    recipes.append(renderRecipe(recipe, recipeUrl, sourceUrl));
  }
  status.className = "status";
  status.textContent = "Choose the files to place on the new A drive.";
}

start().catch(showError);
