import { WorkflowNodeData, Connection } from "../types";

// Interfaz flexible para leer la estructura
interface ImportData {
  workflow?: ImportData; // Para detectar si está anidado
  nodes?: unknown[];
  edges?: unknown[];
  connections?: unknown[];
  [key: string]: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateWorkflowImport = (data: unknown): ValidationResult => {
  // 1. Validar que sea un objeto
  if (typeof data !== "object" || data === null) {
    return { 
      isValid: false, 
      error: "El archivo no contiene un objeto JSON válido." 
    };
  }

  // Cast inicial
  let importData = data as ImportData;

  // 2. DETECCIÓN INTELIGENTE: ¿Viene envuelto en "workflow"?
  if (importData.workflow && typeof importData.workflow === 'object') {
    importData = importData.workflow as ImportData;
  }

  // 3. Ahora sí, validamos que existan los Nodos
  if (!Array.isArray(importData.nodes)) {
    return { 
      isValid: false, 
      error: "El archivo JSON no tiene la propiedad 'nodes' o no es una lista válida." 
    };
  }

  // 4. Validar Conexiones (soporta 'edges' o 'connections')
  const hasEdges = Array.isArray(importData.edges);
  const hasConnections = Array.isArray(importData.connections);

  if (!hasEdges && !hasConnections) {
    return { 
      isValid: false, 
      error: "El archivo JSON no tiene la lista de conexiones ('edges' o 'connections')." 
    };
  }

  // 5. Validar integridad de los nodos (SOLO ID y TYPE)
  const invalidNodes = importData.nodes.filter((node: unknown) => {
    if (typeof node !== "object" || node === null) return true;
    const n = node as Record<string, unknown>;
    
    // CORRECCIÓN CLAVE: Solo validamos que tenga id y type. 
    // Quitamos la obligación de x e y porque el backend no los manda.
    return !n.id || !n.type;
  });

  if (invalidNodes.length > 0) {
    return { 
      isValid: false, 
      error: `Se encontraron ${invalidNodes.length} nodos inválidos (les falta id o type).` 
    };
  }

  return { isValid: true };
};