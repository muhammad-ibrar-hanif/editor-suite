// components/Navigation.tsx
import React from 'react';

interface NavigationProps {
    currentView: 'json' | 'xml' | 'yaml' | 'comparer';
    onViewChange: (view: 'json' | 'xml' | 'yaml' | 'comparer') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
    return (
        <nav className="navigation">
            <div className="nav-container">
                <h1 className="nav-logo">Editor Suite</h1>
                <div className="nav-buttons">
                    <button
                        className={`nav-button ${currentView === 'json' ? 'active' : ''}`}
                        onClick={() => onViewChange('json')}
                    >
                        {`{}`} JSON Editor
                    </button>
                    <button
                        className={`nav-button ${currentView === 'xml' ? 'active' : ''}`}
                        onClick={() => onViewChange('xml')}
                    >
                        📄 XML Editor
                    </button>
                    <button
                        className={`nav-button ${currentView === 'yaml' ? 'active' : ''}`}
                        onClick={() => onViewChange('yaml')}
                    >
                        📝 YAML Editor
                    </button>
                    <button
                        className={`nav-button ${currentView === 'comparer' ? 'active' : ''}`}
                        onClick={() => onViewChange('comparer')}
                    >
                        📊 Text Comparer
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;