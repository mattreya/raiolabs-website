from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from .service import NetworkmattService

MAX_BODY_BYTES = 64 * 1024


class Handler(BaseHTTPRequestHandler):
    service = NetworkmattService()
    server_version = "networkmatt/0.1"

    def do_GET(self) -> None:
        if self.path == "/":
            ui_path = Path(__file__).resolve().parents[2] / "ui" / "index.html"
            try:
                body = ui_path.read_bytes()
            except OSError:
                self._send_json(404, {"error": "Touch UI file is unavailable"})
                return
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path == "/health":
            self._send_json(200, {"ok": True, "simulation": True})
        elif self.path == "/v1/status":
            self._send_json(200, self.service.status())
        elif self.path == "/v1/readiness":
            self._send_json(200, self.service.readiness())
        elif self.path == "/v1/candidate":
            candidate = self.service.candidate()
            if candidate is None:
                self._send_json(404, {"error": "No candidate is ready for review"})
            else:
                self._send_json(200, candidate)
        else:
            self._send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:
        try:
            if self.path == "/v1/analysis":
                result = self.service.ingest_analysis(self._read_json())
            elif self.path == "/v1/candidate":
                result = self.service.create_candidate()
            elif self.path == "/v1/candidate/approve":
                result = self.service.approve_passive_candidate()
            elif self.path == "/v1/capture/pause":
                result = self.service.set_capture_paused(True)
            elif self.path == "/v1/capture/resume":
                result = self.service.set_capture_paused(False)
            else:
                self._send_json(404, {"error": "Not found"})
                return
        except (ValueError, json.JSONDecodeError) as exc:
            self._send_json(400, {"error": str(exc)})
            return
        self._send_json(200, result)

    def _read_json(self) -> Any:
        raw_length = self.headers.get("Content-Length", "0")
        try:
            length = int(raw_length)
        except ValueError as exc:
            raise ValueError("Invalid Content-Length") from exc
        if length < 1 or length > MAX_BODY_BYTES:
            raise ValueError(f"Request body must be between 1 and {MAX_BODY_BYTES} bytes")
        body = self.rfile.read(length)
        try:
            return json.loads(body)
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise ValueError("Request body must be valid UTF-8 JSON") from exc

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        print(f"[http] {self.address_string()} {format % args}")


def serve(port: int = 8765) -> None:
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"networkmatt simulation UI: http://127.0.0.1:{port}/")
    print("Loopback only. No packet capture or device configuration is enabled.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping networkmatt.")
    finally:
        server.server_close()
