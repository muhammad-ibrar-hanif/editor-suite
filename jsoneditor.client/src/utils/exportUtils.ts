// src/utils/exportUtils.ts - UPDATED
import { formatJson } from './jsonUtils';

export const convertToYaml = (json: string): string => {
    try {
        const obj = JSON.parse(json);
        return convertObjectToYaml(obj);
    } catch (error) {
        console.error('YAML conversion error:', error);
        return '# Invalid JSON - cannot convert to YAML\n# Error: ' + (error as Error).message;
    }
};

const convertObjectToYaml = (obj: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);

    if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`;
    if (typeof obj === 'number') return obj.toString();
    if (typeof obj === 'boolean') return obj.toString();
    if (obj === null) return 'null';

    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj.map(item =>
            `${spaces}- ${convertObjectToYaml(item, indent + 1)}`
        ).join('\n');
    }

    if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        if (entries.length === 0) return '{}';

        return entries.map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return `${spaces}${key}:\n${convertObjectToYaml(value, indent + 1)}`;
            } else {
                return `${spaces}${key}: ${convertObjectToYaml(value, indent + 1)}`;
            }
        }).join('\n');
    }

    return String(obj);
};

export const convertToXml = (json: string): string => {
    try {
        const obj = JSON.parse(json);
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + convertObjectToXml(obj, 'root');
    } catch (error) {
        console.error('XML conversion error:', error);
        return '<!-- Invalid JSON - cannot convert to XML -->\n<!-- Error: ' + (error as Error).message + ' -->';
    }
};

const convertObjectToXml = (obj: any, tagName: string): string => {
    if (typeof obj === 'string') return `<${tagName}>${escapeXml(obj)}</${tagName}>`;
    if (typeof obj === 'number') return `<${tagName}>${obj}</${tagName}>`;
    if (typeof obj === 'boolean') return `<${tagName}>${obj}</${tagName}>`;
    if (obj === null) return `<${tagName} />`;

    if (Array.isArray(obj)) {
        const itemTag = tagName.endsWith('s') ? tagName.slice(0, -1) : 'item';
        return obj.map(item =>
            convertObjectToXml(item, itemTag)
        ).join('\n');
    }

    if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        const children = entries.map(([key, value]) =>
            convertObjectToXml(value, sanitizeXmlTag(key))
        ).join('\n');
        return `<${sanitizeXmlTag(tagName)}>\n${indentXml(children)}\n</${sanitizeXmlTag(tagName)}>`;
    }

    return `<${sanitizeXmlTag(tagName)}>${obj}</${sanitizeXmlTag(tagName)}>`;
};

const sanitizeXmlTag = (tag: string): string => {
    // Replace invalid XML tag characters
    return tag.replace(/[^a-zA-Z0-9_-]/g, '_');
};

const indentXml = (xml: string): string => {
    return xml.split('\n').map(line => '  ' + line).join('\n');
};

const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

export const convertToCsv = (json: string): string => {
    try {
        const obj = JSON.parse(json);

        if (Array.isArray(obj)) {
            if (obj.length === 0) return '# Empty array - no data to export';

            // Extract headers from all objects
            const headers = Array.from(new Set(obj.flatMap(item => Object.keys(item))));
            if (headers.length === 0) return '# No data found in array';

            const csvRows = [
                headers.join(','),
                ...obj.map(row =>
                    headers.map(header => {
                        const value = row[header];
                        const str = String(value ?? '');
                        // Escape quotes and wrap in quotes if contains comma, quotes, or newline
                        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                            return `"${str.replace(/"/g, '""')}"`;
                        }
                        return str;
                    }).join(',')
                )
            ];

            return csvRows.join('\n');
        }

        return '# CSV export only supports arrays of objects\n# Current data is: ' + (typeof obj);
    } catch (error) {
        console.error('CSV conversion error:', error);
        return '# Invalid JSON - cannot convert to CSV\n# Error: ' + (error as Error).message;
    }
};

export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
    try {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('Download initiated:', filename); // Debug
    } catch (error) {
        console.error('Download error:', error);
        alert('Download failed: ' + (error as Error).message);
    }
};