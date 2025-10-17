import React, { useState, useCallback, useRef, useEffect } from 'react';
import ConversionModal from '../components/ConversionModal';

// Custom XML Parser Types
interface XmlAttribute {
    name: string;
    value: string;
}

interface XmlNode {
    type: 'element' | 'text' | 'comment' | 'cdata';
    name?: string;
    attributes?: XmlAttribute[];
    content?: string | XmlNode[];
    parent?: XmlNode;
}

interface ParseError {
    message: string;
    line?: number;
    column?: number;
    position?: number;
}

// Custom XML Parser
class CustomXmlParser {
    private input: string = '';
    private position: number = 0;
    private currentLine: number = 1;
    private currentColumn: number = 1;

    parse(xmlString: string): { root: XmlNode | null; error: ParseError | null } {
        this.input = xmlString.trim();
        this.position = 0;
        this.currentLine = 1;
        this.currentColumn = 1;

        try {
            // Skip XML declaration if present
            if (this.input.startsWith('<?xml')) {
                this.skipXmlDeclaration();
            }

            // Skip comments and whitespace at the beginning
            this.skipWhitespace();
            while (this.consumeComment()) {
                this.skipWhitespace();
            }

            const root = this.parseElement();
            return { root, error: null };
        } catch (error) {
            return {
                root: null,
                error: {
                    message: error instanceof Error ? error.message : 'Unknown parsing error',
                    line: this.currentLine,
                    column: this.currentColumn,
                    position: this.position
                }
            };
        }
    }

    private skipXmlDeclaration(): void {
        if (this.consumeString('<?xml')) {
            while (this.position < this.input.length && !this.consumeString('?>')) {
                this.advance();
            }
        }
    }

    private parseElement(): XmlNode {
        if (!this.consumeString('<')) {
            throw new Error(`Expected '<' at position ${this.position}`);
        }

        // Check for comments
        if (this.consumeString('!--')) {
            return this.parseComment();
        }

        // Check for CDATA
        if (this.consumeString('![CDATA[')) {
            return this.parseCdata();
        }

        // Parse element name
        const name = this.parseName();
        const attributes = this.parseAttributes();

        // Check for self-closing tag
        if (this.consumeString('/>')) {
            return {
                type: 'element',
                name,
                attributes,
                content: []
            };
        }

        if (!this.consumeString('>')) {
            throw new Error(`Expected '>' or '/>' after element name`);
        }

        // Parse content
        const content: XmlNode[] = [];
        while (this.position < this.input.length && !this.consumeString('</')) {
            this.skipWhitespace();

            if (this.peek() === '<') {
                if (this.lookAhead(1) === '/') break; // Closing tag

                // Check what type of element we have
                if (this.lookAhead(1) === '!' && this.lookAhead(2) === '-') {
                    content.push(this.parseComment());
                } else if (this.lookAhead(1) === '!' && this.input.startsWith('[CDATA[', this.position + 1)) {
                    content.push(this.parseCdata());
                } else {
                    content.push(this.parseElement());
                }
            } else {
                const text = this.parseText();
                if (text.trim()) {
                    content.push({
                        type: 'text',
                        content: text
                    });
                }
            }
            this.skipWhitespace();
        }

        // Parse closing tag
        const closingName = this.parseName();
        if (closingName !== name) {
            throw new Error(`Mismatched tags: expected </${name}> but found </${closingName}>`);
        }

        if (!this.consumeString('>')) {
            throw new Error(`Expected '>' after closing tag </${closingName}>`);
        }

        return {
            type: 'element',
            name,
            attributes,
            content
        };
    }

    private parseComment(): XmlNode {
        const start = this.position;
        while (this.position < this.input.length && !this.consumeString('-->')) {
            this.advance();
        }

        if (this.position >= this.input.length) {
            throw new Error('Unclosed comment');
        }

        const content = this.input.substring(start, this.position - 3);
        return {
            type: 'comment',
            content
        };
    }

    private parseCdata(): XmlNode {
        const start = this.position;
        while (this.position < this.input.length && !this.consumeString(']]>')) {
            this.advance();
        }

        if (this.position >= this.input.length) {
            throw new Error('Unclosed CDATA section');
        }

        const content = this.input.substring(start, this.position - 3);
        return {
            type: 'cdata',
            content
        };
    }

    private parseText(): string {
        const start = this.position;
        while (this.position < this.input.length && this.peek() !== '<') {
            this.advance();
        }
        return this.input.substring(start, this.position);
    }

    private parseName(): string {
        const start = this.position;
        while (this.position < this.input.length && this.isNameChar(this.peek())) {
            this.advance();
        }

        if (this.position === start) {
            throw new Error('Expected element name');
        }

        return this.input.substring(start, this.position);
    }

    private parseAttributes(): XmlAttribute[] {
        const attributes: XmlAttribute[] = [];

        this.skipWhitespace();
        while (this.position < this.input.length && this.peek() !== '>' && this.peek() !== '/') {
            const name = this.parseName();

            if (!this.consumeString('=')) {
                throw new Error(`Expected '=' after attribute name ${name}`);
            }

            const quote = this.peek();
            if (quote !== '"' && quote !== "'") {
                throw new Error('Expected quote after =');
            }
            this.advance(); // consume quote

            const valueStart = this.position;
            while (this.position < this.input.length && this.peek() !== quote) {
                this.advance();
            }

            if (this.position >= this.input.length) {
                throw new Error('Unclosed attribute value');
            }

            const value = this.input.substring(valueStart, this.position);
            this.advance(); // consume closing quote

            attributes.push({ name, value });
            this.skipWhitespace();
        }

        return attributes;
    }

    private skipWhitespace(): void {
        while (this.position < this.input.length && this.isWhitespace(this.peek())) {
            this.advance();
        }
    }

    private consumeComment(): boolean {
        if (this.input.startsWith('<!--', this.position)) {
            while (this.position < this.input.length && !this.consumeString('-->')) {
                this.advance();
            }
            return true;
        }
        return false;
    }

    private consumeString(str: string): boolean {
        if (this.input.startsWith(str, this.position)) {
            this.position += str.length;
            this.updateLineColumn(str);
            return true;
        }
        return false;
    }

    private peek(offset: number = 0): string {
        return this.input[this.position + offset] || '';
    }

    private lookAhead(count: number): string {
        return this.input.substring(this.position, this.position + count);
    }

    private advance(): void {
        this.updateLineColumn(this.input[this.position]);
        this.position++;
    }

    private updateLineColumn(char: string): void {
        if (char === '\n') {
            this.currentLine++;
            this.currentColumn = 1;
        } else {
            this.currentColumn++;
        }
    }

    private isWhitespace(char: string): boolean {
        return char === ' ' || char === '\n' || char === '\r' || char === '\t';
    }

    private isNameChar(char: string): boolean {
        return /[a-zA-Z0-9_:-]/.test(char);
    }
}

// Line Number TextArea Component
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
                className="xml-textarea"
                value={value}
                onChange={handleChange}
                onScroll={handleScroll}
                spellCheck={false}
                placeholder={placeholder}
            />
        </div>
    );
};

// XML Tree Node Component
interface XmlTreeNodeProps {
    node: XmlNode;
    depth?: number;
    onUpdate?: (path: string, value: any) => void;
}

// In the XmlTreeNode component, update the renderNodeContent function and children rendering:

// Replace the entire XmlTreeNode component with this fixed version:

const XmlTreeNode: React.FC<XmlTreeNodeProps> = ({ node, depth = 0, onUpdate }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleToggle = () => {
        setIsCollapsed(!isCollapsed);
    };

    const renderAttributes = (attributes: XmlAttribute[] = []) => (
        <span className="xml-attributes">
            {attributes.map((attr, index) => (
                <span key={index} className="xml-attribute">
                    <span className="attr-name">{attr.name}</span>
                    <span className="attr-equals">=</span>
                    <span className="attr-value">"{attr.value}"</span>
                </span>
            ))}
        </span>
    );

    // Safe content renderer that only returns valid React nodes
    const renderContent = (content: string | XmlNode[] | undefined): React.ReactNode => {
        if (typeof content === 'string') {
            return <span className="xml-text">{content}</span>;
        }

        if (Array.isArray(content)) {
            return (
                <>
                    {content.map((child, index) => (
                        <XmlTreeNode
                            key={index}
                            node={child}
                            depth={depth + 1}
                            onUpdate={onUpdate}
                        />
                    ))}
                </>
            );
        }

        return null;
    };

    if (node.type === 'text') {
        return (
            <div className="xml-text-node" style={{ marginLeft: depth * 20 + 20 }}>
                <span className="xml-text">{node.content as string}</span>
            </div>
        );
    }

    if (node.type === 'comment') {
        return (
            <div className="xml-comment" style={{ marginLeft: depth * 20 + 20 }}>
                &lt;!-- {node.content as string} --&gt;
            </div>
        );
    }

    if (node.type === 'cdata') {
        return (
            <div className="xml-cdata" style={{ marginLeft: depth * 20 + 20 }}>
                &lt;![CDATA[{node.content as string}]]&gt;
            </div>
        );
    }

    // Element node
    const hasChildren = Array.isArray(node.content) && node.content.length > 0;
    const isSelfClosing = !hasChildren && !node.content;

    return (
        <div className="xml-tree-node">
            <div className="node-header" onClick={hasChildren ? handleToggle : undefined}>
                <span className="node-indent" style={{ width: depth * 20 }}></span>
                {hasChildren && (
                    <span className="toggle-icon">
                        {isCollapsed ? '▶' : '▼'}
                    </span>
                )}
                {!hasChildren && <span className="toggle-spacer"></span>}
                <span className="node-tag">&lt;</span>
                <span className="node-name">{node.name}</span>
                {node.attributes && renderAttributes(node.attributes)}
                {isSelfClosing && <span className="node-tag"> /&gt;</span>}
                {!isSelfClosing && <span className="node-tag">&gt;</span>}
            </div>

            {!isCollapsed && hasChildren && (
                <div className="node-children">
                    {renderContent(node.content)}
                </div>
            )}

            {!isCollapsed && !isSelfClosing && hasChildren && (
                <div className="node-footer">
                    <span className="node-indent" style={{ width: depth * 20 }}></span>
                    <span className="toggle-spacer"></span>
                    <span className="node-tag">&lt;/</span>
                    <span className="node-name">{node.name}</span>
                    <span className="node-tag">&gt;</span>
                </div>
            )}
        </div>
    );
};

// Resizable Panel Component
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

        // Limit between 10% and 90%
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
            <div
                className="panel left-panel"
                style={{ width: `${leftWidth}%` }}
            >
                {left}
            </div>
            <div
                className="panel-divider"
                onMouseDown={handleMouseDown}
            />
            <div
                className="panel right-panel"
                style={{ width: `${100 - leftWidth}%` }}
            >
                {right}
            </div>
        </div>
    );
};

// Main XML Editor Component
const XMLEditor: React.FC = () => {
    const [rawXml, setRawXml] = useState<string>(`<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction" rating="5">
    <title>The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price currency="USD">12.99</price>
    <!-- This is a classic novel -->
  </book>
  <book category="non-fiction">
    <title>Atomic Habits</title>
    <author>James Clear</author>
    <year>2018</year>
    <price currency="USD">13.99</price>
    <description><![CDATA[This book contains <special> content & examples]]></description>
  </book>
</bookstore>`);

    const [xmlTree, setXmlTree] = useState<XmlNode | null>(null);
    const [error, setError] = useState<ParseError | null>(null);
    const [activeView, setActiveView] = useState<'split' | 'raw' | 'visual'>('raw');
    const parserRef = useRef(new CustomXmlParser());
    const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);

    const parseXml = useCallback((xmlString: string) => {
        const { root, error } = parserRef.current.parse(xmlString);
        setXmlTree(root);
        setError(error);
    }, []);

    const handleXmlChange = useCallback((newXml: string) => {
        setRawXml(newXml);
        parseXml(newXml);
    }, [parseXml]);

    // Format XML
    const formatXml = useCallback(() => {
        try {
            const formatted = formatXmlString(rawXml);
            setRawXml(formatted);
        } catch (err) {
            console.error('Formatting error:', err);
            // If formatting fails, try a simple fallback
            try {
                const simpleFormatted = simpleFormatXml(rawXml);
                setRawXml(simpleFormatted);
            } catch (fallbackErr) {
                console.error('Fallback formatting also failed:', fallbackErr);
            }
        }
    }, [rawXml]);

    // Proper XML formatting function
    const formatXmlString = (xml: string): string => {
        let formatted = '';
        let indent = '';
        const tab = '  '; // 2 spaces for indentation
        let inTag = false;
        let inAttribute = false;
        let inCdata = false;
        let inComment = false;
        //let currentTag = '';

        // Remove existing formatting to start fresh
        const compressed = xml.replace(/\s+/g, ' ').trim();

        for (let i = 0; i < compressed.length; i++) {
            const char = compressed[i];
            //const prevChar = i > 0 ? compressed[i - 1] : '';
            const nextChar = i < compressed.length - 1 ? compressed[i + 1] : '';

            // Handle CDATA sections
            if (char === '<' && compressed.substr(i, 9) === '<![CDATA[') {
                inCdata = true;
                formatted += '\n' + indent + '<![CDATA[';
                i += 8; // Skip the rest of the opening
                continue;
            }

            if (inCdata && char === ']' && compressed.substr(i, 3) === ']]>') {
                inCdata = false;
                formatted += ']]>';
                i += 2; // Skip the rest of the closing
                continue;
            }

            if (inCdata) {
                formatted += char;
                continue;
            }

            // Handle comments
            if (char === '<' && compressed.substr(i, 4) === '<!--') {
                inComment = true;
                // If we're not at the start of a line, add newline
                if (formatted[formatted.length - 1] !== '\n') {
                    formatted += '\n';
                }
                formatted += indent + '<!--';
                i += 3; // Skip the rest of the opening
                continue;
            }

            if (inComment && char === '-' && compressed.substr(i, 3) === '-->') {
                inComment = false;
                formatted += '-->\n';
                i += 2; // Skip the rest of the closing
                continue;
            }

            if (inComment) {
                formatted += char;
                continue;
            }

            // Handle tag opening
            if (char === '<' && nextChar !== '/') {
                inTag = true;
                // Close previous line if needed
                if (formatted && formatted[formatted.length - 1] !== '\n') {
                    formatted += '\n';
                }
                formatted += indent + '<';
                continue;
            }

            // Handle tag closing
            if (char === '>' && !inAttribute) {
                inTag = false;
                formatted += '>';

                // Check if this is a self-closing tag or opening tag
                const tagEnd = formatted.lastIndexOf('<');
                const tagContent = formatted.substring(tagEnd);

                if (tagContent.includes('/>') || tagContent.includes('?>')) {
                    // Self-closing tag or processing instruction
                    formatted += '\n';
                } else if (!tagContent.startsWith('</')) {
                    // Opening tag - increase indent
                    indent += tab;
                }
                continue;
            }

            // Handle closing tags
            if (char === '<' && nextChar === '/') {
                // Decrease indent before closing tag
                if (indent.length >= tab.length) {
                    indent = indent.substring(0, indent.length - tab.length);
                }
                if (formatted[formatted.length - 1] !== '\n') {
                    formatted += '\n';
                }
                formatted += indent + '</';
                i++; // Skip the '/'
                continue;
            }

            // Handle attributes
            if (inTag && char === '"') {
                inAttribute = !inAttribute;
            }

            formatted += char;
        }

        return formatted.trim();
    };

    // Simple fallback formatter for basic cases
    const simpleFormatXml = (xml: string): string => {
        // Add line breaks between tags
        let formatted = xml
            .replace(/>\s*</g, '>\n<') // Add breaks between tags
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

        // Add proper indentation
        const lines = formatted.split('\n');
        let indentLevel = 0;
        const tab = '  ';

        const formattedLines = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '';

            // Decrease indent for closing tags
            if (trimmed.startsWith('</') || trimmed === '?>' || trimmed.endsWith('/>')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            const indentedLine = tab.repeat(indentLevel) + trimmed;

            // Increase indent for opening tags (that aren't self-closing)
            if (trimmed.startsWith('<') && !trimmed.startsWith('</') &&
                !trimmed.endsWith('/>') && !trimmed.endsWith('?>') &&
                !trimmed.includes('<!--') && !trimmed.includes('<![CDATA[')) {
                indentLevel++;
            }

            return indentedLine;
        });

        return formattedLines.filter(line => line !== '').join('\n');
    };

    const handleConvertedData = (convertedData: string, targetFormat: 'json' | 'xml' | 'yaml') => {
        // For now, copy to clipboard and show notification
        navigator.clipboard.writeText(convertedData);
        // You could also set the converted data as the current XML content
        // setRawXml(convertedData);
        console.log('Converted to:', targetFormat, convertedData);
        alert(`Converted to ${targetFormat.toUpperCase()} and copied to clipboard!`);
    };

    useEffect(() => {
        parseXml(rawXml);
    }, [parseXml]);

    // Panel components
    const rawEditorPanel = (
        <div className="raw-editor-pane">
            <div className="pane-header">
                <h3>📄 Raw XML</h3>
                <div className="pane-actions">
                    <button onClick={formatXml} className="action-button">
                        🛠️ Format
                    </button>
                    <button onClick={() => setActiveView('split')} className="action-button">
                        🔄 Split View
                    </button>
                </div>
            </div>
            <LineNumberTextArea
                value={rawXml}
                onChange={handleXmlChange}
                placeholder="Enter your XML here..."
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
                {xmlTree ? (
                    <div className="xml-tree">
                        <XmlTreeNode node={xmlTree} onUpdate={handleXmlChange} />
                    </div>
                ) : !error ? (
                    <div className="loading">🔄 Parsing XML...</div>
                ) : (
                    <div className="error-state">❌ Unable to parse XML</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="xml-editor-container">
            <div className="editor-header">
                <h2>📝 XML Editor</h2>
                <div className="editor-controls">
                    <div className="view-controls">
                        <button
                            className={`view-button ${activeView === 'raw' ? 'active' : ''}`}
                            onClick={() => setActiveView('raw')}
                        >
                            📄 Raw XML
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
                        <button onClick={formatXml} className="format-button">
                            🛠️ Format XML
                        </button>
                        <button
                            onClick={() => setIsConversionModalOpen(true)}
                            className="conversion-button"
                        >
                            🔄 Convert
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    ❌ XML Error: {error.message}
                    {error.line && ` (Line: ${error.line}, Column: ${error.column})`}
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
                currentFormat="xml" // This should be "xml" for XML editor
                currentData={rawXml}
                onConverted={handleConvertedData}
            />
        </div>
    );
};

export default XMLEditor;