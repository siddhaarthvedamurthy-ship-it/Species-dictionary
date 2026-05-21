const grid = document.getElementById("speciesGrid");
const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMore");

let speciesData = [];
let offset = 0;
let activeCategory = "All";

const LIMIT = 50;

// Fetch from GBIF
async function fetchSpecies() {
  const url = `https://api.gbif.org/v1/species/search?limit=${LIMIT}&offset=${offset}`;
  const res = await fetch(url);
  const data = await res.json();

  const enriched = await Promise.all(
    data.results.map(async (sp) => {
      const wiki = await fetchWiki(sp.canonicalName);
      return {
        name: sp.canonicalName || "Unknown",
        scientific: sp.scientificName || "Unknown",
        kingdom: sp.kingdom || "Unknown",
        description: wiki,
      };
    })
  );

  speciesData = [...speciesData, ...enriched];
  render(speciesData);
  offset += LIMIT;
}

// Wikipedia fetch
async function fetchWiki(name) {
  if (!name) return "No data";

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    );
    const data = await res.json();
    return data.extract || "No description available";
  } catch {
    return "No description available";
  }
}

// Render
function render(data) {
  grid.innerHTML = "";

  data.forEach(sp => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${sp.name}</h3>
      <p><em>${sp.scientific}</em></p>
      <p>${sp.kingdom}</p>
    `;

    card.onclick = () => openModal(sp);

    grid.appendChild(card);
  });
}

// Search
searchInput.addEventListener("input", () => {
  const val = searchInput.value.toLowerCase();
  const filtered = speciesData.filter(sp =>
    sp.name.toLowerCase().includes(val) ||
    sp.scientific.toLowerCase().includes(val)
  );
  render(filtered);
});

// Modal
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");

function openModal(sp) {
  modalBody.innerHTML = `
    <h2>${sp.name}</h2>
    <p><strong>Scientific:</strong> ${sp.scientific}</p>
    <p><strong>Kingdom:</strong> ${sp.kingdom}</p>
    <p>${sp.description}</p>
  `;
  modal.classList.remove("hidden");
}

document.getElementById("closeModal").onclick = () =>
  modal.classList.add("hidden");

window.onclick = e => {
  if (e.target === modal) modal.classList.add("hidden");
};

// Load more
loadMoreBtn.onclick = fetchSpecies;

// Initial load
fetchSpecies();
