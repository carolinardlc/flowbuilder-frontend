# FlowBuilder Frontend – MiniFlow

Frontend del sistema **MiniFlow**, una aplicación web para crear, gestionar y visualizar **workflows** mediante un **diseñador visual tipo canvas**, inspirada en herramientas como n8n, con un enfoque académico y modular.

Este repositorio corresponde únicamente al **Frontend**, desarrollado con **Next.js**, y se comunica (o se comunicará) con un backend independiente.

---

## Descripción general

El sistema permite:

- Crear y administrar workflows (nombre, descripción y estado).
- Visualizar workflows en una vista de canvas con nodos interconectados.
- Configurar nodos por tipo (HTTP, Command, Condicional, etc.).
- Validar flujos antes de su ejecución.
- Importar y exportar workflows en formato JSON.
- Mantener un diseño visual claro y consistente.

---

## Tecnologías utilizadas

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Context API para manejo de estado global
- Canvas para diagramación de nodos
- LocalStorage para persistencia temporal

---

## Requisitos previos

Antes de iniciar, asegúrate de tener instalado:

### Node.js
Descargar desde:
https://nodejs.org/es/download

Instalar la versión LTS recomendada.

Verificar instalación:
```bash
node -v
npm -v
