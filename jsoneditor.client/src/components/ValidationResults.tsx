// src/components/ValidationResults.tsx
import React from 'react';
import { SchemaValidationResult } from '../utils/schemaUtils';

interface ValidationResultsProps {
    result: SchemaValidationResult | null;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ result }) => {
    if (!result) return null;

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                Validation Results
                <span className={`ml-2 text-sm px-2 py-1 rounded ${result.valid
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                    {result.valid ? 'VALID' : 'INVALID'}
                </span>
            </h3>

            {/* Errors */}
            {result.errors.length > 0 && (
                <div className="mb-4">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">
                        ❌ Errors ({result.errors.length})
                    </h4>
                    <div className="space-y-2">
                        {result.errors.map((error, index) => (
                            <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                <div className="font-mono text-sm text-red-800 dark:text-red-200">
                                    {error.path ? `Path: ${error.path}` : 'Root'}
                                </div>
                                <div className="text-red-700 dark:text-red-300">{error.message}</div>
                                {error.details && (
                                    <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        Details: {error.details}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
                <div>
                    <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                        ⚠️ Warnings ({result.warnings.length})
                    </h4>
                    <div className="space-y-2">
                        {result.warnings.map((warning, index) => (
                            <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                                <div className="font-mono text-sm text-yellow-800 dark:text-yellow-200">
                                    {warning.path ? `Path: ${warning.path}` : 'Root'}
                                </div>
                                <div className="text-yellow-700 dark:text-yellow-300">{warning.message}</div>
                                {warning.suggestion && (
                                    <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                        Suggestion: {warning.suggestion}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Issues */}
            {result.valid && result.errors.length === 0 && result.warnings.length === 0 && (
                <div className="text-green-600 dark:text-green-400 text-center py-4">
                    ✅ JSON validates successfully against the schema!
                </div>
            )}
        </div>
    );
};

export default ValidationResults;