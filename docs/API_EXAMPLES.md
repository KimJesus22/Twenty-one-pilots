# 📚 Ejemplos de Consumo de API - Twenty One Pilots

## 🎯 Visión General

Esta guía proporciona ejemplos prácticos para consumir la API de Twenty One Pilots en diferentes lenguajes de programación. Todos los ejemplos incluyen autenticación, manejo de errores y casos de uso comunes.

## 🔐 Autenticación

### Obtener Token JWT

```bash
# cURL
curl -X POST http://localhost:5000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Usar Token en Requests

```bash
# Incluir token en header Authorization
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/v2/videos/search?q=top
```

## 📺 Gestión de Videos

### 1. Buscar Videos

#### JavaScript (Node.js + Axios)

```javascript
const axios = require('axios');

class TwentyOnePilotsAPI {
  constructor(baseURL = 'http://localhost:5000/api/v2') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para JWT
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para errores
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado, redirigir a login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async searchVideos(query, options = {}) {
    try {
      const response = await this.client.get('/videos/search', {
        params: {
          q: query,
          limit: options.limit || 20,
          page: options.page || 1
        }
      });

      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error searching videos:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getVideoDetails(videoId) {
    try {
      const response = await this.client.get(`/videos/${videoId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting video details:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

// Uso
const api = new TwentyOnePilotsAPI();

async function searchTOPVideos() {
  const result = await api.searchVideos('Twenty One Pilots', { limit: 10 });

  if (result.success) {
    console.log('Videos encontrados:', result.data.length);
    result.data.forEach(video => {
      console.log(`- ${video.title} (${video.channelTitle})`);
    });
  } else {
    console.error('Error:', result.error);
  }
}

searchTOPVideos();
```

#### Python (Requests)

```python
import requests
from typing import Optional, Dict, List
import json

class TwentyOnePilotsAPI:
    def __init__(self, base_url: str = "http://localhost:5000/api/v2", token: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'TwentyOnePilots-PythonClient/1.0'
        })

        if token:
            self.session.headers.update({
                'Authorization': f'Bearer {token}'
            })

    def login(self, email: str, password: str) -> Dict:
        """Autenticar usuario y obtener token JWT"""
        try:
            response = self.session.post(f"{self.base_url}/auth/login", json={
                'email': email,
                'password': password
            })

            response.raise_for_status()
            data = response.json()

            if data.get('success'):
                token = data['data']['token']
                self.session.headers.update({
                    'Authorization': f'Bearer {token}'
                })
                return {'success': True, 'token': token}

            return {'success': False, 'error': data.get('message', 'Login failed')}

        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def search_videos(self, query: str, limit: int = 20, page: int = 1) -> Dict:
        """Buscar videos"""
        try:
            params = {
                'q': query,
                'limit': limit,
                'page': page
            }

            response = self.session.get(f"{self.base_url}/videos/search", params=params)
            response.raise_for_status()

            data = response.json()
            return {
                'success': True,
                'data': data.get('data', []),
                'pagination': data.get('pagination', {})
            }

        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def get_video_details(self, video_id: str) -> Dict:
        """Obtener detalles de un video específico"""
        try:
            response = self.session.get(f"{self.base_url}/videos/{video_id}")
            response.raise_for_status()

            data = response.json()
            return {
                'success': True,
                'data': data.get('data', {})
            }

        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def get_popular_videos(self, limit: int = 10) -> Dict:
        """Obtener videos populares"""
        try:
            response = self.session.get(f"{self.base_url}/videos/popular", params={'limit': limit})
            response.raise_for_status()

            data = response.json()
            return {
                'success': True,
                'data': data.get('data', [])
            }

        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

# Ejemplo de uso
def main():
    api = TwentyOnePilotsAPI()

    # Login
    login_result = api.login("user@example.com", "password123")
    if not login_result['success']:
        print(f"Login failed: {login_result['error']}")
        return

    print("✅ Login successful!")

    # Buscar videos
    search_result = api.search_videos("Twenty One Pilots", limit=5)
    if search_result['success']:
        print(f"\n📺 Found {len(search_result['data'])} videos:")
        for video in search_result['data']:
            print(f"- {video['title']} by {video['channelTitle']}")
            print(f"  URL: {video.get('url', 'N/A')}")
            print(f"  Views: {video.get('statistics', {}).get('viewCount', 'N/A')}")
            print()
    else:
        print(f"Search failed: {search_result['error']}")

if __name__ == "__main__":
    main()
```

#### React/JavaScript (Frontend)

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// API Client Hook
const useTwentyOnePilotsAPI = () => {
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Axios instance con configuración
  const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v2',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Interceptor para JWT
  apiClient.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Interceptor para errores
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        setToken(null);
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', { email, password });

      if (response.data.success) {
        const newToken = response.data.data.token;
        setToken(newToken);
        localStorage.setItem('jwt_token', newToken);
        return { success: true, token: newToken };
      }

      return { success: false, error: response.data.message };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const searchVideos = useCallback(async (query, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/videos/search', {
        params: {
          q: query,
          limit: options.limit || 20,
          page: options.page || 1
        }
      });

      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getVideoDetails = useCallback(async (videoId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/videos/${videoId}`);
      return { success: true, data: response.data.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    token,
    loading,
    error,
    login,
    searchVideos,
    getVideoDetails,
    logout: () => {
      setToken(null);
      localStorage.removeItem('jwt_token');
    }
  };
};

// Componente de ejemplo
const VideoSearch = () => {
  const { searchVideos, loading, error } = useTwentyOnePilotsAPI();
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    const result = await searchVideos(query);

    if (result.success) {
      setVideos(result.data);
    } else {
      console.error('Search failed:', result.error);
    }
  };

  return (
    <div className="video-search">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar videos de Twenty One Pilots..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && <div className="error">Error: {error}</div>}

      <div className="video-results">
        {videos.map(video => (
          <div key={video.id} className="video-card">
            <img src={video.thumbnail} alt={video.title} />
            <h3>{video.title}</h3>
            <p>{video.channelTitle}</p>
            <p>{video.description?.substring(0, 100)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoSearch;
```

#### PHP (Laravel/Symfony)

```php
<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

class TwentyOnePilotsAPI
{
    private Client $client;
    private ?string $token = null;

    public function __construct(string $baseUrl = 'http://localhost:5000/api/v2')
    {
        $this->client = new Client([
            'base_uri' => $baseUrl,
            'timeout' => 10.0,
            'headers' => [
                'Content-Type' => 'application/json',
                'User-Agent' => 'TwentyOnePilots-PHPClient/1.0'
            ]
        ]);
    }

    /**
     * Autenticar usuario
     */
    public function login(string $email, string $password): array
    {
        try {
            $response = $this->client->post('/auth/login', [
                'json' => [
                    'email' => $email,
                    'password' => $password
                ]
            ]);

            $data = json_decode($response->getBody(), true);

            if ($data['success']) {
                $this->token = $data['data']['token'];
                return ['success' => true, 'token' => $this->token];
            }

            return ['success' => false, 'error' => $data['message'] ?? 'Login failed'];

        } catch (RequestException $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Buscar videos
     */
    public function searchVideos(string $query, int $limit = 20, int $page = 1): array
    {
        try {
            $headers = [];
            if ($this->token) {
                $headers['Authorization'] = 'Bearer ' . $this->token;
            }

            $response = $this->client->get('/videos/search', [
                'headers' => $headers,
                'query' => [
                    'q' => $query,
                    'limit' => $limit,
                    'page' => $page
                ]
            ]);

            $data = json_decode($response->getBody(), true);

            return [
                'success' => true,
                'data' => $data['data'] ?? [],
                'pagination' => $data['pagination'] ?? []
            ];

        } catch (RequestException $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Obtener detalles de video
     */
    public function getVideoDetails(string $videoId): array
    {
        try {
            $headers = [];
            if ($this->token) {
                $headers['Authorization'] = 'Bearer ' . $this->token;
            }

            $response = $this->client->get("/videos/{$videoId}", [
                'headers' => $headers
            ]);

            $data = json_decode($response->getBody(), true);

            return [
                'success' => true,
                'data' => $data['data'] ?? []
            ];

        } catch (RequestException $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Obtener videos populares
     */
    public function getPopularVideos(int $limit = 10): array
    {
        try {
            $headers = [];
            if ($this->token) {
                $headers['Authorization'] = 'Bearer ' . $this->token;
            }

            $response = $this->client->get('/videos/popular', [
                'headers' => $headers,
                'query' => ['limit' => $limit]
            ]);

            $data = json_decode($response->getBody(), true);

            return [
                'success' => true,
                'data' => $data['data'] ?? []
            ];

        } catch (RequestException $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}

// Ejemplo de uso en Laravel Controller
class VideoController extends Controller
{
    public function search(Request $request)
    {
        $api = new TwentyOnePilotsAPI();

        // Login si es necesario
        if (!$request->session()->has('api_token')) {
            $loginResult = $api->login(
                config('services.twentyonepilots.email'),
                config('services.twentyonepilots.password')
            );

            if (!$loginResult['success']) {
                return response()->json(['error' => 'API authentication failed'], 500);
            }

            $request->session()->put('api_token', $loginResult['token']);
        }

        // Buscar videos
        $searchResult = $api->searchVideos(
            $request->get('q', 'Twenty One Pilots'),
            $request->get('limit', 20)
        );

        if (!$searchResult['success']) {
            return response()->json(['error' => $searchResult['error']], 500);
        }

        return response()->json([
            'videos' => $searchResult['data'],
            'pagination' => $searchResult['pagination']
        ]);
    }
}
```

#### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type TwentyOnePilotsAPI struct {
    BaseURL string
    Client  *http.Client
    Token   string
}

type LoginRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}

type LoginResponse struct {
    Success bool   `json:"success"`
    Message string `json:"message,omitempty"`
    Data    struct {
        Token string `json:"token"`
    } `json:"data,omitempty"`
}

type Video struct {
    ID          string `json:"id"`
    Title       string `json:"title"`
    Description string `json:"description"`
    Thumbnail   string `json:"thumbnail"`
    ChannelTitle string `json:"channelTitle"`
    PublishedAt string `json:"publishedAt"`
    URL         string `json:"url"`
    Statistics  struct {
        ViewCount string `json:"viewCount"`
    } `json:"statistics,omitempty"`
}

type SearchResponse struct {
    Success    bool     `json:"success"`
    Data       []Video  `json:"data"`
    Pagination struct {
        TotalResults int `json:"totalResults"`
        NextPageToken string `json:"nextPageToken,omitempty"`
    } `json:"pagination,omitempty"`
}

func NewTwentyOnePilotsAPI(baseURL string) *TwentyOnePilotsAPI {
    return &TwentyOnePilotsAPI{
        BaseURL: baseURL,
        Client: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

func (api *TwentyOnePilotsAPI) Login(email, password string) error {
    loginReq := LoginRequest{
        Email:    email,
        Password: password,
    }

    jsonData, err := json.Marshal(loginReq)
    if err != nil {
        return fmt.Errorf("error marshaling login request: %w", err)
    }

    req, err := http.NewRequest("POST", api.BaseURL+"/auth/login", bytes.NewBuffer(jsonData))
    if err != nil {
        return fmt.Errorf("error creating login request: %w", err)
    }
    req.Header.Set("Content-Type", "application/json")

    resp, err := api.Client.Do(req)
    if err != nil {
        return fmt.Errorf("error making login request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return fmt.Errorf("login failed with status %d: %s", resp.StatusCode, string(body))
    }

    var loginResp LoginResponse
    if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
        return fmt.Errorf("error decoding login response: %w", err)
    }

    if !loginResp.Success {
        return fmt.Errorf("login failed: %s", loginResp.Message)
    }

    api.Token = loginResp.Data.Token
    return nil
}

func (api *TwentyOnePilotsAPI) SearchVideos(query string, limit int) (*SearchResponse, error) {
    req, err := http.NewRequest("GET", api.BaseURL+"/videos/search", nil)
    if err != nil {
        return nil, fmt.Errorf("error creating search request: %w", err)
    }

    if api.Token != "" {
        req.Header.Set("Authorization", "Bearer "+api.Token)
    }

    q := req.URL.Query()
    q.Add("q", query)
    q.Add("limit", fmt.Sprintf("%d", limit))
    req.URL.RawQuery = q.Encode()

    resp, err := api.Client.Do(req)
    if err != nil {
        return nil, fmt.Errorf("error making search request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("search failed with status %d: %s", resp.StatusCode, string(body))
    }

    var searchResp SearchResponse
    if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
        return nil, fmt.Errorf("error decoding search response: %w", err)
    }

    if !searchResp.Success {
        return nil, fmt.Errorf("search API returned error")
    }

    return &searchResp, nil
}

func main() {
    api := NewTwentyOnePilotsAPI("http://localhost:5000/api/v2")

    // Login
    if err := api.Login("user@example.com", "password123"); err != nil {
        fmt.Printf("Login failed: %v\n", err)
        return
    }

    fmt.Println("✅ Login successful!")

    // Search videos
    result, err := api.SearchVideos("Twenty One Pilots", 5)
    if err != nil {
        fmt.Printf("Search failed: %v\n", err)
        return
    }

    fmt.Printf("\n📺 Found %d videos:\n", len(result.Data))
    for i, video := range result.Data {
        fmt.Printf("%d. %s\n", i+1, video.Title)
        fmt.Printf("   Channel: %s\n", video.ChannelTitle)
        fmt.Printf("   URL: %s\n", video.URL)
        if video.Statistics.ViewCount != "" {
            fmt.Printf("   Views: %s\n", video.Statistics.ViewCount)
        }
        fmt.Println()
    }
}
```

## 🧪 Testing y Debugging

### Postman Collection

```json
{
  "info": {
    "name": "Twenty One Pilots API",
    "description": "Collection for testing Twenty One Pilots API endpoints",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{jwt_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api/v2"
    },
    {
      "key": "jwt_token",
      "value": ""
    }
  ]
}
```

### Scripts de Testing

#### Bash Script para Health Checks

```bash
#!/bin/bash

# Health check script for Twenty One Pilots API

BASE_URL="http://localhost:5000"
ENDPOINTS=(
    "/health"
    "/api/v1/health"
    "/api/v2/health"
    "/api/versions"
    "/api/metrics"
)

echo "🔍 Running health checks for Twenty One Pilots API"
echo "================================================="

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "Testing $endpoint... "

    response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint")

    if [ "$response" = "200" ]; then
        echo "✅ OK"
    else
        echo "❌ FAILED (HTTP $response)"
    fi
done

echo ""
echo "Health checks completed!"
```

#### Load Testing con Artillery

```yaml
# artillery-load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 20
      name: "Load testing"
    - duration: 60
      arrivalRate: 5
      name: "Cool down"

scenarios:
  - name: 'Search videos'
    weight: 70
    requests:
      - get:
          url: '/api/v2/videos/search'
          qs:
            q: 'Twenty One Pilots'
            limit: '10'

  - name: 'Get video details'
    weight: 20
    requests:
      - get:
          url: '/api/v2/videos/{{ videoId }}'

  - name: 'Health check'
    weight: 10
    requests:
      - get:
          url: '/health'
```

## 📋 Manejo de Errores

### Códigos de Error Comunes

| Código | Descripción | Solución |
|--------|-------------|----------|
| 400 | Bad Request | Verificar parámetros de la request |
| 401 | Unauthorized | Verificar token JWT |
| 403 | Forbidden | Verificar permisos del usuario |
| 404 | Not Found | Verificar endpoint y parámetros |
| 429 | Too Many Requests | Implementar rate limiting |
| 500 | Internal Server Error | Contactar soporte técnico |

### Ejemplo de Manejo de Errores en JavaScript

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json();

      switch (response.status) {
        case 401:
          // Token expirado
          handleTokenExpiration();
          break;
        case 429:
          // Rate limit excedido
          showRateLimitError(errorData);
          break;
        case 500:
          // Error del servidor
          logErrorToService(errorData);
          break;
        default:
          showGenericError(errorData.message);
      }

      throw new Error(errorData.message);
    }

    return await response.json();

  } catch (error) {
    if (error.name === 'TypeError') {
      // Error de red
      showNetworkError();
    } else {
      // Error de API
      showAPIError(error.message);
    }

    throw error;
  }
}
```

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# API Configuration
API_BASE_URL=http://localhost:5000/api/v2
API_TIMEOUT=10000
API_RETRIES=3

# Authentication
JWT_TOKEN_REFRESH_BUFFER=300000  # 5 minutes in milliseconds

# Caching
CACHE_TTL=300000  # 5 minutes
CACHE_MAX_SIZE=100

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000  # 15 minutes
```

### Configuración de Cliente Avanzada

```javascript
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: parseInt(process.env.API_TIMEOUT) || 10000,

  // Reintento automático
  retry: parseInt(process.env.API_RETRIES) || 3,
  retryDelay: 1000,

  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': 'v2',
    'X-Client-Version': process.env.npm_package_version
  }
});
```

---

**Última actualización**: $(date)
**Versión de ejemplos**: 2.0.0
**Idiomas soportados**: JavaScript, Python, PHP, Go, cURL