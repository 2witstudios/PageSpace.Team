import React from 'react';
import EditorCanvas from '@/components/ai-editor/EditorCanvas';

const NoteView = () => {
  return (
    <div className="flex-1 p-4">
      <div className="h-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
        <EditorCanvas height={800} width={1000} />
      </div>
    </div>
  );
};

export default NoteView;