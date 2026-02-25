import { describe, it, expect } from 'vitest'; 
import { renderHook, act } from '@testing-library/react';
import { useCanvasState } from '../useCanvasState';

describe('useCanvasState - Historial (RNF-B02)', () => {
  it('debe iniciar sin historial disponible', () => {
    const { result } = renderHook(() => useCanvasState());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('debe permitir deshacer (undo) después de un cambio', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.takeSnapshot(); // Guarda estado vacío
      result.current.setNodes([{ id: 'node-1', type: 'START', title: 'Inicio', x: 0, y: 0, config: {} }]);
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.nodes).toHaveLength(1);

    act(() => {
      result.current.undo(); // Deshace el cambio
    });

    expect(result.current.nodes).toHaveLength(0);
    expect(result.current.canRedo).toBe(true);
  });

  it('debe permitir rehacer (redo) después de deshacer', () => {
    const { result } = renderHook(() => useCanvasState());

    act(() => {
      result.current.takeSnapshot();
      result.current.setNodes([{ id: 'node-1', type: 'START', title: 'Inicio', x: 0, y: 0, config: {} }]);
    });

    act(() => { result.current.undo(); });
    expect(result.current.nodes).toHaveLength(0);

    act(() => { result.current.redo(); });
    expect(result.current.nodes).toHaveLength(1); // Recupera el nodo
  });
});