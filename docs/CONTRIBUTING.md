# Guía de Contribución

¡Gracias por tu interés en contribuir a la plataforma Twenty One Pilots! 🎵 Esta guía te ayudará a entender cómo contribuir de manera efectiva al proyecto.

## 📋 Tabla de Contenidos
- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Estándares de Código](#estándares-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Testing](#testing)
- [Documentación](#documentación)

## 🤝 Código de Conducta

Este proyecto sigue un código de conducta para asegurar un ambiente inclusivo y respetuoso. Al participar, te comprometes a:

- Ser respetuoso con todas las personas
- Usar lenguaje inclusivo y no discriminatorio
- Aceptar constructivamente críticas
- Enfocarte en lo que es mejor para la comunidad
- Mostrar empatía hacia otros contribuidores

## 🚀 Cómo Contribuir

### Tipos de Contribuciones

1. **🐛 Reportar Bugs**: Usa el template de issue para bugs
2. **💡 Sugerir Features**: Usa el template de feature request
3. **📝 Mejorar Documentación**: Actualiza README, docs, o comentarios
4. **🔧 Escribir Código**: Implementa nuevas funcionalidades o arregla bugs
5. **🧪 Escribir Tests**: Añade o mejora cobertura de tests
6. **🎨 Mejorar UI/UX**: Mejora la interfaz de usuario
7. **🌐 Traducciones**: Añade soporte para nuevos idiomas

### Primeros Pasos

1. **Fork** el repositorio
2. **Clona** tu fork: `git clone https://github.com/tu-usuario/twenty-one-pilots-platform.git`
3. **Crea** una rama: `git checkout -b feature/nueva-funcionalidad`
4. **Sigue** las instrucciones de instalación en `docs/INSTALLATION.md`
5. **Desarrolla** tu contribución
6. **Haz commit** de tus cambios
7. **Push** a tu rama: `git push origin feature/nueva-funcionalidad`
8. **Crea** un Pull Request

## 🛠️ Configuración del Entorno de Desarrollo

### Prerrequisitos
- Node.js 16+
- MongoDB (local o Atlas)
- Git
- Editor de código (VS Code recomendado)

### Configuración Rápida
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/twenty-one-pilots-platform.git
cd twenty-one-pilots-platform

# Instalar dependencias
npm run install:all

# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Ejecutar en modo desarrollo
npm run dev
```

### Scripts Disponibles
```json
{
  "install:all": "npm run install:backend && npm run install:frontend",
  "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
  "build": "npm run build:backend && npm run build:frontend",
  "test": "npm run test:backend && npm run test:frontend",
  "lint": "npm run lint:backend && npm run lint:frontend"
}
```

## 📁 Estructura del Proyecto

```
twenty-one-pilots-platform/
├── backend/
│   ├── controllers/     # Lógica de negocio
│   ├── models/         # Modelos de MongoDB
│   ├── routes/         # Definición de rutas
│   ├── services/       # Servicios externos
│   ├── middleware/     # Middleware personalizado
│   ├── utils/          # Utilidades
│   ├── validations/    # Validaciones
│   ├── tests/          # Tests
│   └── config/         # Configuraciones
├── frontend/
│   ├── src/
│   │   ├── components/ # Componentes React
│   │   ├── pages/      # Páginas
│   │   ├── services/   # Servicios API
│   │   ├── hooks/      # Custom hooks
│   │   ├── utils/      # Utilidades
│   │   └── styles/     # Estilos
│   └── public/         # Assets estáticos
├── docs/               # Documentación
└── .github/           # GitHub Actions y templates
```

## 🎯 Estándares de Código

### Backend (Node.js)

#### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'node/no-missing-require': 'off'
  }
};
```

#### Convenciones de Nombres
- **Archivos**: `camelCase.js` o `PascalCase.js`
- **Funciones**: `camelCase`
- **Clases**: `PascalCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Variables**: `camelCase`

#### Estructura de Controladores
```javascript
class ExampleController {
  async getAll(req, res) {
    try {
      // Validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Lógica de negocio
      const data = await this.service.getAll(req.query);

      // Respuesta
      res.json({
        success: true,
        data
      });
    } catch (error) {
      logger.error('Error en getAll:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}
```

### Frontend (React)

#### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'react-app',
    'react-app/jest'
  ],
  plugins: ['react', 'jsx-a11y'],
  rules: {
    'react/prop-types': 'warn',
    'react/react-in-jsx-scope': 'off',
    'jsx-a11y/anchor-is-valid': 'warn'
  }
};
```

#### Estructura de Componentes
```javascript
// Componente funcional con hooks
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ExampleComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialState);
  const navigate = useNavigate();

  useEffect(() => {
    // Efectos secundarios
    fetchData();
  }, [dependencies]);

  const handleAction = async () => {
    try {
      setLoading(true);
      await performAction();
      navigate('/success');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="example-component">
      {/* JSX aquí */}
    </div>
  );
};

export default ExampleComponent;
```

## 📝 Proceso de Pull Request

### 1. Preparar tu PR
- Asegúrate de que tu código pase todos los tests
- Actualiza la documentación si es necesario
- Escribe una descripción clara del cambio
- Referencia issues relacionados

### 2. Template de PR
```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de Cambio
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 💥 Breaking change
- [ ] 📝 Documentation
- [ ] 🎨 Style
- [ ] ♻️ Refactor
- [ ] ⚡ Performance
- [ ] ✅ Test

## Checklist
- [ ] Tests pasan
- [ ] Linting pasa
- [ ] Documentación actualizada
- [ ] Breaking changes documentados
- [ ] Migraciones incluidas (si aplica)

## Issues Relacionados
- Closes #123
- Related to #456

## Capturas de Pantalla (si aplica)
<!-- Agrega capturas antes/después -->
```

### 3. Revisión de Código
Tu PR será revisado por maintainers quienes pueden:
- Aprobar los cambios
- Solicitar modificaciones
- Hacer preguntas sobre la implementación
- Sugerir mejoras

### 4. Merge
Una vez aprobado, tu PR será merged usando:
- **Squash and merge** para commits limpios
- **Rebase and merge** para mantener historial lineal
- **Merge commit** para preservar contexto

## 🧪 Testing

### Estrategia de Testing
- **Unit Tests**: Funciones individuales y utilidades
- **Integration Tests**: Interacciones entre componentes
- **E2E Tests**: Flujos completos de usuario
- **API Tests**: Endpoints y responses

### Ejecutar Tests
```bash
# Backend
cd backend
npm test                    # Todos los tests
npm run test:watch         # Modo watch
npm run test:coverage      # Con cobertura

# Frontend
cd frontend
npm test                    # Todos los tests
npm run test:coverage      # Con cobertura
```

### Escribir Tests
```javascript
// Test de componente React
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExampleComponent from './ExampleComponent';

describe('ExampleComponent', () => {
  test('renders correctly', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('Example')).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    render(<ExampleComponent />);
    const button = screen.getByRole('button', { name: /click me/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Clicked!')).toBeInTheDocument();
    });
  });
});
```

### Cobertura Mínima Requerida
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 85%
- **Lines**: 80%

## 📚 Documentación

### Tipos de Documentación
1. **README**: Información general del proyecto
2. **API Docs**: Documentación de endpoints
3. **Architecture**: Decisiones de arquitectura
4. **Installation**: Guía de instalación
5. **Contributing**: Esta guía

### Actualizar Documentación
- Mantén la documentación actualizada con cambios de código
- Usa ejemplos claros y concisos
- Incluye capturas de pantalla cuando aplique
- Documenta breaking changes

### Comentarios en Código
```javascript
// ❌ Mal comentario
// Suma dos números
function add(a, b) {
  return a + b;
}

// ✅ Buen comentario
/**
 * Suma dos números y retorna el resultado
 * @param {number} a - Primer número
 * @param {number} b - Segundo número
 * @returns {number} Suma de a y b
 * @throws {TypeError} Si los parámetros no son números
 */
function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Ambos parámetros deben ser números');
  }
  return a + b;
}
```

## 🎯 Mejores Prácticas

### Commits
```bash
# Formato recomendado
git commit -m "feat: add user authentication system

- Implement JWT authentication
- Add login/register endpoints
- Create user model with validation
- Add password hashing with bcrypt

Closes #123"
```

### Ramas
```bash
# Convenciones de nombres
feature/nueva-funcionalidad
bugfix/arreglar-error-login
hotfix/critical-security-fix
docs/actualizar-readme
refactor/optimizacion-rendimiento
```

### Issues
- Usa templates proporcionados
- Incluye pasos para reproducir bugs
- Proporciona contexto y entorno
- Etiqueta apropiadamente

## 🏆 Reconocimientos

¡Tu contribución es valiosa! Los contribuidores serán:
- Mencionados en el README
- Agregados al archivo de contribuidores
- Reconocidos en releases
- Invitados a discusiones de roadmap

## 📞 Soporte

¿Necesitas ayuda?
- 📧 **Email**: dev@twentyonepilots.com
- 💬 **Discord**: [Servidor de contribuidores](https://discord.gg/top-dev)
- 🐛 **Issues**: Para bugs y preguntas
- 📖 **Discussions**: Para preguntas generales

---

¡Gracias por contribuir a hacer la mejor plataforma para fans de Twenty One Pilots! 🎵✨