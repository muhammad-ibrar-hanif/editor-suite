// src/pages/JsonEditorPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './JsonEditorPage.css';

interface JsonError {
    message: string;
    line: number;
    column: number;
}

interface TreeNode {
    key: string;
    value: any;
    type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    depth: number;
    path: string;
    isExpanded: boolean;
}

const JsonEditorPage: React.FC = () => {
    const [jsonText, setJsonText] = useState<string>(
        JSON.stringify(
            {
                name: "John Doe",
                age: 30,
                email: "john@example.com",
                hobbies: ["reading", "gaming", "coding"],
                address: {
                    street: "123 Main St",
                    city: "Anytown",
                    country: "USA"
                },
                active: true,
                scores: [95, 87, 92]
            },
            null,
            2
        )
    );
    const [errors, setErrors] = useState<JsonError[]>([]);
    const [isValid, setIsValid] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState<'code' | 'tree' | 'split'>('split');
    const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs');
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [splitPosition, setSplitPosition] = useState<number>(50);

    const editorRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    // Validate JSON and build tree data when JSON changes
    useEffect(() => {
        validateAndBuildTree(jsonText);
    }, [jsonText]);

    // Rebuild tree data when switching views
    useEffect(() => {
        if ((viewMode === 'tree' || viewMode === 'split') && isValid && jsonText.trim()) {
            validateAndBuildTree(jsonText);
        }
    }, [viewMode]);

    // EXACT SAME RESIZE IMPLEMENTATION AS XML/YAML EDITORS
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            // Limit between 20% and 80%
            const clampedPosition = Math.max(20, Math.min(80, newPosition));
            setSplitPosition(clampedPosition);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.removeProperty('cursor');
            document.body.style.removeProperty('user-select');
            document.body.style.removeProperty('pointer-events');
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const validateAndBuildTree = (text: string) => {
        try {
            if (text.trim() === '') {
                setErrors([]);
                setIsValid(true);
                setTreeData([]);
                return;
            }

            const parsed = JSON.parse(text);
            setErrors([]);
            setIsValid(true);
            const newTreeData = buildTreeData(parsed);
            setTreeData(newTreeData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
            const lineMatch = errorMessage.match(/line (\d+)/);
            const line = lineMatch ? parseInt(lineMatch[1]) : 1;

            setErrors([{
                message: errorMessage,
                line: line,
                column: 0
            }]);
            setIsValid(false);
            setTreeData([]);
        }
    };

    // Build tree data from JSON
    const buildTreeData = (data: any, path: string = '', depth: number = 0): TreeNode[] => {
        const nodes: TreeNode[] = [];

        if (typeof data === 'object' && data !== null) {
            const isArray = Array.isArray(data);
            const keys = isArray ? [...data.keys()] : Object.keys(data);

            keys.forEach((key: any) => {
                const value = data[key];
                const currentPath = path ? `${path}.${key}` : key.toString();
                const nodeType = Array.isArray(value) ? 'array' :
                    typeof value === 'object' && value !== null ? 'object' :
                        typeof value as any;

                const node: TreeNode = {
                    key: isArray ? `[${key}]` : key.toString(),
                    value: value,
                    type: nodeType,
                    depth: depth,
                    path: currentPath,
                    isExpanded: depth < 2
                };
                nodes.push(node);
            });
        }

        return nodes;
    };

    // Monaco Editor callbacks
    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;

        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            allowComments: false,
            schemas: []
        });
    };

    const handleEditorChange = (value: string | undefined) => {
        setJsonText(value || '');
    };

    // EXACT SAME RESIZE START HANDLER AS XML/YAML EDITORS
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.body.style.pointerEvents = 'none';
    };

    // Tree view functions
    const toggleNode = (path: string) => {
        setTreeData(prev => prev.map(node =>
            node.path === path ? { ...node, isExpanded: !node.isExpanded } : node
        ));
    };

    const formatValue = (value: any, type: string): string => {
        if (type === 'string') return `"${value}"`;
        if (type === 'null') return 'null';
        if (type === 'boolean') return value.toString();
        if (type === 'number') return value.toString();
        if (type === 'array') return `Array[${value.length}]`;
        if (type === 'object') return `Object{${Object.keys(value).length}}`;
        return String(value);
    };

    const getTypeColor = (type: string): string => {
        const colors: { [key: string]: string } = {
            string: '#ce9178',
            number: '#b5cea8',
            boolean: '#569cd6',
            null: '#569cd6',
            object: '#ffd700',
            array: '#ffd700'
        };
        return colors[type] || '#cccccc';
    };

    // Recursive tree node rendering
    const renderTreeNodes = (nodes: TreeNode[]): JSX.Element[] => {
        return nodes.map((node) => {
            const childNodes = (node.type === 'object' || node.type === 'array') && node.isExpanded
                ? buildTreeData(node.value, node.path, node.depth + 1)
                : [];

            return (
                <div key={node.path} className="tree-node">
                    <div
                        className="tree-node-content"
                        style={{ paddingLeft: `${node.depth * 20 + 10}px` }}
                        onClick={() => (node.type === 'object' || node.type === 'array') && toggleNode(node.path)}
                    >
                        {(node.type === 'object' || node.type === 'array') && (
                            <span className="expand-icon">
                                {node.isExpanded ? '▼' : '►'}
                            </span>
                        )}
                        <span className="node-key">{node.key}:</span>
                        <span
                            className="node-value"
                            style={{ color: getTypeColor(node.type) }}
                        >
                            {formatValue(node.value, node.type)}
                        </span>
                        <span className="node-type">({node.type})</span>
                    </div>

                    {(node.type === 'object' || node.type === 'array') && node.isExpanded && (
                        <div className="node-children">
                            {renderTreeNodes(childNodes)}
                        </div>
                    )}
                </div>
            );
        });
    };

    // Handle view mode change
    const handleViewModeChange = (mode: 'code' | 'tree' | 'split') => {
        setViewMode(mode);
        if ((mode === 'tree' || mode === 'split') && isValid && jsonText.trim()) {
            try {
                const parsed = JSON.parse(jsonText);
                const newTreeData = buildTreeData(parsed);
                setTreeData(newTreeData);
            } catch (error) {
                console.error('Error building tree data:', error);
                setTreeData([]);
            }
        }
    };

    // Existing functions
    const formatJSON = () => {
        try {
            const parsed = JSON.parse(jsonText);
            const formatted = JSON.stringify(parsed, null, 2);
            setJsonText(formatted);
        } catch (error) {
            setErrors([{
                message: 'Cannot format invalid JSON',
                line: 1,
                column: 0
            }]);
        }
    };

    const compactJSON = () => {
        try {
            const parsed = JSON.parse(jsonText);
            const compacted = JSON.stringify(parsed);
            setJsonText(compacted);
        } catch (error) {
            setErrors([{
                message: 'Cannot compact invalid JSON',
                line: 1,
                column: 0
            }]);
        }
    };

    const clearEditor = () => {
        setJsonText('');
        setErrors([]);
        setIsValid(true);
        setTreeData([]);
    };

    const pasteJSON = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setJsonText(text);
        } catch (error) {
            console.error('Failed to read clipboard:', error);
        }
    };

    const copyJSON = async () => {
        try {
            await navigator.clipboard.writeText(jsonText);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const toggleTheme = () => {
        setEditorTheme(editorTheme === 'vs' ? 'vs-dark' : 'vs');
    };

    const handleErrorClick = (error: JsonError) => {
        if (editorRef.current) {
            const position = {
                lineNumber: error.line,
                column: error.column + 1
            };
            editorRef.current.setPosition(position);
            editorRef.current.revealLineInCenter(error.line);
            editorRef.current.focus();
        }
    };

    return (
        <div className="json-editor-page">
            <div className="editor-header">
                <h2>JSON Editor</h2>
                <div className="editor-toolbar">
                    <div className="view-toggle">
                        <button
                            className={viewMode === 'code' ? 'active' : ''}
                            onClick={() => handleViewModeChange('code')}
                        >
                            💻 Code
                        </button>
                        <button
                            className={viewMode === 'split' ? 'active' : ''}
                            onClick={() => handleViewModeChange('split')}
                        >
                            🪟 Split
                        </button>
                        <button
                            className={viewMode === 'tree' ? 'active' : ''}
                            onClick={() => handleViewModeChange('tree')}
                        >
                            🌳 Tree
                        </button>
                    </div>

                    <div className="action-buttons">
                        <button onClick={formatJSON} disabled={!isValid}>
                            🛠️ Format
                        </button>
                        <button onClick={compactJSON} disabled={!isValid}>
                            📦 Compact
                        </button>
                        <button onClick={pasteJSON}>
                            📋 Paste
                        </button>
                        <button onClick={copyJSON} disabled={!jsonText}>
                            📄 Copy
                        </button>
                        <button onClick={clearEditor}>
                            🗑️ Clear
                        </button>
                        <button onClick={toggleTheme}>
                            {editorTheme === 'vs' ? '🌙 Dark' : '☀️ Light'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="editor-container">
                {/* Split View - USING EXACT SAME STRUCTURE AS XML/YAML */}
                {viewMode === 'split' && (
                    <div
                        ref={containerRef}
                        className="split-container"
                    >
                        <div
                            className="panel left-panel"
                            style={{ width: `${splitPosition}%` }}
                        >
                            <div className="panel-header">
                                <h4>💻 Code Editor</h4>
                            </div>
                            <div className="panel-content">
                                <Editor
                                    height="100%"
                                    defaultLanguage="json"
                                    value={jsonText}
                                    onChange={handleEditorChange}
                                    onMount={handleEditorDidMount}
                                    theme={editorTheme}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        tabSize: 2,
                                        insertSpaces: true,
                                        formatOnPaste: true,
                                        formatOnType: true,
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            className="resize-handle"
                            onMouseDown={handleResizeStart}
                        >
                            <div className="handle-bar"></div>
                        </div>

                        <div
                            className="panel right-panel"
                            style={{ width: `${100 - splitPosition}%` }}
                        >
                            <div className="panel-header">
                                <h4>🌳 Tree View</h4>
                                <span className="tree-stats">
                                    {treeData.length > 0 ? `${treeData.filter(n => n.depth === 0).length} root properties` : 'No data'}
                                </span>
                            </div>
                            <div className="panel-content">
                                {!isValid ? (
                                    <div className="tree-error">
                                        ❌ Cannot display tree view for invalid JSON
                                    </div>
                                ) : !jsonText.trim() ? (
                                    <div className="tree-empty">
                                        📝 Enter JSON to see tree view
                                    </div>
                                ) : treeData.length === 0 ? (
                                    <div className="tree-empty">
                                        🔄 Building tree view...
                                    </div>
                                ) : (
                                    <div className="tree-nodes">
                                        {renderTreeNodes(treeData.filter(node => node.depth === 0))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Other view modes */}
                {viewMode === 'code' && (
                    <div className="full-editor">
                        <Editor
                            height="100%"
                            defaultLanguage="json"
                            value={jsonText}
                            onChange={handleEditorChange}
                            onMount={handleEditorDidMount}
                            theme={editorTheme}
                            options={{
                                minimap: { enabled: true },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                insertSpaces: true,
                                formatOnPaste: true,
                                formatOnType: true,
                            }}
                        />
                    </div>
                )}

                {viewMode === 'tree' && (
                    <div className="full-tree">
                        <div className="tree-header">
                            <h3>🌳 JSON Tree View</h3>
                            <span className="tree-stats">
                                {treeData.length > 0 ? `${treeData.filter(n => n.depth === 0).length} root properties` : 'No data'}
                            </span>
                        </div>
                        <div className="tree-content">
                            {!isValid ? (
                                <div className="tree-error">
                                    ❌ Cannot display tree view for invalid JSON
                                </div>
                            ) : !jsonText.trim() ? (
                                <div className="tree-empty">
                                    📝 Enter JSON to see tree view
                                </div>
                            ) : treeData.length === 0 ? (
                                <div className="tree-empty">
                                    🔄 Building tree view...
                                </div>
                            ) : (
                                <div className="tree-nodes">
                                    {renderTreeNodes(treeData.filter(node => node.depth === 0))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {errors.length > 0 && (
                    <div className="error-panel">
                        <div className="error-header">
                            <span className="error-count">{errors.length} error(s) found</span>
                        </div>
                        <div className="error-list">
                            {errors.map((error, index) => (
                                <div
                                    key={index}
                                    className="error-item"
                                    onClick={() => handleErrorClick(error)}
                                >
                                    <span className="error-message">{error.message}</span>
                                    <span className="error-location">Line {error.line}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isValid && jsonText.trim() && (
                    <div className="validation-status valid">
                        ✅ Valid JSON
                    </div>
                )}
            </div>

            <div className="editor-stats">
                <div className="stat-item">
                    <span className="stat-label">Lines:</span>
                    <span className="stat-value">{jsonText.split('\n').length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Characters:</span>
                    <span className="stat-value">{jsonText.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Status:</span>
                    <span className={`stat-value ${isValid ? 'valid' : 'invalid'}`}>
                        {isValid ? 'Valid' : 'Invalid'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default JsonEditorPage;