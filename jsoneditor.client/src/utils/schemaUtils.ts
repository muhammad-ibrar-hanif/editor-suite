// src/utils/schemaUtils.ts
export interface SchemaValidationResult {
    valid: boolean;
    errors: SchemaError[];
    warnings: SchemaWarning[];
}

export interface SchemaError {
    path: string;
    message: string;
    details?: string;
}

export interface SchemaWarning {
    path: string;
    message: string;
    suggestion?: string;
}

export const validateAgainstSchema = (
    jsonData: any,
    schema: any
): SchemaValidationResult => {
    const errors: SchemaError[] = [];
    const warnings: SchemaWarning[] = [];

    try {
        // Basic required fields validation
        if (schema.required && Array.isArray(schema.required)) {
            schema.required.forEach((field: string) => {
                if (!(field in jsonData)) {
                    errors.push({
                        path: field,
                        message: `Missing required field: ${field}`
                    });
                }
            });
        }

        // Type validation
        if (schema.properties) {
            Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
                if (jsonData[key] !== undefined) {
                    // Type checking
                    if (propSchema.type && typeof jsonData[key] !== propSchema.type) {
                        errors.push({
                            path: key,
                            message: `Invalid type for ${key}. Expected ${propSchema.type}, got ${typeof jsonData[key]}`,
                            details: `Value: ${JSON.stringify(jsonData[key])}`
                        });
                    }

                    // Enum validation
                    if (propSchema.enum && !propSchema.enum.includes(jsonData[key])) {
                        errors.push({
                            path: key,
                            message: `Invalid value for ${key}. Must be one of: ${propSchema.enum.join(', ')}`,
                            details: `Got: ${JSON.stringify(jsonData[key])}`
                        });
                    }

                    // String format validation
                    if (propSchema.format === 'email' && jsonData[key]) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(jsonData[key])) {
                            warnings.push({
                                path: key,
                                message: `Field ${key} should be a valid email address`,
                                suggestion: 'Check the email format'
                            });
                        }
                    }

                    // Minimum/Maximum validation for numbers
                    if (propSchema.type === 'number' || propSchema.type === 'integer') {
                        if (propSchema.minimum !== undefined && jsonData[key] < propSchema.minimum) {
                            errors.push({
                                path: key,
                                message: `Value for ${key} must be at least ${propSchema.minimum}`,
                                details: `Got: ${jsonData[key]}`
                            });
                        }
                        if (propSchema.maximum !== undefined && jsonData[key] > propSchema.maximum) {
                            errors.push({
                                path: key,
                                message: `Value for ${key} must be at most ${propSchema.maximum}`,
                                details: `Got: ${jsonData[key]}`
                            });
                        }
                    }

                    // String length validation
                    if (propSchema.type === 'string') {
                        if (propSchema.minLength !== undefined && jsonData[key].length < propSchema.minLength) {
                            warnings.push({
                                path: key,
                                message: `String ${key} is shorter than minimum length ${propSchema.minLength}`,
                                suggestion: `Current length: ${jsonData[key].length}`
                            });
                        }
                        if (propSchema.maxLength !== undefined && jsonData[key].length > propSchema.maxLength) {
                            warnings.push({
                                path: key,
                                message: `String ${key} is longer than maximum length ${propSchema.maxLength}`,
                                suggestion: `Current length: ${jsonData[key].length}`
                            });
                        }
                    }
                }
            });
        }

        // Array validation
        if (schema.type === 'array' && schema.items) {
            if (Array.isArray(jsonData)) {
                jsonData.forEach((item, index) => {
                    const itemResult = validateAgainstSchema(item, schema.items);
                    itemResult.errors.forEach(error =>
                        errors.push({ ...error, path: `[${index}].${error.path}` })
                    );
                    itemResult.warnings.forEach(warning =>
                        warnings.push({ ...warning, path: `[${index}].${warning.path}` })
                    );
                });
            }
        }

    } catch (error) {
        errors.push({
            path: '',
            message: 'Schema validation error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
};

// Common JSON Schemas
export const commonSchemas = {
    userProfile: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["name", "email"],
        "properties": {
            "name": { "type": "string", "minLength": 1 },
            "email": { "type": "string", "format": "email" },
            "age": { "type": "integer", "minimum": 0, "maximum": 150 },
            "active": { "type": "boolean" },
            "preferences": {
                "type": "object",
                "properties": {
                    "theme": { "type": "string", "enum": ["light", "dark", "auto"] },
                    "notifications": { "type": "boolean" }
                }
            }
        }
    },
    apiResponse: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["status", "data"],
        "properties": {
            "status": { "type": "string", "enum": ["success", "error"] },
            "data": { "type": "object" },
            "message": { "type": "string" },
            "code": { "type": "integer" }
        }
    },
    product: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["id", "name", "price"],
        "properties": {
            "id": { "type": "string" },
            "name": { "type": "string", "minLength": 1 },
            "description": { "type": "string" },
            "price": { "type": "number", "minimum": 0 },
            "inStock": { "type": "boolean" },
            "tags": {
                "type": "array",
                "items": { "type": "string" }
            }
        }
    }
};