// MonacoErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: number;
}

class MonacoErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    errorId: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: Date.now() // Force re-render with new key
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Monaco Editor Error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Auto-retry for Monaco-specific errors after a delay
    if (error.message.includes('getFullModelRange') || 
        error.message.includes('Cannot read properties of null') ||
        error.message.includes('model') ||
        error.message.includes('editor')) {
      
      // console.log('Monaco Editor error detected, auto-retrying in 1 second...');
      
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, 1000);
    }
  }

  public componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined,
      errorId: Date.now()
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Reinitializing Editor...
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                The editor is being reloaded to fix a timing issue.
              </p>
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Now
              </button>
            </div>
          </div>
        )
      );
    }

    // Use errorId as key to force complete re-mount when error occurs
    return (
      <div key={this.state.errorId}>
        {this.props.children}
      </div>
    );
  }
}

// SafeMonacoEditor.tsx
import dynamic from 'next/dynamic';
import { Suspense,  useCallback } from 'react';
import * as monaco from 'monaco-editor';

const LoadingEditor = () => (
  <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="text-gray-600 dark:text-gray-400">Loading editor...</span>
    </div>
  </div>
);

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => ({ default: mod.Editor })),
  {
    loading: LoadingEditor,
    ssr: false,
  }
);

interface SafeMonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
  onMount?: (editor: any, monaco: any) => void;
  options?: any;
  height?: string | number;
  theme?: string;
}

const SafeMonacoEditor: React.FC<SafeMonacoEditorProps> = ({
  value,
  language,
  onChange,
  onMount,
  options = {},
  height = '100%',
  theme = 'vs-dark'
}) => {
  const [isReady, setIsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const isChangingLanguage = useRef(false);

  // Handle language changes safely
  useEffect(() => {
    if (currentLanguage !== language && isReady) {
      // console.log(`Language change detected: ${currentLanguage} -> ${language}`);
      isChangingLanguage.current = true;
      setIsReady(false);
      
      // Small delay to ensure proper cleanup
      setTimeout(() => {
        setCurrentLanguage(language);
        setEditorKey(prev => prev + 1); // Force re-mount
      }, 100);
    }
  }, [language, currentLanguage, isReady]);

  const handleEditorDidMount = useCallback((editor: any, monacoInstance: any) => {
    // console.log('Editor mounted with language:', currentLanguage);
    
    editorRef.current = editor;
    
    // Wait for model to be fully ready
    const checkModel = () => {
      const model = editor.getModel();
      if (model && !model.isDisposed()) {
        modelRef.current = model;
        setIsReady(true);
        isChangingLanguage.current = false;
        
        if (onMount) {
          onMount(editor, monacoInstance);
        }
        
        // console.log('Editor fully ready');
      } else {
        // Retry after a short delay
        setTimeout(checkModel, 50);
      }
    };

    // Initial check with delay
    setTimeout(checkModel, 100);

    // Handle model changes (language switches)
    editor.onDidChangeModel(() => {
      // console.log('Model changed');
      const newModel = editor.getModel();
      if (newModel && !newModel.isDisposed()) {
        modelRef.current = newModel;
        if (!isChangingLanguage.current) {
          setIsReady(true);
        }
      }
    });

  }, [currentLanguage, onMount]);

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (isReady && !isChangingLanguage.current) {
      onChange(newValue);
    }
  }, [isReady, onChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.dispose();
        } catch (error) {
          console.error('Error disposing editor:', error);
        }
      }
    };
  }, []);

  return (
    <MonacoErrorBoundary
      onError={(error) => {
        console.error('Monaco Error Boundary caught:', error);
        setIsReady(false);
        setTimeout(() => {
          setEditorKey(prev => prev + 1);
        }, 500);
      }}
    >
      <Suspense fallback={<LoadingEditor />}>
        <div key={editorKey} className="h-full w-full">
          <MonacoEditor
            height="100%"
            language={currentLanguage}
            value={value}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={theme}
            options={{
              automaticLayout: true,
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
              wordWrap: 'on',
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
              },
              ...options,
            }}
            loading={<LoadingEditor />}
          />
          
          {!isReady && (
            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {isChangingLanguage.current ? 'Switching language...' : 'Initializing editor...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </MonacoErrorBoundary>
  );
};

// AITutorPage.tsx - Main component
import { useState, useEffect, useRef } from 'react';

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
];



export { SafeMonacoEditor, MonacoErrorBoundary };