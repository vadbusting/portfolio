import http.server, socketserver, urllib.parse, sys
class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
    def do_GET(self):
        if '/log' in self.path:
            query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            print('ERROR CAUGHT:', query.get('msg', [''])[0], flush=True)
            self.send_response(200)
            self.end_headers()
        else:
            super().do_GET()
with socketserver.TCPServer(('', 8891), Handler) as httpd:
    httpd.serve_forever()
