// src/components/TextComparer.tsx
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './TextComparer.css';

interface DiffLine {
    leftText: string;
    rightText: string;
    leftLineNumber: number;
    rightLineNumber: number;
    hasDifference: boolean;
    wordDiffs?: WordDiff[];
}

interface WordDiff {
    value: string;
    added?: boolean;
    removed?: boolean;
}

const TextComparer = () => {
    const [leftText, setLeftText] = useState('// JSON Example\n{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}');
    const [rightText, setRightText] = useState('// JSON Example\n{\n  "name": "Jane",\n  "age": 25,\n  "city": "London"\n}');
    const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
    const [language, setLanguage] = useState<string>('plaintext');
    const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs');

    const leftEditorRef = useRef<any>(null);
    const rightEditorRef = useRef<any>(null);
    const actionsPanelRef = useRef<HTMLDivElement>(null);

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

    // Simple word-level diff algorithm
    const computeWordDiffs = (left: string, right: string): { leftDiffs: WordDiff[], rightDiffs: WordDiff[] } => {
        if (left === right) {
            return {
                leftDiffs: [{ value: left }],
                rightDiffs: [{ value: right }]
            };
        }

        const leftWords = left.split(/(\s+)/).filter(word => word.length > 0);
        const rightWords = right.split(/(\s+)/).filter(word => word.length > 0);

        const leftDiffs: WordDiff[] = [];
        const rightDiffs: WordDiff[] = [];

        let i = 0, j = 0;

        while (i < leftWords.length || j < rightWords.length) {
            if (i < leftWords.length && j < rightWords.length && leftWords[i] === rightWords[j]) {
                // Words match
                leftDiffs.push({ value: leftWords[i] });
                rightDiffs.push({ value: rightWords[j] });
                i++;
                j++;
            } else {
                // Words don't match - find the best match
                let foundMatch = false;

                // Look ahead in right for current left word
                for (let k = j + 1; k < rightWords.length; k++) {
                    if (leftWords[i] === rightWords[k]) {
                        // Add removed words from left and added words from right
                        for (let l = j; l < k; l++) {
                            rightDiffs.push({ value: rightWords[l], added: true });
                        }
                        leftDiffs.push({ value: leftWords[i], removed: true });
                        j = k + 1;
                        i++;
                        foundMatch = true;
                        break;
                    }
                }

                // Look ahead in left for current right word
                if (!foundMatch) {
                    for (let k = i + 1; k < leftWords.length; k++) {
                        if (leftWords[k] === rightWords[j]) {
                            // Add removed words from left and added words from right
                            for (let l = i; l < k; l++) {
                                leftDiffs.push({ value: leftWords[l], removed: true });
                            }
                            rightDiffs.push({ value: rightWords[j], added: true });
                            i = k + 1;
                            j++;
                            foundMatch = true;
                            break;
                        }
                    }
                }

                // If no match found, mark both as different
                if (!foundMatch) {
                    if (i < leftWords.length) {
                        leftDiffs.push({ value: leftWords[i], removed: true });
                        i++;
                    }
                    if (j < rightWords.length) {
                        rightDiffs.push({ value: rightWords[j], added: true });
                        j++;
                    }
                }
            }
        }

        return { leftDiffs, rightDiffs };
    };

    // Perform line-by-line comparison with word-level diffs
    useEffect(() => {
        const leftLines = leftText.split('\n');
        const rightLines = rightText.split('\n');

        const maxLines = Math.max(leftLines.length, rightLines.length);
        const newDiffLines: DiffLine[] = [];

        for (let i = 0; i < maxLines; i++) {
            const leftLine = leftLines[i] || '';
            const rightLine = rightLines[i] || '';
            const hasDifference = leftLine !== rightLine;

            let wordDiffs: { leftDiffs: WordDiff[], rightDiffs: WordDiff[] } | undefined;

            if (hasDifference) {
                wordDiffs = computeWordDiffs(leftLine, rightLine);
            }

            newDiffLines.push({
                leftText: leftLine,
                rightText: rightLine,
                leftLineNumber: i + 1,
                rightLineNumber: i + 1,
                hasDifference,
                wordDiffs: wordDiffs ? { leftDiffs: wordDiffs.leftDiffs, rightDiffs: wordDiffs.rightDiffs } : undefined
            });
        }

        setDiffLines(newDiffLines);
    }, [leftText, rightText]);

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
    const handleLeftEditorDidMount = (editor: any) => {
        leftEditorRef.current = editor;
    };

    const handleRightEditorDidMount = (editor: any) => {
        rightEditorRef.current = editor;
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

    // Copy from left editor
    const copyFromLeft = async () => {
        try {
            await navigator.clipboard.writeText(leftText);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    // Copy from right editor
    const copyFromRight = async () => {
        try {
            await navigator.clipboard.writeText(rightText);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
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
            }
        };

        const sample = samples[language] || {
            left: `Left side example text\nwith some differences here\nand more changes there`,
            right: `Right side example text\nwith some variations here\nand more modifications there`
        };

        setLeftText(sample.left);
        setRightText(sample.right);
    };

    // Format code
    const formatCode = () => {
        alert(`Formatting for ${language} would be implemented here with proper formatters`);
    };

    // Render word differences with highlighting
    const renderWordDiffs = (diffs: WordDiff[], isLeft: boolean) => {
        return diffs.map((diff, index) => {
            if (diff.removed) {
                return (
                    <span key={index} className="diff-word removed">
                        {diff.value}
                    </span>
                );
            } else if (diff.added) {
                return (
                    <span key={index} className="diff-word added">
                        {diff.value}
                    </span>
                );
            } else {
                return (
                    <span key={index} className="diff-word same">
                        {diff.value}
                    </span>
                );
            }
        });
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
                    <button onClick={copyFromLeft}>📄 Copy Left</button>
                    <button onClick={copyFromRight}>📄 Copy Right</button>
                    <button onClick={swapContent}>🔄 Swap</button>
                    <button onClick={clearBoth}>🗑️ Clear</button>
                    <button onClick={() => setEditorTheme(editorTheme === 'vs' ? 'vs-dark' : 'vs')}>
                        {editorTheme === 'vs' ? '🌙 Dark' : '☀️ Light'}
                    </button>
                </div>
            </div>

            <div className="comparer-container">
                {/* Left Panel */}
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
                            onMount={handleLeftEditorDidMount}
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

                {/* Comparison Panel */}
                <div className="comparison-panel">
                    <div className="panel-header">
                        <h3>Line Actions</h3>
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
                                    <div className="line-number">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
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
                            onMount={handleRightEditorDidMount}
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

            {/* Word Diff Preview */}
            {diffLines.some(line => line.hasDifference && line.wordDiffs) && (
                <div className="word-diff-preview">
                    <div className="preview-header">
                        <h4>🔍 Word-level Differences</h4>
                    </div>
                    <div className="preview-content">
                        {diffLines
                            .filter(line => line.hasDifference && line.wordDiffs)
                            .map((line, index) => (
                                <div key={index} className="word-diff-line">
                                    <div className="diff-line-number">Line {line.leftLineNumber}:</div>
                                    <div className="word-diffs">
                                        <div className="left-diff">
                                            <strong>Left:</strong>
                                            {line.wordDiffs && renderWordDiffs(line.wordDiffs.leftDiffs, true)}
                                        </div>
                                        <div className="right-diff">
                                            <strong>Right:</strong>
                                            {line.wordDiffs && renderWordDiffs(line.wordDiffs.rightDiffs, false)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

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