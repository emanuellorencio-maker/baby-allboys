const fs = require("fs");
const path = require("path");

const input = process.argv[2] || path.join("data", "prode", "planilla_prode_modelo.csv");
const output = process.argv[3] || path.join("data", "prode", "participantes.json");

function parseCsvLine(line) {
  const out = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      out.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }
  out.push(value.trim());
  return out;
}

function toNumber(value) {
  const n = Number(String(value || "").trim());
  return Number.isFinite(n) ? n : null;
}

const raw = fs.readFileSync(input, "utf8").replace(/^\uFEFF/, "").trim();
const [headerLine, ...lines] = raw.split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(headerLine);
const rows = lines.map(line => {
  const values = parseCsvLine(line);
  return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
});

const participantes = new Map();
for (const row of rows) {
  if (!row.id || !row.partido_id) continue;
  if (!participantes.has(row.id)) {
    participantes.set(row.id, {
      id: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      nombre_hijo: row.nombre_hijo,
      categoria: row.categoria,
      tira: row.tira,
      telefono_opcional: row.telefono_opcional || "",
      pronosticos: []
    });
  }
  participantes.get(row.id).pronosticos.push({
    partido_id: row.partido_id,
    goles_local: toNumber(row.goles_local_pronostico),
    goles_visitante: toNumber(row.goles_visitante_pronostico)
  });
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify([...participantes.values()], null, 2) + "\n", "utf8");
console.log(`Participantes generados: ${participantes.size}`);
console.log(`Archivo: ${output}`);
