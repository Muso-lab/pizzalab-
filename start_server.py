#!/usr/bin/env python3
"""
PizzaLab Launcher - Avvia il server locale e apre l'applicazione nel browser
"""
import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print("=" * 60)
        print("🍕 PIZZALAB SCIENTIFICO - SERVER AVVIATO")
        print(f"👉 Applicazione accessibile all'indirizzo: {url}")
        print("Premi CTRL+C per arrestare il server.")
        print("=" * 60)
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nArresto server in corso...")
            httpd.server_close()
            print("Server arrestato.")

if __name__ == '__main__':
    main()
