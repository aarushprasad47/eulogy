// Use US bounding box with state filter
const query = `
[out:json][timeout:60];
(
  node["amenity"="funeral_hall"]["addr:state"="CA"];
  way["amenity"="funeral_hall"]["addr:state"="CA"];
  node["shop"="funeral_directors"]["addr:state"="CA"];
  way["shop"="funeral_directors"]["addr:state"="CA"];
);
out center;
`.trim();

async function main() {
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" },
    signal: AbortSignal.timeout(35000),
  });
  const data = await res.json() as { elements: Array<{ tags?: Record<string, string> }> };
  const elements = data.elements || [];
  const withWebsite = elements.filter(e => e.tags?.website || e.tags?.["contact:website"]);
  console.log(`CA: ${elements.length} homes, ${withWebsite.length} with websites`);
  console.log("Sample tags:", JSON.stringify(elements[0]?.tags, null, 2));
}

main().catch(console.error);
