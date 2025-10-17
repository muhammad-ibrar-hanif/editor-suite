// src/components/TextAreaWithLines.tsx
import React, { useRef, useEffect } from 'react';

interface TextAreaWithLinesProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    error?: boolean;
    errorLine?: number;
    onScroll?: (scrollTop: number) => void;
    height?: number;
}

const TextAreaWithLines: React.FC<TextAreaWithLinesProps> = ({
    value,
    onChange,
    className = '',
    placeholder = '',
    error = false,
    errorLine,
    onScroll,
    height = 500
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const linesRef = useRef<HTMLDivElement>(null);

    // Sync scroll between textarea and line numbers
    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (linesRef.current) {
            linesRef.current.scrollTop = scrollTop;
        }
        onScroll?.(scrollTop);
    };

    // Calculate line numbers
    const lineCount = value.split('\n').length || 1;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    // Auto-resize line numbers when content changes
    useEffect(() => {
        if (textareaRef.current && linesRef.current) {
            linesRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }, [value]);

    return (
        <div
            className={`flex border rounded-md overflow-hidden ${error
                    ? 'border-red-400 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                } ${className}`}
            style={{ height: `${height}px` }}
        >
            {/* Line Numbers */}
            <div
                ref={linesRef}
                className="flex flex-col items-end p-3 bg-gray-50 border-r border-gray-200 overflow-y-auto overflow-x-hidden text-right select-none dark:bg-gray-800 dark:border-gray-600 custom-scrollbar"
                style={{
                    minWidth: '50px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: '20px'
                }}
            >
                {lineNumbers.map(num => (
                    <div
                        key={num}
                        className={`pr-2 leading-5 w-full ${errorLine === num
                                ? 'bg-red-500 text-white font-bold rounded dark:bg-red-600'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {num}
                    </div>
                ))}
            </div>

            {/* Text Area */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                placeholder={placeholder}
                className="flex-1 p-3 font-mono text-sm focus:outline-none resize-none overflow-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 custom-scrollbar"
                style={{
                    lineHeight: '20px',
                }}
                spellCheck={false}
            />
        </div>
    );
};

export default TextAreaWithLines;