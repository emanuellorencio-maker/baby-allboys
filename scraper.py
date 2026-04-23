import json
import os
import random
import re
import time
from typing import Dict, List, Optional, Tuple

try:
    import cloudscraper  # type: ignore
except Exception:
    cloudscraper = None

import requests
from bs4 import BeautifulSoup

ZONAS = {
    "c": {
        "url": "https://fefi.com.ar/2026-torneo-anual-baby-futbol/c/",
        "equipo": 'ALL BOYS "A"',
        "categorias_resultados": ["2019", "2013", "2018", "2014", "2017", "2016", "2015"],
        "categorias_tablas": ["2019", "2013", "2018", "2014", "2017", "2016", "2015"],
    },
    "i": {
        "url": "https://fefi.com.ar/2026-torneo-anual-baby-futbol/i/",
        "equipo": 'ALL BOYS "B"',
        "categorias_resultados": ["2019", "2013", "2018", "2014", "2017", "2016", "2015"],
        "categorias_tablas": ["2019", "2013", "2018", "2014", "2017", "2016", "2015"],
    },
    "mat1": {
        "url": "https://fefi.com.ar/2026-torneo-anual-baby-futbol/mat-1/",
        "equipo": "LOS ALBOS",
        "categorias_resultados": ["2013", "2014/15", "2016/17", "2018/19", "2020/21/22"],
        "categorias_tablas": ["2013", "2014/15", "2016/17", "2018/19", "2020/21/22"],
    },
    "mat4": {
        "url": "https://fefi.com.ar/2026-torneo-anual-baby-futbol/mat-4/",
        "equipo": "ALL BOYS",
        "categorias_resultados": ["2013", "2014", "2015", "2016", "2017", "2018/19/20"],
        "categorias_tablas": ["2013", "2014", "2015", "2016", "2017", "2018/19/20"],
    },
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
]

TOKENS_RESULTADO = {"GP", "NP"}


def limpiar_linea(valor: str) -> str:
    return " ".join(str(valor).replace("\xa0", " ").strip().split())


def normalizar_equipo(texto: str) -> str:
    texto = limpiar_linea(texto)
    texto = texto.replace("“", '"').replace("”", '"').replace("''", '"')
    texto = re.sub(r"\s*\.\s*$", ".", texto) if texto.endswith(" .") else texto
    return texto.rstrip("-–:").strip()


def clave(texto: str) -> str:
    texto = normalizar_equipo(texto).upper()
    texto = texto.replace('"', "").replace("'", "")
    texto = texto.replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U")
    return re.sub(r"[^A-Z0-9Ñ]", "", texto)


def normalizar_categoria(texto: str) -> str:
    texto = limpiar_linea(texto)
    reemplazos = {
        "19": "2019", "13": "2013", "18": "2018", "14": "2014", "17": "2017", "16": "2016", "15": "2015",
        "2014 / 15": "2014/15", "2016 / 17": "2016/17", "2018 / 19": "2018/19",
        "2020 / 21 / 22": "2020/21/22", "2018 / 19 / 20": "2018/19/20",
    }
    return reemplazos.get(texto, texto)


def crear_scraper():
    if cloudscraper is not None:
        scraper = cloudscraper.create_scraper()
        scraper.headers.update({"User-Agent": random.choice(USER_AGENTS)})
        return scraper
    session = requests.Session()
    session.headers.update({"User-Agent": random.choice(USER_AGENTS)})
    return session


def obtener_html(url: str, reintentos: int = 4, pausa: int = 4) -> str:
    ultimo_error = None
    for intento in range(1, reintentos + 1):
        try:
            print(f"Descargando {url} (intento {intento}/{reintentos})")
            scraper = crear_scraper()
            time.sleep(random.uniform(0.8, 1.8))
            respuesta = scraper.get(url, timeout=60)
            respuesta.raise_for_status()
            return respuesta.text
        except Exception as error:
            ultimo_error = error
            print(f"Error descargando {url}: {error}")
            if intento < reintentos:
                time.sleep(pausa)
    raise ultimo_error


def obtener_lineas_desde_html(html: str) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    texto = soup.get_text("\n")
    lineas = [limpiar_linea(linea) for linea in texto.splitlines() if limpiar_linea(linea)]

    # FEFI a veces pega el equipo con los números: ALL BOYS "A"0 0.
    # No lo rompemos acá; lo resolvemos al parsear por nombres de equipos.
    return lineas


def buscar_indice(lineas: List[str], predicado) -> int:
    for i, linea in enumerate(lineas):
        if predicado(linea):
            return i
    return -1


def partir_cruce(linea: str) -> Optional[Tuple[str, str]]:
    texto = normalizar_equipo(linea)
    partes = re.split(r"\s*vs\s*", texto, maxsplit=1, flags=re.IGNORECASE)
    if len(partes) != 2:
        return None
    local = normalizar_equipo(partes[0])
    visitante = normalizar_equipo(partes[1])
    if not local or not visitante:
        return None
    return local, visitante


def sacar_fixture(lineas: List[str], nombre_equipo: str) -> List[Dict]:
    inicio = buscar_indice(lineas, lambda l: limpiar_linea(l).upper() == "LOCAL VISITANTE")
    if inicio == -1:
        # fallback por si WordPress lo pega con texto de arriba
        inicio = buscar_indice(lineas, lambda l: "LOCAL" in l.upper() and "VISITANTE" in l.upper())
    if inicio == -1:
        return []

    equipo_buscado = clave(nombre_equipo)
    fecha_actual = ""
    partidos: List[Dict] = []

    for linea in lineas[inicio + 1:]:
        texto = limpiar_linea(linea)
        upper = texto.upper()

        if upper.startswith("NO SE HA ENCONTRADO CONTENIDO") or upper.startswith("NOMBRE DEL EQUIPO"):
            break

        if re.match(r"^Fecha\s+\d+", texto, flags=re.I):
            fecha_actual = texto
            continue

        cruce = partir_cruce(texto)
        if not cruce:
            continue

        local, visitante = cruce
        if equipo_buscado in clave(local) or equipo_buscado in clave(visitante):
            condicion = "Local" if equipo_buscado in clave(local) else "Visitante"
            match_fecha = re.search(r"Fecha\s+(\d+)", fecha_actual, re.I)
            fecha_id = f"F{match_fecha.group(1)}" if match_fecha else ""
            partidos.append({
                "fecha": fecha_actual,
                "fecha_id": fecha_id,
                "local": local,
                "visitante": visitante,
                "condicion": condicion,
            })

    vistos = set()
    unicos = []
    for partido in partidos:
        clave_partido = (partido["fecha_id"], partido["local"], partido["visitante"])
        if clave_partido not in vistos:
            vistos.add(clave_partido)
            unicos.append(partido)
    return unicos


def construir_diccionario_fechas(fixture: List[Dict]) -> Dict[str, Dict]:
    return {item.get("fecha_id", ""): item for item in fixture if item.get("fecha_id")}


def extraer_equipos_fixture(lineas: List[str]) -> List[str]:
    equipos = []
    for linea in lineas:
        cruce = partir_cruce(linea)
        if cruce:
            equipos.extend(cruce)
    return sorted({normalizar_equipo(e) for e in equipos if e}, key=len, reverse=True)


def encontrar_equipo_en_inicio(texto: str, equipos_ordenados: List[str]) -> Tuple[Optional[str], str]:
    texto_limpio = normalizar_equipo(texto)
    texto_clave = clave(texto_limpio)

    for equipo in equipos_ordenados:
        equipo_norm = normalizar_equipo(equipo)
        eq_clave = clave(equipo_norm)
        if texto_clave.startswith(eq_clave):
            # Preferimos corte por longitud visible cuando es posible.
            if texto_limpio.upper().startswith(equipo_norm.upper()):
                resto = texto_limpio[len(equipo_norm):].strip()
            else:
                # fallback: quitar nombre normalizado sin símbolos.
                resto = re.sub(r"^" + re.escape(equipo_norm), "", texto_limpio, flags=re.I).strip()
                if resto == texto_limpio:
                    # último recurso: buscar primer número/token resultado desde el final del nombre
                    m = re.search(r"(?:GP|NP|\d+)\b", texto_limpio, flags=re.I)
                    resto = texto_limpio[m.start():].strip() if m else ""
            return equipo_norm, resto
    return None, texto_limpio


def es_token_resultado(token: str) -> bool:
    token = token.strip().upper()
    return token in TOKENS_RESULTADO or token.isdigit()


def valor_resultado(token: str):
    token = token.strip()
    return token if token else None


def parsear_fila_resultados(linea: str, equipos_ordenados: List[str], cantidad_categorias: int) -> Optional[Dict]:
    texto = normalizar_equipo(linea)
    fecha_id = None

    match_fecha = re.match(r"^(F\d+)\s*(.*)$", texto, flags=re.I)
    if match_fecha:
        fecha_id = match_fecha.group(1).upper()
        texto = limpiar_linea(match_fecha.group(2))

    texto = re.sub(r"\s+(Previo|Verificado)$", "", texto, flags=re.I).strip()
    equipo, resto = encontrar_equipo_en_inicio(texto, equipos_ordenados)
    if not equipo:
        return None

    # Si quedó pegado: '0 0' o 'NP 4 2 6 2 1 6 12'
    tokens = re.findall(r"GP|NP|\d+", resto, flags=re.I)
    tokens = [t.upper() if t.upper() in TOKENS_RESULTADO else t for t in tokens]

    pj = None
    pts = None
    valores_categoria = [None] * cantidad_categorias

    if len(tokens) >= cantidad_categorias + 2:
        posibles_cat = tokens[:cantidad_categorias]
        posibles_pj_pts = tokens[cantidad_categorias:cantidad_categorias + 2]
        if all(es_token_resultado(t) for t in posibles_cat) and all(t.isdigit() for t in posibles_pj_pts):
            valores_categoria = [valor_resultado(t) for t in posibles_cat]
            pj = int(posibles_pj_pts[0])
            pts = int(posibles_pj_pts[1])
    elif len(tokens) >= 2 and tokens[0].isdigit() and tokens[1].isdigit():
        pj = int(tokens[0])
        pts = int(tokens[1])

    return {"fecha_id": fecha_id, "equipo": equipo, "pj": pj, "pts": pts, "categorias": valores_categoria}


def sacar_resultados(lineas: List[str], fixture: List[Dict], nombre_equipo: str, categorias: List[str]) -> Dict:
    equipos_ordenados = extraer_equipos_fixture(lineas)
    if nombre_equipo not in equipos_ordenados:
        equipos_ordenados.append(nombre_equipo)
    equipos_ordenados = sorted({normalizar_equipo(e) for e in equipos_ordenados if e}, key=len, reverse=True)

    fechas_fixture = construir_diccionario_fechas(fixture)
    inicio = buscar_indice(lineas, lambda l: limpiar_linea(l).upper().startswith("F.T.EQUIPOS"))
    fin = buscar_indice(lineas[inicio + 1:] if inicio != -1 else [], lambda l: limpiar_linea(l).upper().startswith("EQUIPOS PJ"))
    if inicio == -1:
        return {"general": {}}
    fin_abs = inicio + 1 + fin if fin != -1 else len(lineas)
    bloque = lineas[inicio + 1:fin_abs]

    general: Dict[str, List[Dict]] = {}
    equipo_buscado = clave(nombre_equipo)
    i = 0

    while i < len(bloque) - 1:
        fila_local = parsear_fila_resultados(bloque[i], equipos_ordenados, len(categorias))
        fila_visitante = parsear_fila_resultados(bloque[i + 1], equipos_ordenados, len(categorias))

        if not fila_local or not fila_visitante or not fila_local.get("fecha_id"):
            i += 1
            continue

        local = fila_local["equipo"]
        visitante = fila_visitante["equipo"]

        if equipo_buscado not in clave(local) and equipo_buscado not in clave(visitante):
            i += 2
            continue

        fecha_id = fila_local["fecha_id"]
        resultados_categoria = {}
        for idx, categoria in enumerate(categorias):
            resultados_categoria[categoria] = {
                "local": fila_local["categorias"][idx] if idx < len(fila_local["categorias"]) else None,
                "visitante": fila_visitante["categorias"][idx] if idx < len(fila_visitante["categorias"]) else None,
            }

        general.setdefault(fecha_id, []).append({
            "fecha_id": fecha_id,
            "fecha": fechas_fixture.get(fecha_id, {}).get("fecha", fecha_id),
            "local": local,
            "visitante": visitante,
            "pj_local": fila_local.get("pj"),
            "pts_local": fila_local.get("pts"),
            "pj_visitante": fila_visitante.get("pj"),
            "pts_visitante": fila_visitante.get("pts"),
            "resultados": resultados_categoria,
        })
        i += 2

    return {"general": general}


def parsear_fila_tabla(linea: str, equipos_ordenados: List[str]) -> Optional[Dict]:
    texto = normalizar_equipo(linea)
    equipo, resto = encontrar_equipo_en_inicio(texto, equipos_ordenados)
    if not equipo:
        return None
    nums = re.findall(r"\d+", resto)
    if len(nums) < 5:
        return None
    pj, g, e, p, pts = map(int, nums[:5])
    return {"equipo": equipo, "pj": pj, "g": g, "e": e, "p": p, "pts": pts}


def sacar_tablas(lineas: List[str], categorias_tablas: List[str]) -> Dict:
    equipos_ordenados = extraer_equipos_fixture(lineas)
    inicio = buscar_indice(lineas, lambda l: limpiar_linea(l).upper().startswith("EQUIPOS PJ"))
    if inicio == -1:
        return {"general": [], "categorias": {}}

    resultado = {"general": [], "categorias": {}}
    seccion_actual: Optional[str] = None

    for linea in lineas[inicio + 1:]:
        texto = limpiar_linea(linea)
        upper = texto.upper()

        if upper.startswith("TABLAS") or upper.startswith("RESULTADOS") or upper.startswith("NO SE HA ENCONTRADO"):
            # No cortamos con TABLAS porque algunas páginas repiten títulos, pero sí evitamos parsear títulos.
            continue
        if upper.startswith("©") or upper.startswith("SUSCRIBITE"):
            break

        texto_cat = normalizar_categoria(texto)
        if upper == "GENERAL":
            seccion_actual = "general"
            continue
        if texto_cat in categorias_tablas:
            seccion_actual = texto_cat
            resultado["categorias"].setdefault(seccion_actual, [])
            continue

        fila = parsear_fila_tabla(texto, equipos_ordenados)
        if not fila or not seccion_actual:
            continue
        if seccion_actual == "general":
            resultado["general"].append(fila)
        else:
            resultado["categorias"].setdefault(seccion_actual, []).append(fila)

    return resultado


def sacar_direcciones(lineas: List[str], fixture: List[Dict], nombre_equipo: str) -> Dict[str, str]:
    inicio = buscar_indice(lineas, lambda l: limpiar_linea(l).upper().startswith("NOMBRE DEL EQUIPO DIRECCI"))
    fin = buscar_indice(lineas[inicio + 1:] if inicio != -1 else [], lambda l: limpiar_linea(l).upper().startswith("F.T.EQUIPOS"))
    if inicio == -1:
        return {}
    fin_abs = inicio + 1 + fin if fin != -1 else len(lineas)

    equipos = extraer_equipos_fixture(lineas)
    equipos.extend([p["local"] for p in fixture] + [p["visitante"] for p in fixture] + [nombre_equipo])
    equipos_ordenados = sorted({normalizar_equipo(e) for e in equipos if e}, key=len, reverse=True)

    direcciones: Dict[str, str] = {}
    for linea in lineas[inicio + 1:fin_abs]:
        texto = normalizar_equipo(linea)
        equipo, resto = encontrar_equipo_en_inicio(texto, equipos_ordenados)
        if not equipo or not resto:
            continue
        resto = re.sub(r"\s+(SI|NO)$", "", resto, flags=re.I).strip()
        if resto:
            direcciones[equipo] = resto
    return direcciones


def guardar_json(clave_zona: str, nombre_archivo: str, data):
    os.makedirs(os.path.join("data", clave_zona), exist_ok=True)

    ruta_data = os.path.join("data", clave_zona, f"{nombre_archivo}.json")
    with open(ruta_data, "w", encoding="utf-8") as archivo:
        json.dump(data, archivo, ensure_ascii=False, indent=2)

    ruta_plana = f"{nombre_archivo}_{clave_zona}.json"
    with open(ruta_plana, "w", encoding="utf-8") as archivo:
        json.dump(data, archivo, ensure_ascii=False, indent=2)

    print(f"Creado: {ruta_data}")
    print(f"Creado: {ruta_plana}")


def procesar_zona(clave_zona: str, info: Dict):
    html = obtener_html(info["url"])
    lineas = obtener_lineas_desde_html(html)

    fixture = sacar_fixture(lineas, info["equipo"])
    tablas = sacar_tablas(lineas, info["categorias_tablas"])
    resultados = sacar_resultados(lineas, fixture, info["equipo"], info["categorias_resultados"])
    direcciones = sacar_direcciones(lineas, fixture, info["equipo"])

    guardar_json(clave_zona, "fixture", fixture)
    guardar_json(clave_zona, "tabla", tablas)
    guardar_json(clave_zona, "resultados", resultados)
    guardar_json(clave_zona, "direcciones", direcciones)

    print(
        f"Zona {clave_zona}: fixture={len(fixture)} | "
        f"tabla_general={len(tablas.get('general', []))} | "
        f"resultados={sum(len(v) for v in resultados.get('general', {}).values())} | "
        f"direcciones={len(direcciones)}"
    )

    if len(fixture) == 0:
        print("AVISO: fixture salió en 0. Primeras líneas útiles encontradas:")
        for linea in lineas[:120]:
            if "LOCAL" in linea.upper() or "FECHA" in linea.upper() or "ALL BOYS" in linea.upper() or "LOS ALBOS" in linea.upper():
                print("  ", linea)


def main():
    errores = []
    for clave_zona, info in ZONAS.items():
        print(f"Procesando {clave_zona}...")
        try:
            procesar_zona(clave_zona, info)
        except Exception as error:
            errores.append((clave_zona, str(error)))
            print(f"ERROR en zona {clave_zona}: {error}")

    if errores:
        print("\nZonas con error:")
        for zona, error in errores:
            print(f"- {zona}: {error}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
