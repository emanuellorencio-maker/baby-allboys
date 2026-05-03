const ZONAS = new Set(["c", "i", "mat1", "mat4"]);

function json(res, status, body) {
  res.status(status).json(body);
}

function validarEnv() {
  const requeridas = ["ADMIN_TOKEN", "GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO", "GITHUB_BRANCH"];
  const faltantes = requeridas.filter((key) => !process.env[key]);
  if (faltantes.length) {
    const error = new Error(`Faltan variables de entorno: ${faltantes.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }
}

function validarToken(token) {
  return Boolean(process.env.ADMIN_TOKEN) && String(token || "") === String(process.env.ADMIN_TOKEN);
}

function normalizarData(data) {
  const salida = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  salida.general = salida.general && typeof salida.general === "object" && !Array.isArray(salida.general) ? salida.general : {};
  salida.categorias = salida.categorias && typeof salida.categorias === "object" && !Array.isArray(salida.categorias) ? salida.categorias : {};
  return salida;
}

function normalizarResultado(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const raw = String(valor).trim().toUpperCase().replace(/\./g, "");
  if (/^\d+$/.test(raw) || raw === "GP" || raw === "NP" || raw === "PP") return raw;
  return null;
}

function esParValido(local, visitante) {
  if (local === "" && visitante === "") return true;
  if (local === "" || visitante === "") return esTokenEspecial(local || visitante);
  if (/^\d+$/.test(local) && /^\d+$/.test(visitante)) return true;
  return esTokenEspecial(local) && esTokenEspecial(visitante);
}

function esTokenEspecial(valor) {
  return valor === "GP" || valor === "NP" || valor === "PP";
}

function puntaje(localValor, visitanteValor) {
  const local = normalizarResultado(localValor);
  const visitante = normalizarResultado(visitanteValor);

  if (local === null || visitante === null) return null;
  if (local === "" && visitante === "") return null;
  if (!esParValido(local, visitante)) return null;

  if (/^\d+$/.test(local) && /^\d+$/.test(visitante)) {
    const localNum = Number(local);
    const visitanteNum = Number(visitante);
    if (localNum > visitanteNum) return { local: 3, visitante: 1 };
    if (localNum < visitanteNum) return { local: 1, visitante: 3 };
    return { local: 2, visitante: 2 };
  }

  return {
    local: puntosToken(local),
    visitante: puntosToken(visitante),
  };
}

function puntosToken(valor) {
  if (valor === "GP") return 3;
  if (valor === "NP" || valor === "PP") return 1;
  return 0;
}

function calcularTotales(resultados) {
  const total = { pj_local: 0, pts_local: 0, pj_visitante: 0, pts_visitante: 0 };

  Object.values(resultados || {}).forEach((valor) => {
    const puntos = puntaje(valor && valor.local, valor && valor.visitante);
    if (!puntos) return;

    total.pj_local += 1;
    total.pj_visitante += 1;
    total.pts_local += puntos.local;
    total.pts_visitante += puntos.visitante;
  });

  return total;
}

function validarPartido(partido, fechaId) {
  if (!partido || typeof partido !== "object" || Array.isArray(partido)) {
    throw Object.assign(new Error("El partido enviado no es valido."), { statusCode: 400 });
  }

  const resultados = partido.resultados;
  if (!resultados || typeof resultados !== "object" || Array.isArray(resultados)) {
    throw Object.assign(new Error("No hay resultados cargados."), { statusCode: 400 });
  }

  const resultadosLimpios = {};
  const categoriasCargadas = [];

  Object.entries(resultados).forEach(([categoria, valor]) => {
    const local = normalizarResultado(valor && valor.local);
    const visitante = normalizarResultado(valor && valor.visitante);

    if (local === null || visitante === null || !esParValido(local, visitante)) {
      throw Object.assign(new Error(`Resultado inválido en categoría ${categoria}. Usá números, GP/NP/PP o dejá ambos campos vacíos.`), { statusCode: 400 });
    }

    resultadosLimpios[categoria] = {
      local: local || null,
      visitante: visitante || null,
    };

    if (local || visitante) categoriasCargadas.push(categoria);
  });

  if (!categoriasCargadas.length) {
    throw Object.assign(new Error("Cargá al menos una categoría antes de guardar."), { statusCode: 400 });
  }

  return {
    ...partido,
    ...calcularTotales(resultadosLimpios),
    fecha_id: partido.fecha_id || fechaId,
    resultados: resultadosLimpios,
  };
}

function decodeContent(content) {
  if (!content) return {};
  const limpio = String(content).replace(/\n/g, "");
  return JSON.parse(Buffer.from(limpio, "base64").toString("utf8"));
}

function encodeContent(data) {
  return Buffer.from(`${JSON.stringify(data, null, 2)}\n`, "utf8").toString("base64");
}

async function githubRequest(path, options = {}) {
  const ref = options.method === "GET" ? `?ref=${encodeURIComponent(process.env.GITHUB_BRANCH)}` : "";
  const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}${ref}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "baby-allboys-admin-resultados",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });

  if (res.status === 404 && options.method === "GET") return null;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detalle = body && body.message ? body.message : `HTTP ${res.status}`;
    throw Object.assign(new Error(`GitHub rechazó la operación sobre ${path}: ${detalle}`), { statusCode: res.status });
  }
  return body;
}

async function leerArchivo(path) {
  const archivo = await githubRequest(path, { method: "GET" });
  if (!archivo) return { data: { general: {}, categorias: {} }, sha: null };
  return { data: normalizarData(decodeContent(archivo.content)), sha: archivo.sha };
}

async function guardarArchivo(path, data, sha, message) {
  const body = {
    message,
    content: encodeContent(data),
    branch: process.env.GITHUB_BRANCH,
  };

  if (sha) body.sha = sha;

  return githubRequest(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "Metodo no permitido." });
  }

  try {
    const { token, action, zona, fecha_id: fechaId, partido } = req.body || {};

    if (!validarToken(token)) {
      return json(res, 401, { ok: false, error: "Clave de administrador incorrecta." });
    }

    if (action === "validar") {
      return json(res, 200, { ok: true });
    }

    validarEnv();

    if (!ZONAS.has(zona)) {
      return json(res, 400, { ok: false, error: "Seleccioná una zona válida." });
    }

    if (!fechaId) {
      return json(res, 400, { ok: false, error: "Seleccioná una fecha." });
    }

    const partidoValidado = validarPartido(partido, fechaId);
    const message = `actualiza resultados zona ${zona} fecha ${fechaId}`;
    const principalPath = `data/${zona}/resultados.json`;
    const planoPath = `resultados_${zona}.json`;

    const principal = await leerArchivo(principalPath);
    const dataActualizada = normalizarData(principal.data);
    dataActualizada.general[fechaId] = [partidoValidado];

    const principalGuardado = await guardarArchivo(principalPath, dataActualizada, principal.sha, message);

    const plano = await leerArchivo(planoPath);
    await guardarArchivo(planoPath, dataActualizada, plano.sha, message);

    return json(res, 200, {
      ok: true,
      message: "Resultados guardados correctamente.",
      commit: principalGuardado.commit && principalGuardado.commit.sha,
    });
  } catch (error) {
    console.error("guardar-resultados", error);
    return json(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "No se pudieron guardar los resultados.",
    });
  }
};

module.exports._private = {
  decodeContent,
  encodeContent,
  normalizarData,
  normalizarResultado,
  puntaje,
  calcularTotales,
  validarPartido,
};
