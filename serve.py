#!/usr/bin/env python3
"""Local preview server for the portfolio.

Like `python3 -m http.server`, but supports HTTP Range requests, which
browsers need to stream and seek video (Safari won't play video without it).

Usage:  python3 serve.py [port]      (default port 8000)
"""
import os
import re
import sys
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)$")


class RangeRequestHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self._range = None
        header = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not header or not os.path.isfile(path):
            return super().send_head()

        match = RANGE_RE.match(header.strip())
        size = os.path.getsize(path)
        if not match or not any(match.groups()):
            return super().send_head()

        first, last = match.groups()
        if first:
            start, end = int(first), int(last) if last else size - 1
        else:  # suffix range: last N bytes
            start, end = max(0, size - int(last)), size - 1
        end = min(end, size - 1)

        if start >= size or start > end:
            self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        f = open(path, "rb")
        f.seek(start)
        self._range = end - start + 1
        self.send_response(HTTPStatus.PARTIAL_CONTENT)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(self._range))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        return f

    def end_headers(self):
        if self._range is None:
            self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store")  # always show the latest edits
        super().end_headers()

    def copyfile(self, source, outputfile):
        try:
            if self._range is None:
                return super().copyfile(source, outputfile)
            remaining = self._range
            while remaining > 0:
                chunk = source.read(min(64 * 1024, remaining))
                if not chunk:
                    break
                outputfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass  # browser cancelled the request (normal when seeking video)

    def log_message(self, fmt, *args):
        pass  # keep the terminal quiet


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.dirname(os.path.abspath(__file__))
    handler = partial(RangeRequestHandler, directory=root)
    RangeRequestHandler._range = None
    with ThreadingHTTPServer(("", port), handler) as httpd:
        print(f"Serving portfolio at http://localhost:{port}  (Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
