#!/usr/bin/env python3
"""관리 페이지(/admin/)의 '사이트에 올리기' 버튼용 로컬 도우미.
이 컴퓨터 안(127.0.0.1)에서만 접속되며, 하는 일은 두 가지뿐입니다:
  GET  /status   → git 변경 파일 목록
  POST /publish  → ./publish.sh "메시지" 실행 후 출력 반환
preview.sh 가 함께 켜고, 끄면 같이 꺼집니다."""
import json, os, subprocess, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 4001
ALLOWED = ("http://127.0.0.1:4000", "http://localhost:4000")

class H(BaseHTTPRequestHandler):
    def _cors(self):
        o = self.headers.get("Origin", "")
        if o in ALLOWED:
            self.send_header("Access-Control-Allow-Origin", o)
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    def _send(self, code, text):
        body = text.encode("utf-8")
        self.send_response(code); self._cors()
        self.send_header("Content-Type", "text/plain; charset=utf-8"); self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()
    def do_GET(self):
        if self.path != "/status": return self._send(404, "not found")
        r = subprocess.run(["git", "-c", "core.quotepath=off", "status", "--short"], cwd=ROOT, capture_output=True, text=True)
        self._send(200, r.stdout)
    def do_POST(self):
        if self.path != "/publish": return self._send(404, "not found")
        if self.headers.get("Origin", "") not in ALLOWED: return self._send(403, "forbidden")
        n = int(self.headers.get("Content-Length", "0") or 0)
        try: msg = json.loads(self.rfile.read(n) or b"{}").get("message", "").strip()
        except Exception: msg = ""
        r = subprocess.run(["./publish.sh", msg or "Update site"], cwd=ROOT, capture_output=True, text=True)
        self._send(200 if r.returncode == 0 else 500, (r.stdout + r.stderr).strip() or "(출력 없음)")
    def log_message(self, *a): pass

if __name__ == "__main__":
    HTTPServer(("127.0.0.1", PORT), H).serve_forever()
