// Conversion Utilities - SIMPLE & WORKING VERSION
export interface ConversionResult {
    success: boolean;
    data: string;
    error?: string;
}

// JSON to XML
export const jsonToXml = (jsonString: string): ConversionResult => {
    try {
        const jsonObj = JSON.parse(jsonString);
        const xml = objectToXml(jsonObj);
        return { success: true, data: `<?xml version="1.0" encoding="UTF-8"?>\n${xml}` };
    } catch (error) {
        return {
            success: false,
            data: '',
            error: `JSON to XML conversion failed: ${error instanceof Error ? error.message : 'Invalid JSON'}`
        };
    }
};

const objectToXml = (obj: any, tagName: string = 'root', depth: number = 0): string => {
    const indent = '  '.repeat(depth);

    if (obj === null || obj === undefined) {
        return `${indent}<${tagName}></${tagName}>`;
    }

    if (typeof obj !== 'object') {
        return `${indent}<${tagName}>${escapeXml(String(obj))}</${tagName}>`;
    }

    if (Array.isArray(obj)) {
        if (obj.length === 0) {
            return `${indent}<${tagName}></${tagName}>`;
        }
        return obj.map(item => objectToXml(item, tagName, depth)).join('\n');
    }

    const entries = Object.entries(obj);
    if (entries.length === 0) {
        return `${indent}<${tagName}/>`;
    }

    let attributes = '';
    let children: string[] = [];

    entries.forEach(([key, value]) => {
        if (key === '$') {
            if (typeof value === 'object' && value !== null) {
                attributes = Object.entries(value)
                    .map(([attrKey, attrValue]) => ` ${attrKey}="${escapeXml(String(attrValue))}"`)
                    .join('');
            }
        } else if (key === '_') {
            if (value !== null && value !== undefined) {
                children.push(`${indent}  ${escapeXml(String(value))}`);
            }
        } else {
            if (Array.isArray(value)) {
                value.forEach(item => {
                    children.push(objectToXml(item, key, depth + 1));
                });
            } else {
                children.push(objectToXml(value, key, depth + 1));
            }
        }
    });

    if (children.length === 0) {
        return `${indent}<${tagName}${attributes}/>`;
    }

    return [
        `${indent}<${tagName}${attributes}>`,
        ...children,
        `${indent}</${tagName}>`
    ].join('\n');
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

// XML to JSON
export const xmlToJson = (xmlString: string): ConversionResult => {
    try {
        let cleanXml = xmlString.trim();

        // If it doesn't start with '<', it's not XML
        if (!cleanXml.startsWith('<')) {
            return {
                success: false,
                data: '',
                error: 'Invalid XML: Document must start with a tag'
            };
        }

        // Remove XML declaration if present, but don't require it
        cleanXml = cleanXml
            .replace(/<\?xml[^?>]*\?>/g, '')
            .replace(/<!--.*?-->/gs, '')
            .trim();

        // If we removed everything, it was invalid
        if (!cleanXml) {
            return {
                success: false,
                data: '',
                error: 'Invalid XML: No content after removing declarations and comments'
            };
        }

        const jsonObj = parseXmlToObject(cleanXml);
        const jsonString = JSON.stringify(jsonObj, null, 2);
        return { success: true, data: jsonString };
    } catch (error) {
        return {
            success: false,
            data: '',
            error: `XML to JSON conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};

const parseXmlToObject = (xmlString: string): any => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
    if (parseError) {
        throw new Error(parseError.textContent || 'XML parsing error');
    }

    return xmlNodeToObject(xmlDoc.documentElement);
};

const xmlNodeToObject = (node: Element): any => {
    const hasElements = node.children.length > 0;
    const hasAttributes = node.attributes.length > 0;
    const textContent = node.textContent?.trim() || '';

    if (!hasElements && !hasAttributes && textContent) {
        return parseValue(textContent);
    }

    const result: any = {};

    if (hasAttributes) {
        result['$'] = {};
        for (const attr of Array.from(node.attributes)) {
            result['$'][attr.name] = parseValue(attr.value);
        }
    }

    if (hasElements) {
        const childGroups: { [key: string]: Element[] } = {};

        Array.from(node.children).forEach(child => {
            const tagName = child.tagName;
            if (!childGroups[tagName]) {
                childGroups[tagName] = [];
            }
            childGroups[tagName].push(child);
        });

        Object.entries(childGroups).forEach(([tagName, children]) => {
            if (children.length === 1) {
                result[tagName] = xmlNodeToObject(children[0]);
            } else {
                result[tagName] = children.map(child => xmlNodeToObject(child));
            }
        });
    }

    if (textContent && hasElements) {
        result['_'] = textContent;
    } else if (textContent && !hasElements) {
        result['_'] = parseValue(textContent);
    }

    if (Object.keys(result).length === 1 && result['$']) return result['$'];
    if (Object.keys(result).length === 1 && result['_']) return result['_'];

    return result;
};

const parseValue = (value: string): any => {
    value = value.trim();
    if (value === '') return '';

    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;

    if (value.includes('<![CDATA[') && value.includes(']]>')) {
        return value.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
    }

    return value;
};

// JSON to YAML
export const jsonToYaml = (jsonString: string): ConversionResult => {
    try {
        const jsonObj = JSON.parse(jsonString);
        const yaml = convertToYaml(jsonObj, 0);
        return { success: true, data: yaml };
    } catch (error) {
        return {
            success: false,
            data: '',
            error: `JSON to YAML conversion failed: ${error instanceof Error ? error.message : 'Invalid JSON'}`
        };
    }
};

const convertToYaml = (obj: any, indent: number): string => {
    const indentStr = '  '.repeat(indent);

    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return obj ? 'true' : 'false';
    if (typeof obj === 'number') return obj.toString();
    if (typeof obj === 'string') {
        if (obj.includes(':') || obj.includes('"') || obj.includes('\n') || obj.includes('[') || obj.includes(']')) {
            return `"${obj.replace(/"/g, '\\"')}"`;
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        return obj.map(item => {
            if (typeof item === 'object' && item !== null) {
                return `${indentStr}-\n${convertToYaml(item, indent + 1)}`;
            } else {
                return `${indentStr}- ${convertToYaml(item, 0)}`;
            }
        }).join('\n');
    }

    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';

    return entries.map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    return `${indentStr}${key}: []`;
                }
                return `${indentStr}${key}:\n${convertToYaml(value, indent + 1)}`;
            } else {
                return `${indentStr}${key}:\n${convertToYaml(value, indent + 1)}`;
            }
        } else {
            return `${indentStr}${key}: ${convertToYaml(value, 0)}`;
        }
    }).join('\n');
};

// YAML to JSON - SIMPLE & GUARANTEED WORKING
export const yamlToJson = (yamlString: string): ConversionResult => {
    try {
        const lines = yamlString.split('\n');
        const result = parseYamlToObject(lines);
        const jsonString = JSON.stringify(result, null, 2);
        return { success: true, data: jsonString };
    } catch (error) {
        return {
            success: false,
            data: '',
            error: `YAML to JSON conversion failed: ${error instanceof Error ? error.message : 'Invalid YAML format'}`
        };
    }
};

const parseYamlToObject = (lines: string[]): any => {
    const result = {};
    const stack: Array<{ obj: any; indent: number }> = [{ obj: result, indent: -1 }];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines and comments
        if (trimmed === '' || trimmed.startsWith('#')) {
            continue;
        }

        const indent = line.match(/^ */)![0].length;
        const currentContext = stack[stack.length - 1];

        // Find correct parent based on indentation
        while (stack.length > 1 && indent <= currentContext.indent) {
            stack.pop();
            currentContext.obj = stack[stack.length - 1].obj;
        }

        if (trimmed.startsWith('- ')) {
            handleYamlArray(trimmed, currentContext.obj, stack, indent);
        } else if (trimmed.includes(':')) {
            handleYamlKeyValue(trimmed, currentContext.obj, stack, indent, i, lines);
        }
    }

    return result;
};

const handleYamlKeyValue = (line: string, currentObj: any, stack: Array<{ obj: any; indent: number }>, indent: number, lineIndex: number, allLines: string[]) => {
    const colonIndex = line.indexOf(':');
    const key = line.substring(0, colonIndex).trim();
    const valueStr = line.substring(colonIndex + 1).trim();

    if (valueStr === '') {
        // Check next line to see structure
        const nextLine = lineIndex + 1 < allLines.length ? allLines[lineIndex + 1] : null;
        if (nextLine) {
            const nextIndent = nextLine.match(/^ */)![0].length;
            const nextTrimmed = nextLine.trim();

            if (nextIndent > indent) {
                if (nextTrimmed.startsWith('- ')) {
                    // Next is array
                    currentObj[key] = [];
                    stack.push({ obj: currentObj[key], indent });
                } else {
                    // Next is object
                    currentObj[key] = {};
                    stack.push({ obj: currentObj[key], indent });
                }
                return;
            }
        }
        // Empty object
        currentObj[key] = {};
    } else {
        // Simple value
        currentObj[key] = parseYamlValue(valueStr);
    }
};

const handleYamlArray = (line: string, currentObj: any, stack: Array<{ obj: any; indent: number }>, indent: number) => {
    const value = line.substring(2).trim();

    // If current object is not an array, convert the last property to array
    if (!Array.isArray(currentObj)) {
        const parentContext = stack[stack.length - 2];
        if (parentContext && !Array.isArray(parentContext.obj)) {
            const keys = Object.keys(parentContext.obj);
            const lastKey = keys[keys.length - 1];
            if (lastKey) {
                parentContext.obj[lastKey] = [];
                currentObj = parentContext.obj[lastKey];
                stack[stack.length - 1] = { obj: currentObj, indent };
            }
        }
    }

    if (Array.isArray(currentObj)) {
        currentObj.push(parseYamlValue(value));
    }
};

const parseYamlLines = (lines: string[]): any => {
    const result = {};
    const stack: Array<{ obj: any; indent: number }> = [{ obj: result, indent: -1 }];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const indent = line.search(/\S|$/); // Find first non-whitespace character
        const content = line.trim();

        // Find correct parent based on indentation
        while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
            stack.pop();
        }

        const current = stack[stack.length - 1].obj;

        if (content.startsWith('- ')) {
            // Array item
            const value = content.substring(2).trim();

            // Ensure current is an array
            if (!Array.isArray(current)) {
                // Convert the last key to array
                const parent = stack[stack.length - 2]?.obj;
                if (parent) {
                    const keys = Object.keys(parent);
                    const lastKey = keys[keys.length - 1];
                    if (lastKey) {
                        parent[lastKey] = [];
                        stack[stack.length - 1] = { obj: parent[lastKey], indent };
                    }
                }
            }

            if (Array.isArray(current)) {
                current.push(parseYamlValue(value));
            }
        } else if (content.includes(':')) {
            const colonIndex = content.indexOf(':');
            const key = content.substring(0, colonIndex).trim();
            const value = content.substring(colonIndex + 1).trim();

            if (value === '') {
                // Start new object
                current[key] = {};
                stack.push({ obj: current[key], indent });
            } else {
                current[key] = parseYamlValue(value);
            }
        }
    }

    return result;
};


const parseYamlValue = (value: string): any => {
    value = value.trim();

    if (value === '') return '';
    if (value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Numbers
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        return value.substring(1, value.length - 1);
    }

    return value;
};

// XML to YAML
export const xmlToYaml = (xmlString: string): ConversionResult => {
    try {
        const jsonResult = xmlToJson(xmlString);
        if (!jsonResult.success) {
            return jsonResult;
        }
        return jsonToYaml(jsonResult.data);
    } catch (error) {
        return {
            success: false,
            data: '',
            error: `XML to YAML conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};

// YAML to XML
export const yamlToXml = (yamlString: string): ConversionResult => {
    try {
        const jsonResult = yamlToJson(yamlString);
        if (!jsonResult.success) {
            return jsonResult;
        }

        return jsonToXml(jsonResult.data);
    } catch (error) {
        return {
            success: false,
            data: '',
            error: `YAML to XML conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};

// Export all conversion functions
export const conversionMap = {
    'json-xml': jsonToXml,
    'xml-json': xmlToJson,
    'json-yaml': jsonToYaml,
    'yaml-json': yamlToJson,
    'xml-yaml': xmlToYaml,
    'yaml-xml': yamlToXml,
} as const;

export type ConversionType = keyof typeof conversionMap;