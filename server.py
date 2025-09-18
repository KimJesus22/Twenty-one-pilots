#!/usr/bin/env python3
"""
Servidor Python avanzado para la aplicación Twenty One Pilots
Incluye: API REST básica, logging, compresión, caché, rate limiting
"""
import http.server
import socketserver
import os
import json
import gzip
import time
import logging
from urllib.parse import unquote, parse_qs, urlparse
from collections import defaultdict
from datetime import datetime
import mimetypes

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/server_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)

# Crear directorio de logs si no existe
os.makedirs('logs', exist_ok=True)

class Metrics:
    """Clase para métricas del servidor"""
    def __init__(self):
        self.requests_total = 0
        self.requests_by_endpoint = defaultdict(int)
        self.response_times = []
        self.start_time = time.time()

    def record_request(self, endpoint, response_time):
        self.requests_total += 1
        self.requests_by_endpoint[endpoint] += 1
        self.response_times.append(response_time)

    def get_stats(self):
        uptime = time.time() - self.start_time
        return {
            'total_requests': self.requests_total,
            'uptime_seconds': uptime,
            'avg_response_time': sum(self.response_times) / len(self.response_times) if self.response_times else 0,
            'requests_by_endpoint': dict(self.requests_by_endpoint)
        }

# Instancia global de métricas
metrics = Metrics()

class Config:
    """Configuración del servidor"""
    def __init__(self):
        self.settings = {
            'port': int(os.getenv('PORT', 8000)),
            'debug': os.getenv('DEBUG', 'false').lower() == 'true',
            'rate_limit_requests': int(os.getenv('RATE_LIMIT', 100)),
            'rate_limit_window': int(os.getenv('RATE_LIMIT_WINDOW', 60)),
            'enable_gzip': os.getenv('ENABLE_GZIP', 'true').lower() == 'true'
        }

    @property
    def port(self):
        return self.settings['port']

    @property
    def debug(self):
        return self.settings['debug']

# Instancia global de configuración
config = Config()

# Rate limiting
request_counts = defaultdict(list)

def is_rate_limited(client_ip):
    """Verificar si la IP está rate limited"""
    now = time.time()
    # Limpiar requests antiguos
    request_counts[client_ip] = [t for t in request_counts[client_ip]
                                if now - t < config.settings['rate_limit_window']]

    if len(request_counts[client_ip]) >= config.settings['rate_limit_requests']:
        return True

    request_counts[client_ip].append(now)
    return False

# Caché simple de archivos
file_cache = {}
CACHE_MAX_SIZE = 50

def get_cached_file(filepath):
    """Obtener archivo del caché o leerlo"""
    if filepath in file_cache:
        return file_cache[filepath]

    try:
        with open(filepath, 'rb') as f:
            content = f.read()

        # Mantener caché LRU simple
        if len(file_cache) >= CACHE_MAX_SIZE:
            # Remover el primer elemento (más antiguo)
            oldest_key = next(iter(file_cache))
            del file_cache[oldest_key]

        file_cache[filepath] = content
        return content
    except FileNotFoundError:
        return None

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        """Sobrescribir logging para usar nuestro logger"""
        logging.info(f"{self.address_string()} - {format % args}")

    def do_GET(self):
        start_time = time.time()

        # Rate limiting
        client_ip = self.client_address[0]
        if is_rate_limited(client_ip):
            self.send_error(429, "Rate limit exceeded")
            return

        # Manejar rutas API
        if self.path.startswith('/api/'):
            self.handle_api_request()
            response_time = time.time() - start_time
            metrics.record_request(self.path, response_time)
            return

        # Servir archivos desde frontend/build
        if self.path == '/':
            self.path = '/frontend/build/index.html'
        elif not self.path.startswith('/api/'):
            # Para rutas del frontend (SPA), servir index.html
            requested_path = 'frontend/build' + self.path
            if not os.path.exists(requested_path):
                self.path = '/frontend/build/index.html'
            else:
                self.path = '/frontend/build' + self.path

        # Intentar servir archivo con caché y compresión
        self.serve_file_with_cache_and_compression()

        response_time = time.time() - start_time
        metrics.record_request(self.path, response_time)

    def do_POST(self):
        """Manejar requests POST para API"""
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            self.send_error(404)

    def handle_api_request(self):
        """Manejar requests de API"""
        try:
            parsed_path = urlparse(self.path)
            path_parts = parsed_path.path.strip('/').split('/')

            if len(path_parts) >= 2 and path_parts[0] == 'api':
                endpoint = path_parts[1]

                if endpoint == 'health':
                    self.send_api_response({'status': 'ok', 'timestamp': datetime.now().isoformat()})
                elif endpoint == 'stats':
                    self.send_api_response(metrics.get_stats())
                elif endpoint == 'mock-data':
                    self.send_api_response(self.get_mock_data())
                else:
                    self.send_error(404, f"API endpoint not found: {endpoint}")
            else:
                self.send_error(404, "Invalid API path")

        except Exception as e:
            logging.error(f"API Error: {e}")
            self.send_error(500, str(e))

    def get_mock_data(self):
        """Datos mock para desarrollo"""
        return {
            'albums': [
                {'id': 1, 'title': 'Blurryface', 'year': 2015, 'cover': '/images/blurryface.jpg'},
                {'id': 2, 'title': 'Trench', 'year': 2018, 'cover': '/images/trench.jpg'},
                {'id': 3, 'title': 'Scaled and Icy', 'year': 2021, 'cover': '/images/scaled.jpg'}
            ],
            'playlists': [
                {'id': 1, 'name': 'TOP Hits', 'songs': 15, 'duration': '45min'},
                {'id': 2, 'name': 'Fan Favorites', 'songs': 23, 'duration': '1h 12min'}
            ]
        }

    def send_api_response(self, data):
        """Enviar respuesta JSON de API"""
        response = json.dumps(data, indent=2).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(response))

        # Agregar headers CORS
        self.send_cors_headers()

        self.end_headers()
        self.wfile.write(response)

    def serve_file_with_cache_and_compression(self):
        """Servir archivo con caché y compresión"""
        filepath = self.translate_path(self.path)

        # Intentar obtener del caché
        content = get_cached_file(filepath)

        if content is None:
            # Archivo no encontrado
            self.send_error(404, "File not found")
            return

        # Determinar tipo MIME
        content_type, _ = mimetypes.guess_type(filepath)
        if content_type is None:
            content_type = 'application/octet-stream'

        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', len(content))

        # Agregar headers CORS
        self.send_cors_headers()

        # Comprimir si es soportado y está habilitado
        if (config.settings['enable_gzip'] and
            'gzip' in self.headers.get('Accept-Encoding', '') and
            content_type.startswith(('text/', 'application/json', 'application/javascript'))):

            compressed_content = gzip.compress(content)
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Content-Length', len(compressed_content))
            self.end_headers()
            self.wfile.write(compressed_content)
        else:
            self.end_headers()
            self.wfile.write(content)

    def send_cors_headers(self):
        """Enviar headers CORS"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    def end_headers(self):
        """Agregar headers adicionales"""
        self.send_cors_headers()
        super().end_headers()

def print_server_info(port):
    """Imprimir información del servidor"""
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║                    🚀 SERVIDOR PYTHON AVANZADO               ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print(f"🌐 Servidor corriendo en: http://localhost:{port}")
    print("📁 Sirviendo archivos desde: frontend/build")
    print("🔧 Backend APIs disponibles en: http://localhost:5000")
    print("📊 Estadísticas disponibles en: http://localhost:{port}/api/stats")
    print("💚 Health check: http://localhost:{port}/api/health")
    print("🎭 Datos mock: http://localhost:{port}/api/mock-data")
    print()
    print("⚙️  Configuración:")
    print(f"   • Puerto: {config.port}")
    print(f"   • Debug: {config.debug}")
    print(f"   • Rate limit: {config.settings['rate_limit_requests']} req/{config.settings['rate_limit_window']}s")
    print(f"   • Compresión GZIP: {config.settings['enable_gzip']}")
    print()
    print("⏹️  Presiona Ctrl+C para detener")
    print()

def run_server(port=None):
    """Ejecutar servidor en el puerto especificado"""
    if port is None:
        port = config.port

    os.chdir('.')  # Asegurar que estamos en el directorio correcto

    # Crear directorios necesarios
    os.makedirs('frontend/build', exist_ok=True)
    os.makedirs('logs', exist_ok=True)

    print_server_info(port)

    try:
        with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n👋 Servidor detenido")
                httpd.shutdown()

                # Mostrar estadísticas finales
                print("\n📊 Estadísticas finales:")
                stats = metrics.get_stats()
                print(f"   • Total de requests: {stats['total_requests']}")
                print(f"   • Tiempo de respuesta promedio: {stats['avg_response_time']:.2f}s")
                print(f"   • Uptime: {stats['uptime_seconds']:.0f} segundos")

                if stats['requests_by_endpoint']:
                    print("   • Requests por endpoint:")
                    for endpoint, count in stats['requests_by_endpoint'].items():
                        print(f"     - {endpoint}: {count}")

    except OSError as e:
        if e.errno == 48:  # Puerto ya en uso
            print(f"❌ Error: Puerto {port} ya está en uso")
            print("💡 Prueba con un puerto diferente: python server.py 8080")
        else:
            print(f"❌ Error al iniciar servidor: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        logging.error(f"Server error: {e}")

if __name__ == "__main__":
    run_server()