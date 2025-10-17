import React, { useState, useCallback, useRef, useEffect } from 'react';
import ConversionModal from '../components/ConversionModal';

// YAML Parser Types
interface YamlNode {
    type: 'object' | 'array' | 'value' | 'keyvalue';
    key?: string;
    value?: any;
    children?: YamlNode[];
    depth: number;
}

interface ParseError {
    message: string;
    line?: number;
    column?: number;
}

// Simple YAML Parser
class CustomYamlParser {
    parse(yamlString: string): { root: YamlNode | null; error: ParseError | null } {
        try {
            const lines = yamlString.split('\n').filter(line => line.trim() !== '');
            const root: YamlNode = { type: 'object', children: [], depth: -1 };
            const stack: YamlNode[] = [root];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();
                const indent = line.match(/^(\s*)/)?.[1].length || 0;

                // Calculate depth based on indentation (2 spaces per level)
                const depth = Math.floor(indent / 2);

                // Pop stack until we reach the correct depth
                while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
                    stack.pop();
                }

                const currentParent = stack[stack.length - 1];

                if (trimmed.startsWith('- ')) {
                    // Array item
                    const arrayItem: YamlNode = {
                        type: 'value',
                        value: trimmed.substring(2).trim(),
                        depth
                    };
                    currentParent.children!.push(arrayItem);
                } else if (trimmed.includes(':')) {
                    // Key-value pair
                    const colonIndex = trimmed.indexOf(':');
                    const key = trimmed.substring(0, colonIndex).trim();
                    const value = trimmed.substring(colonIndex + 1).trim();

                    if (value === '' || value === '|' || value === '>') {
                        // Complex value (object/array) - push to stack
                        const newObj: YamlNode = {
                            type: 'object',
                            key,
                            children: [],
                            depth
                        };
                        currentParent.children!.push(newObj);
                        stack.push(newObj);
                    } else {
                        // Simple value
                        const kvPair: YamlNode = {
                            type: 'keyvalue',
                            key,
                            value: this.parseValue(value),
                            depth
                        };
                        currentParent.children!.push(kvPair);
                    }
                } else {
                    // Simple value line
                    const valueNode: YamlNode = {
                        type: 'value',
                        value: trimmed,
                        depth
                    };
                    currentParent.children!.push(valueNode);
                }
            }

            return { root, error: null };
        } catch (error) {
            return {
                root: null,
                error: {
                    message: error instanceof Error ? error.message : 'YAML parsing error',
                    line: 0,
                    column: 0
                }
            };
        }
    }

    private parseValue(value: string): any {
        value = value.trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.substring(1, value.length - 1);
        }

        // Parse numbers
        if (/^-?\d+$/.test(value)) return parseInt(value, 10);
        if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

        // Parse booleans
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;

        return value;
    }
}

// YAML Tree Node Component
interface YamlTreeNodeProps {
    node: YamlNode;
    onUpdate?: (path: string, value: any) => void;
}

const YamlTreeNode: React.FC<YamlTreeNodeProps> = ({ node, onUpdate }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleToggle = () => {
        setIsCollapsed(!isCollapsed);
    };

    const hasChildren = node.children && node.children.length > 0;

    if (node.type === 'keyvalue') {
        return (
            <div className="yaml-tree-node" style={{ marginLeft: node.depth * 20 }}>
                <div className="node-header">
                    <span className="node-key">{node.key}:</span>
                    <span className="node-value">{String(node.value)}</span>
                </div>
            </div>
        );
    }

    if (node.type === 'value') {
        return (
            <div className="yaml-tree-node" style={{ marginLeft: node.depth * 20 }}>
                <div className="node-header">
                    <span className="array-bullet">-</span>
                    <span className="node-value">{String(node.value)}</span>
                </div>
            </div>
        );
    }

    // Object or array
    return (
        <div className="yaml-tree-node" style={{ marginLeft: node.depth * 20 }}>
            <div className="node-header" onClick={handleToggle}>
                <span className="toggle-icon">
                    {hasChildren ? (isCollapsed ? '▶' : '▼') : '•'}
                </span>
                {node.key && <span className="node-key">{node.key}:</span>}
                {!node.key && <span className="node-type">{node.type === 'object' ? '{}' : '[]'}</span>}
            </div>

            {!isCollapsed && hasChildren && (
                <div className="node-children">
                    {node.children!.map((child, index) => (
                        <YamlTreeNode key={index} node={child} onUpdate={onUpdate} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Line Number TextArea Component (reuse from XML editor)
interface LineNumberTextAreaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const LineNumberTextArea: React.FC<LineNumberTextAreaProps> = ({
    value,
    onChange,
    placeholder
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
    };

    const lineCount = value.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    return (
        <div className="line-number-editor">
            <div className="line-numbers" ref={lineNumbersRef}>
                {lineNumbers.map(num => (
                    <div key={num} className="line-number">{num}</div>
                ))}
            </div>
            <textarea
                ref={textareaRef}
                className="yaml-textarea"
                value={value}
                onChange={handleChange}
                onScroll={handleScroll}
                spellCheck={false}
                placeholder={placeholder}
            />
        </div>
    );
};

// Resizable Panel Component (reuse from XML editor)
interface ResizablePanelProps {
    left: React.ReactNode;
    right: React.ReactNode;
    defaultWidth?: number;
}

const ResizablePanels: React.FC<ResizablePanelProps> = ({
    left,
    right,
    defaultWidth = 50
}) => {
    const [leftWidth, setLeftWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        const container = document.querySelector('.editor-content') as HTMLElement;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        setLeftWidth(Math.max(10, Math.min(90, newLeftWidth)));
    }, [isResizing]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
        <div className={`resizable-panels ${isResizing ? 'resizing' : ''}`}>
            <div className="panel left-panel" style={{ width: `${leftWidth}%` }}>
                {left}
            </div>
            <div className="panel-divider" onMouseDown={handleMouseDown} />
            <div className="panel right-panel" style={{ width: `${100 - leftWidth}%` }}>
                {right}
            </div>
        </div>
    );
};

// Main YAML Editor Component
const YAMLEditor: React.FC = () => {
    const [rawYaml, setRawYaml] = useState<string>(`# YAML Configuration Example
app:
  name: My Application
  version: 1.0.0
  database:
    host: localhost
    port: 5432
    credentials:
      username: admin
      password: secret

features:
  - authentication
  - file_upload
  - real_time_updates

server:
  ports:
    - 3000
    - 3001
    - 3002
  environment: production`);

    const [yamlTree, setYamlTree] = useState<YamlNode | null>(null);
    const [error, setError] = useState<ParseError | null>(null);
    const [activeView, setActiveView] = useState<'split' | 'raw' | 'visual'>('raw');
    const parserRef = useRef(new CustomYamlParser());
    const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);

    const parseYaml = useCallback((yamlString: string) => {
        const { root, error } = parserRef.current.parse(yamlString);
        setYamlTree(root);
        setError(error);
    }, []);

    const handleYamlChange = useCallback((newYaml: string) => {
        setRawYaml(newYaml);
        parseYaml(newYaml);
    }, [parseYaml]);

    // Format YAML
    const formatYaml = useCallback(() => {
        try {
            const formatted = formatYamlString(rawYaml);
            setRawYaml(formatted);
        } catch (err) {
            console.error('Formatting error:', err);
        }
    }, [rawYaml]);

    const formatYamlString = (yaml: string): string => {
        const lines = yaml.split('\n');
        let result: string[] = [];
        let indentLevel = 0;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                result.push('');
                continue;
            }

            // Handle comments
            if (trimmed.startsWith('#')) {
                result.push('  '.repeat(indentLevel) + trimmed);
                continue;
            }

            // Handle array items
            if (trimmed.startsWith('- ')) {
                result.push('  '.repeat(indentLevel) + trimmed);
                continue;
            }

            // Handle key-value pairs
            if (trimmed.includes(':')) {
                const colonIndex = trimmed.indexOf(':');
                const key = trimmed.substring(0, colonIndex).trim();
                const value = trimmed.substring(colonIndex + 1).trim();

                result.push('  '.repeat(indentLevel) + key + ': ' + value);

                // Increase indent for nested objects
                if (value === '' || value === '|' || value === '>') {
                    indentLevel++;
                }
            } else {
                result.push('  '.repeat(indentLevel) + trimmed);
            }
        }

        return result.join('\n');
    };

    useEffect(() => {
        parseYaml(rawYaml);
    }, [parseYaml]);

    // Panel components
    const rawEditorPanel = (
        <div className="raw-editor-pane">
            <div className="pane-header">
                <h3>📄 Raw YAML</h3>
                <div className="pane-actions">
                    <button onClick={formatYaml} className="action-button">
                        🛠️ Format
                    </button>
                    <button onClick={() => setActiveView('split')} className="action-button">
                        🔄 Split View
                    </button>
                    <button
                        onClick={() => setIsConversionModalOpen(true)}
                        className="conversion-button"
                    >
                        🔄 Convert
                    </button>
                </div>
            </div>
            <LineNumberTextArea
                value={rawYaml}
                onChange={handleYamlChange}
                placeholder="Enter your YAML here..."
            />
        </div>
    );

    const treeViewPanel = (
        <div className="visual-tree-pane">
            <div className="pane-header">
                <h3>🌳 Tree View</h3>
                <div className="pane-actions">
                    <button onClick={() => setActiveView('split')} className="action-button">
                        🔄 Split View
                    </button>
                </div>
            </div>
            <div className="tree-container">
                {yamlTree ? (
                    <div className="yaml-tree">
                        <YamlTreeNode node={yamlTree} />
                    </div>
                ) : !error ? (
                    <div className="loading">🔄 Parsing YAML...</div>
                ) : (
                    <div className="error-state">❌ Unable to parse YAML</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="yaml-editor-container">
            <div className="editor-header">
                <h2>📋 YAML Editor</h2>
                <div className="editor-controls">
                    <div className="view-controls">
                        <button
                            className={`view-button ${activeView === 'raw' ? 'active' : ''}`}
                            onClick={() => setActiveView('raw')}
                        >
                            📄 Raw YAML
                        </button>
                        <button
                            className={`view-button ${activeView === 'visual' ? 'active' : ''}`}
                            onClick={() => setActiveView('visual')}
                        >
                            🌳 Tree View
                        </button>
                        <button
                            className={`view-button ${activeView === 'split' ? 'active' : ''}`}
                            onClick={() => setActiveView('split')}
                        >
                            ⚡ Split View
                        </button>
                    </div>
                    <div className="action-controls">
                        <button onClick={formatYaml} className="format-button">
                            🛠️ Format YAML
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    ❌ YAML Error: {error.message}
                    {error.line && ` (Line: ${error.line})`}
                </div>
            )}

            <div className="editor-content">
                {activeView === 'split' && (
                    <ResizablePanels left={rawEditorPanel} right={treeViewPanel} />
                )}

                {activeView === 'raw' && (
                    <div className="full-panel">
                        {rawEditorPanel}
                    </div>
                )}

                {activeView === 'visual' && (
                    <div className="full-panel">
                        {treeViewPanel}
                    </div>
                )}
            </div>

            <ConversionModal
                isOpen={isConversionModalOpen}
                onClose={() => setIsConversionModalOpen(false)}
                currentFormat="yaml" // ← FIXED: Changed from "xml" to "yaml"
                currentData={rawYaml}
                onConverted={(convertedData, targetFormat) => {
                    console.log('Converted to:', targetFormat, convertedData);
                    navigator.clipboard.writeText(convertedData);
                    alert(`Converted to ${targetFormat.toUpperCase()} and copied to clipboard!`);
                }}
            />
        </div>
    );
};

export default YAMLEditor;