import json
import re
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

MAX_ITEMS = 6

ALLBOYS_DOMINIOS = {
    "caallboys.com.ar",
    "www.caallboys.com.ar",
    "allboysdeprimera.com.ar",
    "www.allboysdeprimera.com.ar",
}
MUNDIAL_DOMINIOS = {"fifa.com", "www.fifa.com", "inside.fifa.com"}

FUENTES = {
    "allboys": {
        "urls": ["https://caallboys.com.ar/actualidad/"],
        "dominios": ALLBOYS_DOMINIOS,
        "output": Path("data/noticias_allboys.json"),
        "fuente": "Club Atletico All Boys",
    },
    "mundial": {
        "urls": ["https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026"],
        "dominios": MUNDIAL_DOMINIOS,
        "output": Path("data/noticias_mundial.json"),
        "fuente": "FIFA",
    },
}


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self._href = None
        self._text = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() != "a":
            return
        attrs_dict = dict(attrs)
        self._href = attrs_dict.get("href")
        self._text = []

    def handle_data(self, data):
        if self._href:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href:
            self.links.append((self._href, " ".join(self._text)))
            self._href = None
            self._text = []


def limpiar_texto(valor, max_len=240):
    texto = unescape(str(valor or ""))
    texto = re.sub(r"<[^>]*>", " ", texto)
    texto = re.sub(r"[\x00-\x1f\x7f]", " ", texto)
    texto = re.sub(r"\s+", " ", texto).strip()
    return texto[:max_len].strip()


def normalizar_url(url, base):
    raw = limpiar_texto(url, 600)
    if not raw:
        return ""
    if raw.startswith("//"):
        raw = f"https:{raw}"
    return urljoin(base, raw)


def es_url_segura(url, dominios):
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    return parsed.scheme == "https" and parsed.hostname in dominios


def fecha_desde_url(url):
    match = re.search(r"/(20\d{2})/(\d{2})/(\d{2})/", url)
    if not match:
        return ""
    anio, mes, dia = match.groups()
    return f"{anio}-{mes}-{dia}"


def resumen_por_fuente(tipo, titulo):
    if tipo == "allboys":
        return f"Nota publicada por una fuente confiable de All Boys: {titulo}."
    return f"Noticia oficial sobre el Mundial 2026 publicada por FIFA: {titulo}."


def descargar(url, dominios):
    if not es_url_segura(url, dominios):
        raise ValueError(f"Fuente no permitida: {url}")
    req = Request(url, headers={"User-Agent": "BabyAllBoysNoticias/1.0"})
    with urlopen(req, timeout=25) as resp:
        final_url = resp.geturl()
        if not es_url_segura(final_url, dominios):
            raise ValueError(f"Redirect no permitido: {final_url}")
        return resp.read().decode("utf-8", errors="ignore")


def extraer_links(html):
    parser = LinkParser()
    parser.feed(html)
    return parser.links


def parece_noticia(tipo, url, titulo):
    titulo_norm = limpiar_texto(titulo, 180)
    if len(titulo_norm) < 12:
        return False
    if tipo == "allboys":
        return bool(re.search(r"/20\d{2}/\d{2}/\d{2}/", url))
    return "worldcup" in url.lower() or "world-cup" in url.lower() or "canadamexicousa2026" in url.lower()


def cargar_previas(path, dominios):
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    return limpiar_items(data if isinstance(data, list) else [], dominios)


def limpiar_items(items, dominios):
    salida = []
    vistos = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        url = limpiar_texto(item.get("url") or item.get("link"), 600)
        if not es_url_segura(url, dominios) or url in vistos:
            continue
        titulo = limpiar_texto(item.get("titulo"), 140)
        if not titulo:
            continue
        vistos.add(url)
        salida.append(
            {
                "id": len(salida) + 1,
                "fecha": limpiar_texto(item.get("fecha"), 24),
                "titulo": titulo,
                "resumen": limpiar_texto(item.get("resumen") or item.get("descripcion"), 260),
                "fuente": limpiar_texto(item.get("fuente"), 60),
                "url": url,
            }
        )
    return salida


def scrape_tipo(tipo):
    cfg = FUENTES[tipo]
    candidatos = []
    for source_url in cfg["urls"]:
        try:
            html = descargar(source_url, cfg["dominios"])
        except (HTTPError, URLError, TimeoutError, OSError, ValueError):
            continue
        for href, texto in extraer_links(html):
            url = normalizar_url(href, source_url)
            titulo = limpiar_texto(texto, 140)
            if not es_url_segura(url, cfg["dominios"]) or not parece_noticia(tipo, url, titulo):
                continue
            candidatos.append(
                {
                    "fecha": fecha_desde_url(url) or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "titulo": titulo,
                    "resumen": resumen_por_fuente(tipo, titulo),
                    "fuente": cfg["fuente"],
                    "url": url,
                }
            )

    noticias = limpiar_items(candidatos, cfg["dominios"])
    if len(noticias) < 1:
        noticias = cargar_previas(cfg["output"], cfg["dominios"])

    cfg["output"].parent.mkdir(parents=True, exist_ok=True)
    cfg["output"].write_text(
        json.dumps(noticias[:MAX_ITEMS], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return cfg["output"], len(noticias[:MAX_ITEMS])


def main():
    for tipo in ("allboys", "mundial"):
        path, total = scrape_tipo(tipo)
        print(f"{tipo}: {total} noticias guardadas en {path}")


if __name__ == "__main__":
    main()
