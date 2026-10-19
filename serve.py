#!/usr/bin/env python3
import http.server
import socketserver
import os
import re
import sys
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3002

def to_u_escape(s):
    out = []
    for c in s:
        if ord(c) > 127:
            out.append(f'#U{ord(c):04x}')
        else:
            out.append(c)
    return ''.join(out)

class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def translate_path(self, path):
        clean_path = super().translate_path(path)
        if os.path.exists(clean_path):
            return clean_path
        # Try #U escape fallback for git/zip escaped unicode filenames
        dirname, filename = os.path.split(clean_path)
        u_filename = to_u_escape(filename)
        u_path = os.path.join(dirname, u_filename)
        if os.path.exists(u_path):
            return u_path
        return clean_path

    def send_head(self):
        if 'Range' not in self.headers:
            return super().send_head()
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()
        try:
            f = open(path, 'rb')
            fs = os.fstat(f.fileno())
            size = fs[6]
            range_header = self.headers['Range']
            match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if not match:
                return super().send_head()
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else size - 1
            if start >= size or start > end:
                self.send_error(416, 'Requested Range Not Satisfiable')
                self.send_header('Content-Range', f'bytes */{size}')
                self.end_headers()
                f.close()
                return None
            self.send_response(206)
            self.send_header('Content-type', self.guess_type(path))
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.send_header('Content-Length', str(end - start + 1))
            self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
            self.end_headers()
            f.seek(start)
            return f
        except Exception:
            return super().send_head()

    def copyfile(self, source, outputfile):
        """Copy in chunks and catch client disconnects (BrokenPipeError)."""
        try:
            bufsize = 64 * 1024
            while True:
                buf = source.read(bufsize)
                if not buf:
                    break
                outputfile.write(buf)
        except (BrokenPipeError, ConnectionResetError):
            pass

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

if __name__ == '__main__':
    # Supports local development and mobile real-device testing over Wi-Fi
    HOST = '127.0.0.1' if '--localhost-only' in sys.argv else ''
    with ThreadedHTTPServer((HOST, PORT), RangeRequestHandler) as httpd:
        print(f'Threaded HTTP server running on port {PORT} with Byte-Range & Unicode fallback support...')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
