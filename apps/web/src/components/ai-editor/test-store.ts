// Simple test file to verify store types
import { useEditorStore } from './store';

// This should not have any TypeScript errors if our store is correctly typed
export const testStoreTypes = () => {
  const store = useEditorStore.getState();
  
  // Test that all required properties exist
  const canUndoExists: boolean = store.canUndo();
  const canRedoExists: boolean = store.canRedo();
  
  console.log('canUndo:', canUndoExists);
  console.log('canRedo:', canRedoExists);
  
  // Test that undo/redo functions exist
  store.undo();
  store.redo();
  
  return true;
};