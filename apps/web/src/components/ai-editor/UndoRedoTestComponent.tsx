import React from 'react';
import { useEditorStore } from './store';

const UndoRedoTestComponent: React.FC = () => {
  const { 
    lines, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    updateLine, 
    insertLine, 
    splitLine,
    past,
    future
  } = useEditorStore();

  const handleTestEdit = () => {
    updateLine(0, `Updated at ${new Date().toLocaleTimeString()}`);
  };

  const handleAddLine = () => {
    insertLine(lines.length, `New line ${lines.length + 1}`, 'human');
  };

  const handleSplitFirstLine = () => {
    if (lines[0] && lines[0].text.length > 5) {
      splitLine(0, 5);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4">Undo/Redo Test Controls</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleTestEdit}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit First Line
        </button>
        <button
          onClick={handleAddLine}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Line
        </button>
        <button
          onClick={handleSplitFirstLine}
          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Split First Line
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={`px-3 py-1 rounded ${
            canUndo() 
              ? 'bg-gray-500 text-white hover:bg-gray-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Undo (Ctrl+Z)
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={`px-3 py-1 rounded ${
            canRedo() 
              ? 'bg-gray-500 text-white hover:bg-gray-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Redo (Ctrl+Y)
        </button>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>History: {past.length} states in past, {future.length} states in future</p>
        <p>Current lines: {lines.length}</p>
        <p>Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y or Ctrl+Shift+Z (redo)</p>
      </div>
    </div>
  );
};

export default UndoRedoTestComponent;