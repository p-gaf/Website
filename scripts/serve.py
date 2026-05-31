#!/usr/bin/env python3
"""Tiny static server for local dev with implicit .html fallback.

Mirrors GitHub Pages' behavior: a request for `/music` is served from
`music.html` if no literal `music` file exists. The stock
`python3 -m http.server` doesn't do this, so internal links that omit
.html (which is what the deployed site uses) would 404 in local preview.

Usage:
    python3 scripts/serve.py          # serves on http://localhost:8000
    python3 scripts/serve.py 9000     # custom port
"""
import http.server
import socketserver
import sys
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = Path(__file__).resolve().parent.parent  # repo root


class HtmlFallbackHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        fs_path = Path(self.translate_path(path))

        # If literal path exists, serve normally
        if fs_path.exists():
            return super().do_GET()

        # If adding .html resolves to a real file, rewrite the path
        if not path.endswith(".html") and not path.endswith("/"):
            html_path = Path(self.translate_path(path + ".html"))
            if html_path.is_file():
                self.path = path + ".html"
                return super().do_GET()

        return super().do_GET()  # 404 path


if __name__ == "__main__":
    handler = HtmlFallbackHandler
    with socketserver.ThreadingTCPServer(("", PORT), handler) as httpd:
        print(f"Serving {ROOT} at http://localhost:{PORT}  (with .html fallback)")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nshutting down")
