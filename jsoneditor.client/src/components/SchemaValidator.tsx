// src/components/SchemaValidator.tsx
import React, { useState } from 'react';
import { SchemaValidationResult, commonSchemas, validateAgainstSchema } from '../utils/schemaUtils';

interface SchemaValidatorProps {
    jsonData: any;
    onValidationResult: (result: SchemaValidationResult) => void;
}

const SchemaValidator: React.FC<SchemaValidatorProps> = ({ jsonData, onValidationResult }) => {
    const [selectedSchema, setSelectedSchema] = useState<string>('');
    const [customSchema, setCustomSchema] = useState<string>('');
    const [isCustomSchema, setIsCustomSchema] = useState(false);

    const handleValidate = () => {
        let schema: any;

        try {
            if (isCustomSchema) {
                schema = JSON.parse(customSchema);
            } else {
                schema = commonSchemas[selectedSchema as keyof typeof commonSchemas];
            }

            if (!schema) {
                onValidationResult({
                    valid: false,
                    errors: [{ path: '', message: 'No schema selected' }],
                    warnings: []
                });
                return;
            }

            const result = validateAgainstSchema(jsonData, schema);
            onValidationResult(result);
        } catch (error) {
            onValidationResult({
                valid: false,
                errors: [{
                    path: '',
                    message: 'Invalid schema',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }],
                warnings: []
            });
        }
    };

    const handleSchemaTypeChange = (useCustom: boolean) => {
        setIsCustomSchema(useCustom);
        if (!useCustom) {
            setCustomSchema('');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                📋 JSON Schema Validation
            </h3>

            <div className="space-y-3">
                {/* Schema Type Selection */}
                <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={!isCustomSchema}
                            onChange={() => handleSchemaTypeChange(false)}
                            className="text-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Common Schemas</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={isCustomSchema}
                            onChange={() => handleSchemaTypeChange(true)}
                            className="text-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Custom Schema</span>
                    </label>
                </div>

                {!isCustomSchema ? (
                    <select
                        value={selectedSchema}
                        onChange={(e) => setSelectedSchema(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">Select a schema...</option>
                        <option value="userProfile">User Profile</option>
                        <option value="apiResponse">API Response</option>
                        <option value="product">Product</option>
                    </select>
                ) : (
                    <textarea
                        value={customSchema}
                        onChange={(e) => setCustomSchema(e.target.value)}
                        placeholder="Paste your JSON Schema here..."
                        className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                    />
                )}

                <button
                    onClick={handleValidate}
                    disabled={(!selectedSchema && !customSchema.trim()) || !jsonData}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded transition-colors"
                >
                    Validate Against Schema
                </button>
            </div>
        </div>
    );
};

export default SchemaValidator;