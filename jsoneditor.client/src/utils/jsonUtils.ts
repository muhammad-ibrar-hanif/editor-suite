export const validateJson = (str: string): boolean => {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
};

export const formatJson = (str: string): string => {
    try {
        const obj = JSON.parse(str);
        return JSON.stringify(obj, null, 2);
    } catch {
        return str;
    }
};

export const minifyJson = (str: string): string => {
    try {
        const obj = JSON.parse(str);
        return JSON.stringify(obj);
    } catch {
        return str;
    }
};

export const removeWhitespace = (str: string): string => {
    return str.replace(/\s+/g, "");
};

// src/utils/jsonUtils.ts
export interface JsonValidationResult {
    valid: boolean;
    message?: string;
    line?: number;
    column?: number;
}

export const validateJsonDetailed = (jsonText: string): JsonValidationResult => {
    try {
        JSON.parse(jsonText);
        return { valid: true };
    } catch (err: any) {
        const message = err.message || "Invalid JSON";
        const match = message.match(/at position (\d+)/);
        let line: number | undefined;
        let column: number | undefined;

        if (match && match[1]) {
            const pos = parseInt(match[1], 10);
            const linesUntilError = jsonText.substring(0, pos).split("\n");
            line = linesUntilError.length;
            column = linesUntilError[linesUntilError.length - 1].length + 1;
        }

        return {
            valid: false,
            message,
            line,
            column,
        };
    }
};

// src/utils/jsonUtils.ts - Add these functions

// ... existing code ...

export const downloadJsonFile = (json: string, filename: string = 'data.json') => {
    try {
        // Validate JSON first
        JSON.parse(json);

        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch {
        return false;
    }
};

export const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
};

export const fetchJsonFromUrl = async (url: string): Promise<{ success: boolean; data?: string; error?: string }> => {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP Error: ${response.status} ${response.statusText}`
            };
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return {
                success: false,
                error: 'Response is not JSON. Content-Type should be application/json'
            };
        }

        const data = await response.text();

        // Validate it's proper JSON
        JSON.parse(data);

        return {
            success: true,
            data
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to fetch JSON from URL'
        };
    }
};

export const generateFilename = (): string => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `json-${dateStr}-${timeStr}.json`;
};