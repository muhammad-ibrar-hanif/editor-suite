// src/pages/JsonEditorPage.tsx - UPDATED VERSION
import { useState, useEffect, useRef, useCallback } from "react";
import Toolbar from "../components/Toolbar";
import TreeView from "../components/TreeView";
import EnhancedSearchBar from "../components/EnhancedSearchBar";
import UrlLoaderModal from "../components/UrlLoaderModal";
import Notification from "../components/Notification";
import EnhancedTextArea from "../components/EnhancedTextArea";
import { useUndoRedo } from "../hooks/useUndoRedo";
import type { SearchMatch } from "../utils/searchUtils";
import { findAllMatches, replaceMatch, replaceAllMatches } from "../utils/searchUtils";
import {
    formatJson,
    minifyJson,
    removeWhitespace,
    validateJsonDetailed,
    downloadJsonFile,
    readFileAsText,
    fetchJsonFromUrl,
    generateFilename
} from "../utils/jsonUtils";
import ExportPanel from '../components/ExportPanel';
import type { SchemaValidationResult } from '../utils/schemaUtils';
import SEOLanding from '../components/SEOLanding';
import ConversionModal from '../components/ConversionModal';

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const JsonEditorPage: React.FC = () => {
    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Undo/Redo State
    const {
        state: leftJson,
        setState: setLeftJson,
        undo: undoLeft,
        redo: redoLeft,
        canUndo: canUndoLeft,
        canRedo: canRedoLeft,
    } = useUndoRedo(`{
  "name": "John Doe",
  "age": 30,
  "active": true,
  "hobbies": ["reading", "gaming", "coding"],
  "address": {
    "street": "123 Main St",
    "city": "Boston",
    "coordinates": { "lat": 42.3601, "lng": -71.0589 }
  }
}`);

    // Basic States
    const [rightJson, setRightJson] = useState(leftJson);
    const [searchTerm, setSearchTerm] = useState("");
    const [replaceTerm, setReplaceTerm] = useState("");
    const [matchCase, setMatchCase] = useState(false);
    const [useRegex, setUseRegex] = useState(false);
    const [showReplace, setShowReplace] = useState(false);
    const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
    const [searchResults, setSearchResults] = useState<number>(0);
    const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(0);
    const [leftView, setLeftView] = useState<"text" | "tree">("text");
    const [rightView, setRightView] = useState<"text" | "tree">("tree");
    const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [urlError, setUrlError] = useState("");
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms delay
    const [isSearching, setIsSearching] = useState(false);
    const searchControllerRef = useRef<AbortController | null>(null);
    const [showSchemaValidator, setShowSchemaValidator] = useState(false);
    const [showExportPanel, setShowExportPanel] = useState(false);
    const [isConversionModalOpen, setIsConversionModalOpen] = useState(false); // NEW: Conversion modal state

    // Validation
    const validation = validateJsonDetailed(leftJson);

    // Search Handlers
    const scrollToMatch = useCallback((match: SearchMatch) => {
        const lineHeight = 20;
        const scrollPosition = (match.line - 1) * lineHeight - 100;
        if (textareaRef.current) {
            textareaRef.current.scrollTo({
                top: Math.max(scrollPosition, 0),
                behavior: "smooth",
            });
        }
    }, []);

    const handleNextResult = useCallback(() => {
        if (searchMatches.length === 0) return;
        const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
        setCurrentMatchIndex(nextIndex);
        scrollToMatch(searchMatches[nextIndex]);
    }, [searchMatches, currentMatchIndex, scrollToMatch]);

    const handlePrevResult = useCallback(() => {
        if (searchMatches.length === 0) return;
        const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
        setCurrentMatchIndex(prevIndex);
        scrollToMatch(searchMatches[prevIndex]);
    }, [searchMatches, currentMatchIndex, scrollToMatch]);

    const handleReplace = useCallback(() => {
        if (currentMatchIndex === -1 || searchMatches.length === 0) return;
        const currentMatch = searchMatches[currentMatchIndex];
        const newJson = replaceMatch(leftJson, currentMatch, replaceTerm);
        setLeftJson(newJson);
        const newMatches = findAllMatches(newJson, searchTerm, { matchCase, useRegex });
        setSearchMatches(newMatches);
        const newIndex = newMatches.length > 0
            ? Math.min(currentMatchIndex, newMatches.length - 1)
            : -1;
        setCurrentMatchIndex(newIndex);
    }, [leftJson, searchMatches, currentMatchIndex, replaceTerm, searchTerm, matchCase, useRegex, setLeftJson]);

    const handleReplaceAll = useCallback(() => {
        if (searchMatches.length === 0) return;
        const newJson = replaceAllMatches(leftJson, searchMatches, replaceTerm);
        setLeftJson(newJson);
        setSearchMatches([]);
        setCurrentMatchIndex(-1);
        setNotification({
            message: `Replaced ${searchMatches.length} occurrences`,
            type: "success"
        });
    }, [leftJson, searchMatches, replaceTerm, setLeftJson]);

    // Other Handlers
    const handleClear = useCallback(() => {
        setLeftJson("");
    }, [setLeftJson]);

    const handleFormat = useCallback(() => {
        try {
            const formatted = formatJson(leftJson);
            setLeftJson(formatted);
            setNotification({ message: "JSON formatted!", type: "success" });
        } catch (e) {
            setNotification({ message: "Invalid JSON - cannot format", type: "error" });
        }
    }, [leftJson, setLeftJson]);

    const handleMinify = useCallback(() => {
        try {
            const minified = minifyJson(leftJson);
            setLeftJson(minified);
            setNotification({ message: "JSON minified!", type: "success" });
        } catch (e) {
            setNotification({ message: "Invalid JSON - cannot minify", type: "error" });
        }
    }, [leftJson, setLeftJson]);

    const handleRemoveSpaces = useCallback(() => {
        const noSpaces = removeWhitespace(leftJson);
        setLeftJson(noSpaces);
        setNotification({ message: "Spaces removed!", type: "success" });
    }, [leftJson, setLeftJson]);

    const handleCopyRight = () => {
        navigator.clipboard.writeText(rightJson);
        setNotification({ message: "Copied to clipboard!", type: "success" });
    };

    const handleCopyLeft = () => {
        setLeftJson(rightJson);
        setNotification({ message: "Content copied!", type: "success" });
    };

    const handleLeftToggleView = () => {
        setLeftView(leftView === "text" ? "tree" : "text");
    };

    const handleRightToggleView = () => {
        setRightView(rightView === "text" ? "tree" : "text");
    };

    const handleSearchResults = (count: number) => {
        setSearchResults(count);
        setCurrentSearchIndex(count > 0 ? 1 : 0);
    };

    const handleNextSearchResult = () => {
        if (currentSearchIndex < searchResults) {
            setCurrentSearchIndex(currentSearchIndex + 1);
        } else {
            setCurrentSearchIndex(1);
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            const content = await readFileAsText(file);
            setLeftJson(content);
            setNotification({ message: "File uploaded successfully!", type: "success" });
        } catch (e) {
            setNotification({ message: "Failed to read file", type: "error" });
        }
    };

    const handleDownload = () => {
        const success = downloadJsonFile(leftJson, generateFilename());
        if (success) {
            setNotification({ message: "File downloaded successfully!", type: "success" });
        } else {
            setNotification({ message: "Invalid JSON - cannot download", type: "error" });
        }
    };

    const handleLoadFromUrl = () => {
        setIsUrlModalOpen(true);
        setUrlError("");
    };

    const handleUrlLoad = async (url: string) => {
        setIsLoadingUrl(true);
        setUrlError("");
        const result = await fetchJsonFromUrl(url);
        if (result.success && result.data) {
            setLeftJson(result.data);
            setIsUrlModalOpen(false);
            setNotification({ message: "JSON loaded from URL!", type: "success" });
        } else {
            setUrlError(result.error || "Failed to load JSON from URL");
            setNotification({ message: "Failed to load from URL", type: "error" });
        }
        setIsLoadingUrl(false);
    };

    const handleCloseUrlModal = () => {
        setIsUrlModalOpen(false);
        setUrlError("");
    };

    const handleLeftJsonChange = useCallback((newValue: string) => {
        setLeftJson(newValue);
    }, [setLeftJson]);

    // NEW: Handle conversion
    const handleConvertedData = (convertedData: string, targetFormat: 'json' | 'xml' | 'yaml') => {
        // For now, copy to clipboard and show notification
        navigator.clipboard.writeText(convertedData);
        setNotification({
            message: `Converted to ${targetFormat.toUpperCase()} and copied to clipboard!`,
            type: "success"
        });
    };

    // Effects
    useEffect(() => {
        setRightJson(leftJson);
    }, [leftJson]);

    useEffect(() => {
        if (!debouncedSearchTerm) {
            setSearchMatches([]);
            setCurrentMatchIndex(-1);
            setIsSearching(false);
            return;
        }

        // Cancel previous search
        if (searchControllerRef.current) {
            searchControllerRef.current.abort();
        }

        const controller = new AbortController();
        searchControllerRef.current = controller;
        setIsSearching(true);

        const searchTimeout = setTimeout(() => {
            const startTime = performance.now();

            try {
                const matches = findAllMatches(leftJson, debouncedSearchTerm, { matchCase, useRegex });

                if (!controller.signal.aborted) {
                    const endTime = performance.now();
                    console.log(`Search took ${endTime - startTime} milliseconds, found ${matches.length} matches`);

                    setSearchMatches(matches);
                    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
                    setIsSearching(false);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error('Search error:', error);
                    setIsSearching(false);
                }
            }
        }, 0);

        return () => {
            clearTimeout(searchTimeout);
            controller.abort();
            setIsSearching(false);
        };
    }, [debouncedSearchTerm, leftJson, matchCase, useRegex]);

    useEffect(() => {
        if (!validation.valid && validation.line && textareaRef.current) {
            const lineHeight = 20;
            const scrollPosition = (validation.line - 1) * lineHeight - 40;
            textareaRef.current.scrollTo({
                top: Math.max(scrollPosition, 0),
                behavior: "smooth",
            });
        }
    }, [validation]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
                e.preventDefault();
                if (canUndoLeft) undoLeft();
            } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
                e.preventDefault();
                if (canRedoLeft) redoLeft();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                if (canRedoLeft) redoLeft();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
            } else if (e.key === 'F3') {
                e.preventDefault();
                if (e.shiftKey) {
                    handlePrevResult();
                } else {
                    handleNextResult();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [canUndoLeft, canRedoLeft, undoLeft, redoLeft, handleNextResult, handlePrevResult]);

    // Search display variables
    const resultsCount = searchMatches.length;
    const currentResult = currentMatchIndex + 1;

    return (
        <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    🧩 JSON Editor
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Panel */}
                <div className="bg-white rounded-xl shadow-md p-4 dark:bg-gray-800 dark:shadow-gray-900">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3 dark:text-gray-300">
                        {leftView === "text" ? "JSON Input" : "JSON Tree"}
                    </h2>

                    <Toolbar
                        onClear={handleClear}
                        onFormat={handleFormat}
                        onMinify={handleMinify}
                        onRemoveSpaces={handleRemoveSpaces}
                        onCopy={handleCopyRight}
                        onToggleView={handleLeftToggleView}
                        onUpload={handleFileUpload}
                        onDownload={handleDownload}
                        onLoadFromUrl={handleLoadFromUrl}
                        onUndo={undoLeft}
                        onRedo={redoLeft}
                        canUndo={canUndoLeft}
                        canRedo={canRedoLeft}
                        direction="right"
                        viewType={leftView}
                        onSchemaValidate={() => setShowSchemaValidator(!showSchemaValidator)}
                        onExport={() => setShowExportPanel(!showExportPanel)}
                        onConvert={() => setIsConversionModalOpen(true)} // NEW: Conversion handler
                    />

                    {leftView === "text" ? (
                        <EnhancedTextArea
                            value={leftJson}
                            onChange={handleLeftJsonChange}
                            errorLine={!validation.valid ? validation.line : undefined}
                            errorMessage={!validation.valid ? `Error: ${validation.message} (Line ${validation.line}, Column ${validation.column})` : undefined}
                            height={500}
                            searchMatches={searchMatches}
                            currentMatchIndex={currentMatchIndex}
                        />
                    ) : (
                        <div className="border border-gray-200 rounded-md h-[500px] overflow-auto p-3 dark:border-gray-700 dark:bg-gray-900">
                            <TreeView jsonText={leftJson} />
                        </div>
                    )}

                    {showExportPanel && (
                        <ExportPanel json={leftJson} />
                    )}
                </div>

                {/* Right Panel */}
                <div className="bg-white rounded-xl shadow-md p-4">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        {rightView === "text" ? "JSON Text" : "JSON Tree View"}
                    </h2>

                    <EnhancedSearchBar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        replaceTerm={replaceTerm}
                        setReplaceTerm={setReplaceTerm}
                        resultsCount={resultsCount}
                        currentResult={currentResult}
                        onNextResult={handleNextResult}
                        onPrevResult={handlePrevResult}
                        onReplace={handleReplace}
                        onReplaceAll={handleReplaceAll}
                        matchCase={matchCase}
                        setMatchCase={setMatchCase}
                        useRegex={useRegex}
                        setUseRegex={setUseRegex}
                        showReplace={showReplace}
                        setShowReplace={setShowReplace}
                        isSearching={isSearching}
                    />

                    <Toolbar
                        onCopy={handleCopyLeft}
                        onToggleView={handleRightToggleView}
                        direction="left"
                        viewType={rightView}
                    />

                    {rightView === "text" ? (
                        <EnhancedTextArea
                            value={rightJson}
                            onChange={setRightJson}
                            height={500}
                        />
                    ) : (
                        <div className="border border-gray-200 rounded-md h-[500px] overflow-auto p-3">
                            <TreeView
                                jsonText={rightJson}
                                searchTerm={searchTerm}
                                onSearchResults={handleSearchResults}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* URL Loader Modal */}
            <UrlLoaderModal
                isOpen={isUrlModalOpen}
                onClose={handleCloseUrlModal}
                onLoad={handleUrlLoad}
                isLoading={isLoadingUrl}
                error={urlError}
            />

            {/* NEW: Conversion Modal */}
            <ConversionModal
                isOpen={isConversionModalOpen}
                onClose={() => setIsConversionModalOpen(false)}
                currentFormat="json" // This should be "json" for JSON editor
                currentData={leftJson}
                onConverted={handleConvertedData}
            />

            {/* Notification */}
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}

            {/* Add SEO landing at the bottom */}
            <SEOLanding />
        </div>
    );
};

export default JsonEditorPage;