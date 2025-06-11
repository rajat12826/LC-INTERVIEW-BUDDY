'use client'
import { Sandpack } from '@codesandbox/sandpack-react'
import { dracula } from '@codesandbox/sandpack-themes'

interface SimpleCodeEditorProps {
  defaultCode?: string
  height?: string
  className?: string
  challengeFiles?: {
    [key: string]: {
      code: string
      active?: boolean
      readOnly?: boolean
    }
  }
}

export default function SimpleCodeEditor({
  defaultCode = '',
  height = '600px',
  className = '',
  challengeFiles
}: SimpleCodeEditorProps) {
  
  // Default files structure for challenges
  const defaultFiles = {
    '/App.jsx': {
      code: defaultCode || `import React from 'react';
import useClickOutside from './useClickOutside';

function App() {
  return (
    <div className="App">
      <h1>Frontend Challenge</h1>
      <p>Complete the useClickOutside hook!</p>
    </div>
  );
}

export default App;`,
      active: false
    },
    '/useClickOutside.js': {
      code: `import { useEffect } from "react";

const useClickOutside = (ref, callback) => {
  // TODO: Implement the useClickOutside hook
  // This hook should call the callback when user clicks outside the referenced element
  
};

export default useClickOutside;`,
      active: true // Make this the active file
    },
    '/index.js': {
      code: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      readOnly: true
    },
    '/styles.css': {
      code: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.App {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1rem;
}

p {
  color: #666;
  line-height: 1.6;
}`,
      readOnly: true
    }
  }

  // Use provided challenge files or default files
  const files = challengeFiles || defaultFiles

  return (
    <div className={`w-full ${className}`}>
      <Sandpack
        template="react"
        theme={dracula}
        files={files}
        options={{
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: height,
          layout: 'preview', // Shows preview alongside editor
          showTabs: true,
          closableTabs: false,
          showNavigator: false,
          showRefreshButton: true,
        //   showOpenInCodeSandbox: false,
          autoReload: true,
          recompileMode: 'delayed',
          recompileDelay: 300
        }}
        customSetup={{
          dependencies: {
            "react": "^18.0.0",
            "react-dom": "^18.0.0"
          }
        }}
      />
    </div>
  )
}
