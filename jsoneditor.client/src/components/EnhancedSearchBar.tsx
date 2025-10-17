// src/components/EnhancedSearchBar.tsx - Complete Dark Mode Version
import React, { useState, useEffect } from "react";
import { validateRegex } from "../utils/searchUtils";

interface EnhancedSearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    replaceTerm: string;
    setReplaceTerm: (term: string) => void;
    resultsCount: number;
    currentResult: number;
    onNextResult: () => void;
    onPrevResult: () => void;
    onReplace: () => void;
    onReplaceAll: () => void;
    matchCase: boolean;
    setMatchCase: (value: boolean) => void;
    useRegex: boolean;
    setUseRegex: (value: boolean) => void;
    showReplace: boolean;
    setShowReplace: (value: boolean) => void;
    isSearching?: boolean;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
    searchTerm,
    setSearchTerm,
    replaceTerm,
    setReplaceTerm,
    resultsCount,
    currentResult,
    onNextResult,
    onPrevResult,
    onReplace,
    onReplaceAll,
    matchCase,
    setMatchCase,
    useRegex,
    setUseRegex,
    showReplace,
    setShowReplace,
    isSearching = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [regexError, setRegexError] = useState("");

    // Validate regex when term changes and regex is enabled
    useEffect(() => {
        if (useRegex && searchTerm) {
            if (!validateRegex(searchTerm)) {
                setRegexError("Invalid regex pattern");
            } else {
                setRegexError("");
            }
        } else {
            setRegexError("");
        }
    }, [searchTerm, useRegex]);

    const handleSearchTermChange = (newTerm: string) => {
        setSearchTerm(newTerm);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setRegexError("");
    };

    const isSearchDisabled = resultsCount === 0 || !!regexError || isSearching;
    const isReplaceDisabled = isSearchDisabled || !replaceTerm;

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 dark:bg-gray-800 dark:border-gray-700">
            {/* Main Search Row */}
            <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search in JSON..."
                        value={searchTerm}
                        onChange={(e) => handleSearchTermChange(e.target.value)}
                        className={`w-full border p-2 rounded text-sm pl-8 ${regexError
                                ? 'border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
                            } ${isSearching ? 'opacity-70' : ''}`}
                        disabled={isSearching}
                    />
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        {isSearching ? '⏳' : '🔍'}
                    </div>
                    {regexError && (
                        <div
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 dark:text-red-400"
                            title={regexError}
                        >
                            ⚠️
                        </div>
                    )}
                </div>

                {/* Search Controls */}
                <div className="flex items-center gap-1">
                    <span className={`text-sm whitespace-nowrap px-2 min-w-[80px] ${isSearching
                            ? 'text-blue-600 dark:text-blue-400'
                            : resultsCount > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-600 dark:text-gray-400'
                        }`}>
                        {isSearching ? 'Searching...' :
                            resultsCount > 0 ? `${currentResult}/${resultsCount}` : '0 matches'}
                    </span>

                    <button
                        onClick={onPrevResult}
                        disabled={isSearchDisabled}
                        className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                        title="Previous match (Shift+F3)"
                    >
                        ↑
                    </button>
                    <button
                        onClick={onNextResult}
                        disabled={isSearchDisabled}
                        className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                        title="Next match (F3)"
                    >
                        ↓
                    </button>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                        title="More options"
                    >
                        ⚙️
                    </button>

                    {searchTerm && (
                        <button
                            onClick={handleClearSearch}
                            disabled={isSearching}
                            className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Regex Error Message */}
            {regexError && (
                <div className="text-red-500 text-sm mb-2 flex items-center gap-2 dark:text-red-400">
                    <span>⚠️</span>
                    <span>{regexError}</span>
                </div>
            )}

            {/* Expanded Options & Replace */}
            {isExpanded && (
                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {/* Search Options */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={matchCase}
                                onChange={(e) => setMatchCase(e.target.checked)}
                                className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                disabled={isSearching}
                            />
                            Match case
                        </label>

                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={useRegex}
                                onChange={(e) => setUseRegex(e.target.checked)}
                                className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                disabled={isSearching}
                            />
                            Regex
                        </label>

                        <button
                            onClick={() => setShowReplace(!showReplace)}
                            disabled={isSearching}
                            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            {showReplace ? 'Hide Replace' : 'Replace...'}
                        </button>
                    </div>

                    {/* Replace Section */}
                    {showReplace && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Replace with..."
                                    value={replaceTerm}
                                    onChange={(e) => setReplaceTerm(e.target.value)}
                                    className="flex-1 border p-2 rounded text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                    disabled={isSearching}
                                />

                                <button
                                    onClick={onReplace}
                                    disabled={isSearchDisabled}
                                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    Replace
                                </button>

                                <button
                                    onClick={onReplaceAll}
                                    disabled={isReplaceDisabled}
                                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors dark:bg-red-600 dark:hover:bg-red-700"
                                >
                                    Replace All
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Regex Help Text */}
                    {useRegex && !regexError && (
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200 dark:text-gray-400 dark:bg-blue-900/20 dark:border-blue-800">
                            <div className="font-semibold mb-1 dark:text-blue-300">Regex Examples:</div>
                            <div className="space-y-1">
                                <div><code>"name"</code> - Find "name" properties</div>
                                <div><code>"name":\s*"([^"]*)"</code> - Find name values</div>
                                <div><code>\d+</code> - Find numbers</div>
                                <div><code>true|false</code> - Find booleans</div>
                            </div>
                        </div>
                    )}

                    {/* Performance Warning */}
                    {useRegex && searchTerm.length > 10 && (
                        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800">
                            ⚡ Complex regex patterns may take longer to search
                        </div>
                    )}
                </div>
            )}

            {/* Loading Indicator */}
            {isSearching && (
                <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center dark:bg-gray-800 dark:bg-opacity-50">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <span className="text-sm">Searching...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedSearchBar;