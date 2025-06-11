interface TestResult {
    id: string
    description: string
    passed: boolean
    expected: any
    actual: any
    error?: string
  }
  
  interface TestRunnerProps {
    results: {
      results: TestResult[]
      allPassed: boolean
    }
  }
  
  export default function TestRunner({ results }: TestRunnerProps) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            results.allPassed 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {results.results.filter(r => r.passed).length} / {results.results.length} Passed
          </span>
        </div>
  
        <div className="space-y-3">
          {results.results.map((result) => (
            <div
              key={result.id}
              className={`p-3 rounded-md border ${
                result.passed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {result.description}
                  </p>
                  {!result.passed && (
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600">
                        Expected: <code className="bg-gray-100 px-1 rounded">{JSON.stringify(result.expected)}</code>
                      </p>
                      <p className="text-gray-600">
                        Actual: <code className="bg-gray-100 px-1 rounded">{JSON.stringify(result.actual)}</code>
                      </p>
                      {result.error && (
                        <p className="text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  result.passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.passed ? '✓' : '✗'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }