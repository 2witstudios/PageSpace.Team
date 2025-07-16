import React from 'react';
import EditorCanvas from './EditorCanvas';
import UndoRedoTestComponent from './UndoRedoTestComponent';

const EditorDemo: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-gray-100 dark:bg-gray-900">
        <UndoRedoTestComponent />
      </div>
      <div className="flex-1 p-4">
        <div className="h-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <EditorCanvas height={600} width={800} />
        </div>
      </div>
    </div>
  );
};

export default EditorDemo;