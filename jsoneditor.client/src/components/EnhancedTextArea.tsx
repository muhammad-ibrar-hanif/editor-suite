// src/components/EnhancedTextArea.tsx
import React from 'react';
import TextAreaWithLines from './TextAreaWithLines';
import TextHighlighter from './TextHighlighter';
import type { SearchMatch } from '../utils/searchUtils';

interface EnhancedTextAreaProps {
    value: string;
    onChange: (value: string) => void;
    errorLine?: number;
    errorMessage?: string;
    className?: string;
    height?: number;
    searchMatches?: SearchMatch[];
    currentMatchIndex?: number;
}

const EnhancedTextArea: React.FC<EnhancedTextAreaProps> = ({
    value,
    onChange,
    errorLine,
    errorMessage,
    className = '',
    height = 500,
    searchMatches = [],
    currentMatchIndex = -1
}) => {
    return (
        <div className="relative">
            <TextAreaWithLines
                value={value}
                onChange={onChange}
                className={className}
                error={!!errorLine}
                height={height}
                errorLine={errorLine}
            />

            {/* Search Result Highlighting */}
            <TextHighlighter
                text={value}
                matches={searchMatches}
                currentMatchIndex={currentMatchIndex}
            />

            {/* Error message */}
            {errorMessage && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};

export default EnhancedTextArea;