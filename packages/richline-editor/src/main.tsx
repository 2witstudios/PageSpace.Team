import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import RichlineEditor, { RichlineEditorRef } from './RichlineEditor';
import { LinesInput, linesToStrings } from './types';
import { initializeWasm } from './rust-bridge';
import './RichlineEditor.css';

const App = () => {
  const [lines, setLines] = useState<string[]>([
    'Welcome to the Richline Editor!',
    '',
    'This is a test environment where you can interact with the component.',
    'Try typing, using the Enter and Backspace keys, and see how the lines wrap automatically after 80 characters. This sentence is long enough to demonstrate the automatic hard wrapping feature if you add a bit more text to it.',
  ]);
  const editorRef = useRef<RichlineEditorRef>(null);
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    initializeWasm().then(() => {
      setWasmReady(true);
    });
  }, []);

  const handleChange = useCallback((newLines: LinesInput) => {
    setLines(linesToStrings(newLines));
  }, []);

  const handleReplace = () => {
    editorRef.current?.replaceLines(0, 0, ['This line was replaced programmatically.']);
  };

  if (!wasmReady) {
    return <div>Loading WebAssembly module...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Richline Editor Test Page</h1>
      <p>
        This is a simple host application to test the `richline-editor` component.
      </p>
      <div style={{ margin: '2rem 0' }}>
        <RichlineEditor
          ref={editorRef}
          lines={lines}
          onChange={handleChange}
        />
      </div>
      <button onClick={handleReplace}>Replace First Line</button>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);