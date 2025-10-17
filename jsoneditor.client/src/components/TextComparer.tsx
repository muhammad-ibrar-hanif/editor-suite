// src/components/TextComparer.tsx
import React, { useState, useEffect, useRef } from 'react';
import './TextComparer.css';

interface DiffLine {
    leftText: string;
    rightText: string;
    leftLineNumber: number;
    rightLineNumber: number;
    hasDifference: boolean;
}

const TextComparer = () => {
    const [leftText, setLeftText] = useState('Hello world!\nThis is the left side\nSome same text\nDifferent line here');
    const [rightText, setRightText] = useState('Hello world!\nThis is the right side\nSome same text\nDifferent content here');
    const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
    const leftContentRef = useRef<HTMLDivElement>(null);
    const rightContentRef = useRef<HTMLDivElement>(null);
    const actionsPanelRef = useRef<HTMLDivElement>(null);
    const leftLineNumbersRef = useRef<HTMLDivElement>(null);
    const rightLineNumbersRef = useRef<HTMLDivElement>(null);

    // Perform line-by-line comparison
    useEffect(() => {
        const leftLines = leftText.split('\n');
        const rightLines = rightText.split('\n');

        const maxLines = Math.max(leftLines.length, rightLines.length);
        const newDiffLines: DiffLine[] = [];

        for (let i = 0; i < maxLines; i++) {
            const leftLine = leftLines[i] || '';
            const rightLine = rightLines[i] || '';

            newDiffLines.push({
                leftText: leftLine,
                rightText: rightLine,
                leftLineNumber: i + 1,
                rightLineNumber: i + 1,
                hasDifference: leftLine !== rightLine
            });
        }

        setDiffLines(newDiffLines);
    }, [leftText, rightText]);

    // Sync scrolling between all panels
    const syncScroll = (source: 'left' | 'right' | 'actions') => {
        const scrollElements = [
            leftContentRef.current,
            rightContentRef.current,
            actionsPanelRef.current,
            leftLineNumbersRef.current,
            rightLineNumbersRef.current
        ];

        if (scrollElements.every(el => el !== null)) {
            let scrollTop: number;

            if (source === 'left') {
                scrollTop = leftContentRef.current!.scrollTop;
            } else if (source === 'right') {
                scrollTop = rightContentRef.current!.scrollTop;
            } else {
                scrollTop = actionsPanelRef.current!.scrollTop;
            }

            // Sync all scrollable elements
            scrollElements.forEach(el => {
                if (el) {
                    el.scrollTop = scrollTop;
                }
            });
        }
    };

    // Copy line from left to right
    const copyLeftToRight = (lineIndex: number) => {
        const newRightLines = rightText.split('\n');
        newRightLines[lineIndex] = diffLines[lineIndex].leftText;
        setRightText(newRightLines.join('\n'));
    };

    // Copy line from right to left
    const copyRightToLeft = (lineIndex: number) => {
        const newLeftLines = leftText.split('\n');
        newLeftLines[lineIndex] = diffLines[lineIndex].rightText;
        setLeftText(newLeftLines.join('\n'));
    };

    // Clear both text areas
    const clearBoth = () => {
        setLeftText('');
        setRightText('');
    };

    // Swap content between left and right
    const swapContent = () => {
        setLeftText(rightText);
        setRightText(leftText);
    };

    // Highlight differences within a line
    const highlightDifferences = (leftStr: string, rightStr: string): { left: JSX.Element[], right: JSX.Element[] } => {
        if (leftStr === rightStr) {
            return {
                left: [<span key="0" className="text-same">{leftStr}</span>],
                right: [<span key="0" className="text-same">{rightStr}</span>]
            };
        }

        const leftChars = leftStr.split('');
        const rightChars = rightStr.split('');
        const maxLength = Math.max(leftChars.length, rightChars.length);

        const leftSpans: JSX.Element[] = [];
        const rightSpans: JSX.Element[] = [];

        for (let i = 0; i < maxLength; i++) {
            const leftChar = leftChars[i] || '';
            const rightChar = rightChars[i] || '';

            if (leftChar === rightChar) {
                // Same character
                if (leftSpans.length > 0 && leftSpans[leftSpans.length - 1].props.className === 'text-same') {
                    // Append to existing same span
                    const lastSpan = leftSpans.pop()!;
                    const lastRightSpan = rightSpans.pop()!;
                    leftSpans.push(
                        <span key={i} className="text-same">
                            {lastSpan.props.children + leftChar}
                        </span>
                    );
                    rightSpans.push(
                        <span key={i} className="text-same">
                            {lastRightSpan.props.children + rightChar}
                        </span>
                    );
                } else {
                    // Start new same span
                    leftSpans.push(<span key={i} className="text-same">{leftChar}</span>);
                    rightSpans.push(<span key={i} className="text-same">{rightChar}</span>);
                }
            } else {
                // Different character
                leftSpans.push(<span key={i} className="text-diff left-diff">{leftChar}</span>);
                rightSpans.push(<span key={i} className="text-diff right-diff">{rightChar}</span>);
            }
        }

        return { left: leftSpans, right: rightSpans };
    };

    return (
        <div className="text-comparer">
            <div className="comparer-header">
                <h2>Text Comparer</h2>
                <div className="toolbar">
                    <button onClick={clearBoth}>Clear Both</button>
                    <button onClick={swapContent}>Swap Content</button>
                </div>
            </div>

            <div className="comparer-container">
                {/* Left Panel - Shows LEFT text */}
                <div className="text-panel left-panel">
                    <div className="panel-header">
                        <h3>Text A</h3>
                        <span className="line-count">{leftText.split('\n').length} lines</span>
                    </div>
                    <div className="text-container">
                        <div
                            ref={leftLineNumbersRef}
                            className="line-numbers left-line-numbers"
                            onScroll={() => syncScroll('left')}
                        >
                            {diffLines.map((line, index) => (
                                <div
                                    key={index}
                                    className={`line-number ${line.hasDifference ? 'different' : ''}`}
                                >
                                    {line.leftLineNumber}
                                </div>
                            ))}
                        </div>
                        <div
                            ref={leftContentRef}
                            className="text-content left-content"
                            onScroll={() => syncScroll('left')}
                        >
                            {diffLines.map((line, index) => {
                                const highlighted = highlightDifferences(line.leftText, line.rightText);
                                return (
                                    <div
                                        key={index}
                                        className={`text-line ${line.hasDifference ? 'line-different' : ''}`}
                                    >
                                        {highlighted.left}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Comparison Panel - Only buttons */}
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
                        onScroll={() => syncScroll('actions')}
                    >
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
                                            title="Copy left to right"
                                        >
                                            →
                                        </button>
                                        <button
                                            onClick={() => copyRightToLeft(index)}
                                            className="action-btn right-to-left"
                                            title="Copy right to left"
                                        >
                                            ←
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel - Shows RIGHT text */}
                <div className="text-panel right-panel">
                    <div className="panel-header">
                        <h3>Text B</h3>
                        <span className="line-count">{rightText.split('\n').length} lines</span>
                    </div>
                    <div className="text-container">
                        <div
                            ref={rightContentRef}
                            className="text-content right-content"
                            onScroll={() => syncScroll('right')}
                        >
                            {diffLines.map((line, index) => {
                                const highlighted = highlightDifferences(line.leftText, line.rightText);
                                return (
                                    <div
                                        key={index}
                                        className={`text-line ${line.hasDifference ? 'line-different' : ''}`}
                                    >
                                        {highlighted.right}
                                    </div>
                                );
                            })}
                        </div>
                        <div
                            ref={rightLineNumbersRef}
                            className="line-numbers right-line-numbers"
                            onScroll={() => syncScroll('right')}
                        >
                            {diffLines.map((line, index) => (
                                <div
                                    key={index}
                                    className={`line-number ${line.hasDifference ? 'different' : ''}`}
                                >
                                    {line.rightLineNumber}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="comparer-summary">
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