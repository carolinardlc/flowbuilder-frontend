# Workflow Canvas

Un canvas interactivo para crear y gestionar workflows visuales con nodos conectables.

## 📁 Estructura del Proyecto

```
canvas/
├── types/
│   └── index.ts              # Tipos centralizados del sistema
├── constants/
│   ├── nodeTypes.ts          # Constantes de tipos de nodos
│   └── storage.ts            # Constantes de almacenamiento y configuración
├── hooks/
│   ├── useCanvasState.ts     # Manejo del estado principal
│   ├── useLocalStorage.ts    # Persistencia en localStorage
│   ├── useDragAndDrop.ts     # Lógica de drag and drop
│   └── useConnections.ts     # Manejo de conexiones entre nodos
├── utils/
│   └── nodeUtils.ts          # Utilidades para manejo de nodos
├── components/
│   ├── Canvas.tsx            # Componente principal del canvas
│   ├── WorkflowNode.tsx      # Componente visual de nodos
│   ├── WorkflowConnection.tsx # Componente de conexiones SVG
│   └── NodeConfigPanel.tsx   # Panel de configuración de nodos
└── README.md                 # Esta documentación
```

## 🎯 Arquitectura

### Principios de Diseño

1. **Separación de Responsabilidades**: Cada hook y componente tiene una única responsabilidad
2. **Tipado Fuerte**: Todos los datos están tipados con TypeScript
3. **Estado Centralizado**: El estado principal se maneja en hooks dedicados
4. **Reutilización**: Lógica compartida en hooks y utilidades

### Flujo de Datos

```
Canvas (Principal)
    ↓
useCanvasState (Estado)
    ↓
useDragAndDrop (Interacciones)
    ↓
useConnections (Conexiones)
    ↓
useLocalStorage (Persistencia)
```

## 🔧 Componentes Principales

### Canvas.tsx
Componente principal que orquesta toda la funcionalidad:
- Renderiza los tres paneles (izquierdo, central, derecho)
- Integra todos los hooks personalizados
- Maneja el flujo de interacción principal

### WorkflowNode.tsx
Representación visual de un nodo individual:
- Renderiza el botón del nodo con estilos específicos
- Maneja eventos de click y drag
- Muestra indicadores visuales de estado

### NodeConfigPanel.tsx
Modal para configurar propiedades de nodos:
- Campos dinámicos según tipo de nodo
- Validación y guardado de configuración
- UI inspirada en n8n

## 🎨 Tipos de Nodos

### START
- **Propósito**: Punto de inicio del workflow
- **Configuración**: Solo título (configuración minimalista)

### ACTION
- **Propósito**: Ejecutar acciones específicas
- **Configuración**: 
  - Tipo de acción (HTTP Request, Email, etc.)
  - URL, método, body para HTTP

### CONDITIONAL
- **Propósito**: Bifurcar el flujo basado en condiciones
- **Configuración**: Tipo de condición y reglas

### END
- **Propósito**: Punto final del workflow
- **Configuración**: Tipo de salida y mensaje

## 🔌 Hooks Personalizados

### useCanvasState
Maneja el estado principal del canvas:
- Nodos y conexiones
- Nodo seleccionado
- Panel de configuración
- Estado de drag

### useDragAndDrop
Controla todas las interacciones de drag and drop:
- Arrastrar nodos existentes
- Crear nuevos nodos desde paleta
- Actualizar posiciones

### useConnections
Gestiona las conexiones entre nodos:
- Iniciar conexiones
- Completar conexiones
- Validar duplicados

### useLocalStorage
Maneja la persistencia de datos:
- Guardar estado en localStorage
- Cargar estado al iniciar
- Manejar errores

## 🎯 Constantes

### NODE_TYPES
Define las propiedades de cada tipo de nodo:
- Colores y estilos
- Iconos y etiquetas
- Descripciones

### CANVAS_CONFIG
Configuración del canvas:
- Dimensiones
- Offsets para conexiones
- Tamaños de nodos

## 🛠️ Utilidades

### nodeUtils.ts
Funciones helper para manejo de nodos:
- Crear nuevos nodos
- Validar conexiones
- Calcular IDs
- Encontrar nodos

## 📝 Mejores Prácticas

1. **Mantener los hooks pequeños y enfocados**
2. **Usar tipos TypeScript para todo**
3. **Documentar funciones complejas**
4. **Separar lógica de presentación**
5. **Manejar errores gracefulmente**

## 🚀 Extensión

Para añadir un nuevo tipo de nodo:

1. Agregar a `NODE_TYPES` en `constants/nodeTypes.ts`
2. Actualizar tipos en `types/index.ts`
3. Añadir configuración en `NodeConfigPanel.tsx`
4. Agregar estilos CSS si es necesario

## 🐛 Depuración

El sistema incluye logs en puntos clave:
- Carga/guardado de localStorage
- Creación/actualización de nodos
- Inicio/completado de conexiones
- Configuración de nodos

Usa estos logs para seguir el flujo de datos y detectar problemas.
