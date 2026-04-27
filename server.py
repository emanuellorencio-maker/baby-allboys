from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import subprocess

ARCHIVO = os.path.join("data", "resultados_manual.json")
PUERTO = 8010
AUTO_PUSH = os.environ.get("AUTO_PUSH", "").lower() in {"1", "true", "si", "sí", "yes"}

def run_git(args):
    return subprocess.run(args, check=False, capture_output=True, text=True)

class Handler(BaseHTTPRequestHandler):
    def send_json_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self.send_json_headers(200)
        self.wfile.write(b'{"ok": true}')

    def do_GET(self):
        self.send_json_headers(200)
        self.wfile.write(json.dumps({
            "ok": True,
            "mensaje": "Servidor de guardado funcionando",
            "archivo": ARCHIVO,
            "puerto": PUERTO
        }, ensure_ascii=False).encode("utf-8"))

    def do_POST(self):
        if self.path != "/guardar":
            self.send_json_headers(404)
            self.wfile.write(json.dumps({"ok": False, "error": "Ruta no encontrada"}, ensure_ascii=False).encode("utf-8"))
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body)

            os.makedirs("data", exist_ok=True)

            with open(ARCHIVO, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            git_result = []
            try:
                add = run_git(["git", "add", ARCHIVO])
                git_result.append(add.stdout + add.stderr)

                diff = run_git(["git", "diff", "--cached", "--quiet", "--", ARCHIVO])
                if diff.returncode == 0:
                    git_result.append("Sin cambios nuevos para commitear.")
                else:
                    commit = run_git(["git", "commit", "-m", "actualizar resultados manuales"])
                    git_result.append(commit.stdout + commit.stderr)

                    if AUTO_PUSH:
                        push = run_git(["git", "push"])
                        git_result.append(push.stdout + push.stderr)
                    else:
                        git_result.append("Push omitido. Para habilitarlo, iniciar con AUTO_PUSH=1.")
            except Exception as git_error:
                git_result.append(f"Git error: {git_error}")

            self.send_json_headers(200)
            self.wfile.write(json.dumps({
                "ok": True,
                "archivo": ARCHIVO,
                "git": git_result
            }, ensure_ascii=False).encode("utf-8"))

        except Exception as e:
            self.send_json_headers(500)
            self.wfile.write(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False).encode("utf-8"))

if __name__ == "__main__":
    print(f"Servidor de guardado/autocommit funcionando en http://0.0.0.0:{PUERTO}")
    print(f"Auto-push: {'activado' if AUTO_PUSH else 'desactivado'}")
    print("Para usar desde celular, buscá la IP de tu PC y abrí: http://IP-DE-TU-PC:8000/admin.html")
    print("No cierres esta ventana mientras uses el admin.")
    HTTPServer(("0.0.0.0", PUERTO), Handler).serve_forever()
