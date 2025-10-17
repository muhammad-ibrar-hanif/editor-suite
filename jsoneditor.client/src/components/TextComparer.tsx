// src/components/TextComparer.tsx
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { diffWords } from 'diff';
import './TextComparer.css';

interface DiffLine {
    leftText: string;
    rightText: string;
    leftLineNumber: number;
    rightLineNumber: number;
    hasDifference: boolean;
}

const TextComparer = () => {
    const [leftText, setLeftText] = useState('// JSON Example\n{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}');
    const [rightText, setRightText] = useState('// JSON Example\n{\n  "name": "Jane",\n  "age": 25,\n  "city": "London"\n}');
    const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
    const [language, setLanguage] = useState<string>('plaintext');
    const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs');
    const [showHelp, setShowHelp] = useState<boolean>(true);

    const leftEditorRef = useRef<any>(null);
    const rightEditorRef = useRef<any>(null);
    const actionsPanelRef = useRef<HTMLDivElement>(null);
    const monacoRef = useRef<any>(null);

    // Language options for different code types
    const languageOptions = [
        { value: 'plaintext', label: '📝 Plain Text' },
        { value: 'json', label: '{} JSON' },
        { value: 'xml', label: '📄 XML' },
        { value: 'html', label: '🌐 HTML' },
        { value: 'css', label: '🎨 CSS' },
        { value: 'javascript', label: '⚡ JavaScript' },
        { value: 'typescript', label: '🔷 TypeScript' },
        { value: 'python', label: '🐍 Python' },
        { value: 'java', label: '☕ Java' },
        { value: 'csharp', label: 'C# C#' },
        { value: 'cpp', label: 'C++ C++' },
        { value: 'php', label: '🐘 PHP' },
        { value: 'sql', label: '🗃️ SQL' },
        { value: 'yaml', label: '📋 YAML' },
        { value: 'markdown', label: '📖 Markdown' }
    ];

    // Clear all decorations
    const clearHighlights = () => {
        if (leftEditorRef.current) {
            leftEditorRef.current.deltaDecorations([], []);
        }
        if (rightEditorRef.current) {
            rightEditorRef.current.deltaDecorations([], []);
        }
    };

    // Apply Monaco decorations using proper diff algorithm
    const applyWordHighlights = () => {
        if (!monacoRef.current || !leftEditorRef.current || !rightEditorRef.current) return;

        clearHighlights(); // Clear previous highlights first

        const leftDecorations: any[] = [];
        const rightDecorations: any[] = [];

        diffLines.forEach((line, lineIndex) => {
            const lineNum = lineIndex + 1;

            // Only highlight if there's a real difference
            if (line.hasDifference && line.leftText !== line.rightText) {
                try {
                    // Use the diff library to find word-level differences
                    const differences = diffWords(line.leftText, line.rightText);

                    let leftOffset = 0;
                    let rightOffset = 0;

                    differences.forEach(diff => {
                        if (diff.removed) {
                            // Highlight removed text in left editor
                            const startColumn = leftOffset + 1;
                            const endColumn = startColumn + diff.value.length;

                            leftDecorations.push({
                                range: new monacoRef.current.Range(lineNum, startColumn, lineNum, endColumn),
                                options: {
                                    isWholeLine: false,
                                    className: 'word-diff-removed',
                                    inlineClassName: 'word-diff-removed-inline'
                                }
                            });
                            leftOffset += diff.value.length;
                        } else if (diff.added) {
                            // Highlight added text in right editor
                            const startColumn = rightOffset + 1;
                            const endColumn = startColumn + diff.value.length;

                            rightDecorations.push({
                                range: new monacoRef.current.Range(lineNum, startColumn, lineNum, endColumn),
                                options: {
                                    isWholeLine: false,
                                    className: 'word-diff-added',
                                    inlineClassName: 'word-diff-added-inline'
                                }
                            });
                            rightOffset += diff.value.length;
                        } else {
                            // Unchanged text - just advance offsets
                            leftOffset += diff.value.length;
                            rightOffset += diff.value.length;
                        }
                    });
                } catch (error) {
                    console.error('Error computing diff for line:', lineIndex, error);
                    // Fallback: highlight entire line if diff fails
                    if (line.leftText.trim()) {
                        leftDecorations.push({
                            range: new monacoRef.current.Range(lineNum, 1, lineNum, line.leftText.length + 1),
                            options: {
                                isWholeLine: false,
                                className: 'word-diff-removed',
                                inlineClassName: 'word-diff-removed-inline'
                            }
                        });
                    }
                    if (line.rightText.trim()) {
                        rightDecorations.push({
                            range: new monacoRef.current.Range(lineNum, 1, lineNum, line.rightText.length + 1),
                            options: {
                                isWholeLine: false,
                                className: 'word-diff-added',
                                inlineClassName: 'word-diff-added-inline'
                            }
                        });
                    }
                }
            }
        });

        // Apply decorations to Monaco editors
        leftEditorRef.current.deltaDecorations([], leftDecorations);
        rightEditorRef.current.deltaDecorations([], rightDecorations);
    };

    // Perform line-by-line comparison
    useEffect(() => {
        const leftLines = leftText.split('\n');
        const rightLines = rightText.split('\n');

        const maxLines = Math.max(leftLines.length, rightLines.length);
        const newDiffLines: DiffLine[] = [];

        for (let i = 0; i < maxLines; i++) {
            const leftLine = leftLines[i] || '';
            const rightLine = rightLines[i] || '';

            const hasDifference = leftLine !== rightLine;

            newDiffLines.push({
                leftText: leftLine,
                rightText: rightLine,
                leftLineNumber: i + 1,
                rightLineNumber: i + 1,
                hasDifference,
            });
        }

        setDiffLines(newDiffLines);
    }, [leftText, rightText]);

    // Apply highlights when diffLines change
    useEffect(() => {
        if (leftEditorRef.current && rightEditorRef.current) {
            applyWordHighlights();
        }
    }, [diffLines]);

    // Auto-detect language based on content
    useEffect(() => {
        detectLanguage();
    }, [leftText, rightText]);

    const detectLanguage = () => {
        const sampleText = leftText || rightText;

        if (sampleText.trim().startsWith('{') && sampleText.includes('"') && sampleText.includes(':')) {
            setLanguage('json');
        } else if (sampleText.includes('<?xml') || sampleText.includes('<html') || sampleText.trim().startsWith('<')) {
            setLanguage('xml');
        } else if (sampleText.includes('function') || sampleText.includes('const ') || sampleText.includes('let ')) {
            setLanguage('javascript');
        } else if (sampleText.includes('public class') || sampleText.includes('import java')) {
            setLanguage('java');
        } else if (sampleText.includes('using System') || sampleText.includes('namespace')) {
            setLanguage('csharp');
        } else if (sampleText.includes('def ') || sampleText.includes('import ')) {
            setLanguage('python');
        } else if (sampleText.includes('<?php')) {
            setLanguage('php');
        } else if (sampleText.includes('SELECT') || sampleText.includes('INSERT')) {
            setLanguage('sql');
        } else if (sampleText.includes('---') || sampleText.includes(': ')) {
            setLanguage('yaml');
        } else {
            setLanguage('plaintext');
        }
    };

    // Monaco Editor callbacks
    const handleEditorDidMount = (editor: any, isLeft: boolean) => {
        if (isLeft) {
            leftEditorRef.current = editor;
        } else {
            rightEditorRef.current = editor;
        }

        // Apply highlights after editor is mounted
        setTimeout(() => {
            applyWordHighlights();
        }, 100);
    };

    const handleMonacoMount = (monaco: any) => {
        monacoRef.current = monaco;
    };

    // Copy line from left to right
    const copyLeftToRight = (lineIndex: number) => {
        try {
            const leftLines = leftText.split('\n');
            const rightLines = rightText.split('\n');

            while (rightLines.length <= lineIndex) {
                rightLines.push('');
            }

            rightLines[lineIndex] = leftLines[lineIndex] || '';
            setRightText(rightLines.join('\n'));
        } catch (error) {
            console.error('Error copying left to right:', error);
        }
    };

    // Copy line from right to left
    const copyRightToLeft = (lineIndex: number) => {
        try {
            const leftLines = leftText.split('\n');
            const rightLines = rightText.split('\n');

            while (leftLines.length <= lineIndex) {
                leftLines.push('');
            }

            leftLines[lineIndex] = rightLines[lineIndex] || '';
            setLeftText(leftLines.join('\n'));
        } catch (error) {
            console.error('Error copying right to left:', error);
        }
    };

    // Clear both editors
    const clearBoth = () => {
        setLeftText('');
        setRightText('');
    };

    // Swap content between left and right
    const swapContent = () => {
        setLeftText(rightText);
        setRightText(leftText);
    };

    // Paste to left editor
    const pasteToLeft = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setLeftText(text);
        } catch (error) {
            console.error('Failed to read clipboard:', error);
            alert('Clipboard access not supported. Please paste using Ctrl+V in the editor.');
        }
    };

    // Paste to right editor
    const pasteToRight = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setRightText(text);
        } catch (error) {
            console.error('Failed to read clipboard:', error);
            alert('Clipboard access not supported. Please paste using Ctrl+V in the editor.');
        }
    };

    // Copy from left to right
    const copyFromLeftToRight = () => {
        setRightText(leftText);
    };

    // Copy from right to left
    const copyFromRightToLeft = () => {
        setLeftText(rightText);
    };

    // Load sample code
    const loadSampleCode = () => {
        const samples: { [key: string]: { left: string, right: string } } = {
            json: {
                left: `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "active": true
}`,
                right: `{
  "name": "Jane Smith",
  "age": 25,
  "email": "jane@example.com",
  "active": false
}`
            },
            javascript: {
                left: `function calculateTotal(price, quantity) {
  const subtotal = price * quantity;
  const tax = subtotal * 0.1;
  return subtotal + tax;
}`,
                right: `function calculateTotal(price, quantity) {
  const subtotal = price * quantity;
  const tax = subtotal * 0.15;
  return subtotal + tax;
}`
            },
            python: {
                left: `def calculate_total(price, quantity):
    subtotal = price * quantity
    tax = subtotal * 0.1
    return subtotal + tax`,
                right: `def calculate_total(price, quantity):
    subtotal = price * quantity
    tax = subtotal * 0.15
    return subtotal + tax`
            }
        };

        const sample = samples[language] || {
            left: `Left side example text\nwith some differences here\nand more changes there`,
            right: `Right side example text\nwith some variations here\nand more modifications there`
        };

        setLeftText(sample.left);
        setRightText(sample.right);
    };

    // Format code based on language
    const formatCode = () => {
        try {
            switch (language) {
                case 'json':
                    formatJSON();
                    break;
                case 'javascript':
                case 'typescript':
                    formatJavaScript();
                    break;
                case 'html':
                    formatHTML();
                    break;
                case 'css':
                    formatCSS();
                    break;
                case 'xml':
                    formatXML();
                    break;
                case 'python':
                    formatPython();
                    break;
                case 'sql':
                    formatSQL();
                    break;
                case 'yaml':
                    formatYAML();
                    break;
                default:
                    // For plaintext and other languages, just trim and normalize whitespace
                    formatPlainText();
                    break;
            }
        } catch (error) {
            console.error('Formatting error:', error);
            alert(`Failed to format ${language} code. The content might be invalid.`);
        }
    };

    // Format JSON
    const formatJSON = () => {
        try {
            const formattedLeft = JSON.stringify(JSON.parse(leftText), null, 2);
            const formattedRight = JSON.stringify(JSON.parse(rightText), null, 2);
            setLeftText(formattedLeft);
            setRightText(formattedRight);
        } catch (error) {
            alert('Invalid JSON format. Please check your JSON syntax.');
        }
    };

    // Format JavaScript/TypeScript (basic indentation)
    const formatJavaScript = () => {
        const formattedLeft = formatCodeWithIndentation(leftText);
        const formattedRight = formatCodeWithIndentation(rightText);
        setLeftText(formattedLeft);
        setRightText(formattedRight);
    };

    // Format HTML (basic indentation)
    const formatHTML = () => {
        const formattedLeft = formatHTMLWithIndentation(leftText);
        const formattedRight = formatHTMLWithIndentation(rightText);
        setLeftText(formattedLeft);
        setRightText(formattedRight);
    };

    // Format CSS (basic indentation)
    const formatCSS = () => {
        const formattedLeft = formatCSSWithIndentation(leftText);
        const formattedRight = formatCSSWithIndentation(rightText);
        setLeftText(formattedLeft);
        setRightText(formattedRight);
    };

    // Format XML (basic indentation)
    const formatXML = () => {
        const formattedLeft = formatXMLWithIndentation(leftText);
        const formattedRight = formatXMLWithIndentation(rightText);
        setLeftText(formattedLeft);
        setRightText(formattedRight);
    };

    // Format Python (basic indentation preservation)
    const formatPython = () => {
        // Python relies on indentation, so we just ensure consistent spacing
        const formattedLeft = leftText.replace(/\t/g, '    ').replace(/[ ]{2,}/g, '    ');
        const formattedRight = rightText.replace(/\t/g, '    ').replace(/[ ]{2,}/g, '    ');
        setLeftText(formattedLeft);
        setRightText(formattedRight);
    };

    // Format SQL (basic formatting)
    const formatSQL = () => {
        const formattedLeft = formatSQLWithIndentation(leftText);
        const formattedRight = formatSQLWithIndentation(rightText);
        setLeftText(formattedLeft);
        setRightText(formattedRight);
    };

    // Format YAML (basic indentation)
    const formatYAML = () => {
        const formattedLeft = formatYAMLWithIndentation(leftText);
        const formattedRight = formatYAMLWithIndentation(rightText);
        setLeftText(formattedLeft);
        setRightText(formattedRight);
    };

    // Format plain text (trim and normalize)
    const formatPlainText = () => {
        const formattedLeft = leftText.split('\n').map(line => line.trimEnd()).join('\n');
        const formattedRight = rightText.split('\n').map(line => line.trimEnd()).join('\n');
        setLeftText(formattedLeft);
        setRightText(formattedRight);
    };

    // Helper function for basic code indentation
    const formatCodeWithIndentation = (code: string): string => {
        return code.split('\n').map(line => {
            // Remove trailing whitespace
            let formatted = line.trimEnd();
            // Basic indentation preservation
            return formatted;
        }).join('\n');
    };

    // Basic HTML formatting
    const formatHTMLWithIndentation = (html: string): string => {
        let indentLevel = 0;
        const lines = html.split('\n');
        const formatted = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('</')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            const indented = '  '.repeat(indentLevel) + trimmed;
            if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
                indentLevel++;
            }
            return indented;
        }).join('\n');
        return formatted;
    };

    // Basic CSS formatting
    const formatCSSWithIndentation = (css: string): string => {
        let indentLevel = 0;
        const lines = css.split('\n');
        const formatted = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.endsWith('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            const indented = '  '.repeat(indentLevel) + trimmed;
            if (trimmed.endsWith('{')) {
                indentLevel++;
            }
            return indented;
        }).join('\n');
        return formatted;
    };

    // Basic XML formatting
    const formatXMLWithIndentation = (xml: string): string => {
        return formatHTMLWithIndentation(xml); // Similar to HTML
    };

    // Basic SQL formatting
    const formatSQLWithIndentation = (sql: string): string => {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'GROUP BY', 'ORDER BY', 'HAVING'];
        let lines = sql.split('\n');
        lines = lines.map(line => {
            let formatted = line.trim();
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                formatted = formatted.replace(regex, keyword);
            });
            return formatted;
        });
        return lines.join('\n');
    };

    // Basic YAML formatting
    const formatYAMLWithIndentation = (yaml: string): string => {
        const lines = yaml.split('\n');
        const formatted = lines.map(line => {
            // Preserve YAML indentation but ensure consistent 2-space indentation
            const match = line.match(/^(\s*)/);
            const indent = match ? match[1] : '';
            const spaces = indent.replace(/\t/g, '    ').length;
            const content = line.trim();
            return '  '.repeat(Math.floor(spaces / 2)) + content;
        }).join('\n');
        return formatted;
    };

    return (
        <div className="text-comparer">
            <div className="comparer-header">
                <h2>Code & Text Comparer</h2>
                <div className="toolbar">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="language-select"
                    >
                        {languageOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <button onClick={loadSampleCode}>📋 Load Sample</button>
                    <button onClick={formatCode}>🛠️ Format</button>
                    <button onClick={pasteToLeft}>📋 Paste Left</button>
                    <button onClick={pasteToRight}>📋 Paste Right</button>
                    <button onClick={copyFromLeftToRight}>📄 Copy Left → Right</button>
                    <button onClick={copyFromRightToLeft}>📄 Copy Right → Left</button>
                    <button onClick={swapContent}>🔄 Swap</button>
                    <button onClick={clearBoth}>🗑️ Clear</button>
                    <button onClick={() => setEditorTheme(editorTheme === 'vs' ? 'vs-dark' : 'vs')}>
                        {editorTheme === 'vs' ? '🌙 Dark' : '☀️ Light'}
                    </button>
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className={`help-btn ${showHelp ? 'active' : ''}`}
                    >
                        {showHelp ? '❌ Hide Help' : '❓ Show Help'}
                    </button>
                </div>
            </div>

            {/* Help Banner */}
            {showHelp && (
                <div className="help-banner">
                    <div className="help-content">
                        <div className="help-item">
                            <span className="color-sample removed-sample"></span>
                            <span>Text A (Left): Shows <strong>removed words</strong> with red background and strikethrough</span>
                        </div>
                        <div className="help-item">
                            <span className="color-sample added-sample"></span>
                            <span>Text B (Right): Shows <strong>added words</strong> with green background</span>
                        </div>
                        <div className="help-tip">
                            💡 <strong>Tip:</strong> Use the Format button to beautify code for better comparison.
                        </div>
                    </div>
                </div>
            )}

            <div className="comparer-container">
                {/* Text A Panel - With Word Highlighting */}
                <div className="text-panel left-panel">
                    <div className="panel-header">
                        <h3>Text A</h3>
                        <span className="line-count">{leftText.split('\n').length} lines</span>
                    </div>
                    <div className="editor-container">
                        <Editor
                            height="100%"
                            language={language}
                            value={leftText}
                            onChange={(value) => setLeftText(value || '')}
                            onMount={(editor) => handleEditorDidMount(editor, true)}
                            beforeMount={handleMonacoMount}
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

                {/* Line Actions Panel - Reduced Width */}
                <div className="comparison-panel">
                    <div className="panel-header">
                        <h3>Actions</h3>
                        <span className="diff-count">
                            {diffLines.filter(line => line.hasDifference).length} diff
                        </span>
                    </div>
                    <div
                        ref={actionsPanelRef}
                        className="diff-actions-panel"
                    >
                        <div className="actions-container">
                            {diffLines.map((line, index) => (
                                <div
                                    key={index}
                                    className={`action-line ${line.hasDifference ? 'different' : ''}`}
                                >
                                    <div className="line-number">
                                        {index + 1}
                                    </div>
                                    {line.hasDifference && (
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => copyLeftToRight(index)}
                                                className="action-btn left-to-right"
                                                title={`Copy line ${index + 1} from left to right`}
                                            >
                                                →
                                            </button>
                                            <button
                                                onClick={() => copyRightToLeft(index)}
                                                className="action-btn right-to-left"
                                                title={`Copy line ${index + 1} from right to left`}
                                            >
                                                ←
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Text B Panel - With Word Highlighting */}
                <div className="text-panel right-panel">
                    <div className="panel-header">
                        <h3>Text B</h3>
                        <span className="line-count">{rightText.split('\n').length} lines</span>
                    </div>
                    <div className="editor-container">
                        <Editor
                            height="100%"
                            language={language}
                            value={rightText}
                            onChange={(value) => setRightText(value || '')}
                            onMount={(editor) => handleEditorDidMount(editor, false)}
                            beforeMount={handleMonacoMount}
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
            </div>

            {/* Summary */}
            <div className="comparer-summary">
                <div className="summary-item">
                    <span className="label">Language:</span>
                    <span className="value language-name">
                        {languageOptions.find(opt => opt.value === language)?.label || language}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="label">Total lines:</span>
                    <span className="value">{diffLines.length}</span>
                </div>
                <div className="summary-item">
                    <span className="label">Differences:</span>
                    <span className="value diff-count">
                        {diffLines.filter(line => line.hasDifference).length}
                    </span>
                </div>
                <div className="summary-item">
                    <span className="label">Matching lines:</span>
                    <span className="value match-count">
                        {diffLines.filter(line => !line.hasDifference).length}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TextComparer;