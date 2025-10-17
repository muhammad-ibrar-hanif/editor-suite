// src/components/SearchBar.tsx
import React from "react";

interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    resultsCount?: number;
    currentResult?: number;
    onNextResult?: () => void;
    onPrevResult?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    searchTerm,
    setSearchTerm,
    resultsCount = 0,
    currentResult = 0,
    onNextResult,
    onPrevResult
}) => {
    return (
        <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="Search in JSON tree..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border p-2 rounded text-sm pl-8"
                />
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                </div>
            </div>

            {searchTerm && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                        {resultsCount > 0 ? `${currentResult}/${resultsCount}` : '0 results'}
                    </span>

                    {resultsCount > 0 && (
                        <div className="flex gap-1">
                            <button
                                onClick={onPrevResult}
                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                                disabled={resultsCount <= 1}
                            >
                                ↑
                            </button>
                            <button
                                onClick={onNextResult}
                                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                                disabled={resultsCount <= 1}
                            >
                                ↓
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setSearchTerm("")}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};

export default SearchBar;