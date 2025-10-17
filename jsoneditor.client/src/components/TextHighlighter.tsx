// src/components/TextHighlighter.tsx
import React from 'react';
import type { SearchMatch } from '../utils/searchUtils'; // Type-only import

interface TextHighlighterProps {
    text: string;
    matches: SearchMatch[];
    currentMatchIndex: number;
}

const TextHighlighter: React.FC<TextHighlighterProps> = ({
    text,
    matches,
    currentMatchIndex
}) => {
    if (matches.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none">
            {matches.map((match, index) => (
                <div
                    key={index}
                    className="absolute left-0 right-0 rounded"
                    style={{
                        top: `${(match.line - 1) * 20}px`,
                        height: '20px',
                        marginLeft: '50px',
                        backgroundColor: index === currentMatchIndex
                            ? 'rgba(255, 255, 0, 0.6)' // Current match - bright yellow
                            : 'rgba(255, 255, 0, 0.3)', // Other matches - dim yellow
                        border: index === currentMatchIndex
                            ? '2px solid orange'
                            : 'none',
                        zIndex: 1
                    }}
                />
            ))}
        </div>
    );
};

export default TextHighlighter;