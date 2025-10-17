// pages/TextComparer.tsx
import React from 'react';
import TextComparer from '../components/TextComparer';

const TextComparerPage: React.FC = () => {
    return (
        <div className="editor-page">
            <div className="page-header">
                <h2>Text Comparer</h2>
                <p>Compare and sync text between two panels with real-time difference highlighting</p>
            </div>
            <TextComparer />
        </div>
    );
};

export default TextComparerPage;