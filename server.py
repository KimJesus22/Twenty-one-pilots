#!/usr/bin/env python3
"""
Servidor Python simple para servir la aplicación Twenty One Pilots
"""
import http.server
import socketserver
import os
from urllib.parse import unquote

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Servir archivos desde frontend/build
        if self.path == '/':
            self.path = '/frontend/build/index.html'
        elif not self.path.startswith('/api/'):
            # Para rutas del frontend (SPA), servir index.html
            if not os.path.exists('frontend/build' + self.path):
                self.path = '/frontend/build/index.html'
            else:
                self.path = '/frontend/build' + self.path

        return super().do_GET()

    def end_headers(self):
        # Agregar headers CORS para desarrollo
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

def run_server(port=8000):
    """Ejecutar servidor en el puerto especificado"""
    os.chdir('.')  # Asegurar que estamos en el directorio correcto

    with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
        print(f"🚀 Servidor corriendo en http://localhost:{port}")
        print("📁 Sirviendo archivos desde frontend/build")
        print("🔧 Backend APIs disponibles en http://localhost:5000")
        print("⏹️  Presiona Ctrl+C para detener")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Servidor detenido")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()