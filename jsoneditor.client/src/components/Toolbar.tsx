// src/components/Toolbar.tsx
import React from "react";

interface ToolbarProps {
    onClear?: () => void;
    onFormat?: () => void;
    onMinify?: () => void;
    onRemoveSpaces?: () => void;
    onCopy?: () => void;
    onToggleView?: () => void;
    onUpload?: (file: File) => void;
    onDownload?: () => void;
    onLoadFromUrl?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onSchemaValidate?: () => void;
    onExport?: () => void;
    onConvert?: () => void; // NEW: Conversion callback
    direction?: "left" | "right";
    viewType?: "text" | "tree";
    canUndo?: boolean;
    canRedo?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
    onClear,
    onFormat,
    onMinify,
    onRemoveSpaces,
    onCopy,
    onToggleView,
    onUpload,
    onDownload,
    onLoadFromUrl,
    onUndo,
    onRedo,
    onSchemaValidate,
    onExport,
    onConvert, // NEW: Conversion prop
    direction = "left",
    viewType = "text",
    canUndo = false,
    canRedo = false
}) => {
    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
        }
        event.target.value = '';
    };

    return (
        <div className="flex flex-wrap gap-2 mb-3">
            {/* File Operations */}
            {onUpload && (
                <div className="relative">
                    <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id={`file-upload-${direction}`}
                    />
                    <label
                        htmlFor={`file-upload-${direction}`}
                        className="btn bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer dark:bg-indigo-600 dark:hover:bg-indigo-700"
                    >
                        📁 Upload
                    </label>
                </div>
            )}

            {onDownload && (
                <button onClick={onDownload} className="btn bg-teal-500 hover:bg-teal-600 text-white dark:bg-teal-600 dark:hover:bg-teal-700">
                    ⬇️ Download
                </button>
            )}

            {onLoadFromUrl && (
                <button onClick={onLoadFromUrl} className="btn bg-pink-500 hover:bg-pink-600 text-white dark:bg-pink-600 dark:hover:bg-pink-700">
                    🌐 Load URL
                </button>
            )}

            {/* NEW: Conversion Button */}
            {onConvert && (
                <button
                    onClick={onConvert}
                    className="btn bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-800"
                    title="Convert to XML/YAML"
                >
                    🔄 Convert
                </button>
            )}

            {/* Schema Validation & Export */}
            {onSchemaValidate && (
                <button
                    onClick={onSchemaValidate}
                    className="btn bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
                    title="JSON Schema Validation"
                >
                    📋 Schema
                </button>
            )}

            {onExport && (
                <button
                    onClick={onExport}
                    className="btn bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                    title="Export to other formats"
                >
                    📤 Export
                </button>
            )}

            {/* Undo/Redo Operations */}
            {onUndo && (
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="btn bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:hover:bg-gray-700"
                >
                    ⎌ Undo
                </button>
            )}

            {onRedo && (
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="btn bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-800"
                >
                    ⎌ Redo
                </button>
            )}

            {/* Existing Operations */}
            {onClear && (
                <button onClick={onClear} className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200">
                    Clear
                </button>
            )}
            {onFormat && (
                <button onClick={onFormat} className="btn bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
                    Format
                </button>
            )}
            {onMinify && (
                <button onClick={onMinify} className="btn bg-orange-400 hover:bg-orange-500 text-white dark:bg-orange-500 dark:hover:bg-orange-600">
                    Minify
                </button>
            )}
            {onRemoveSpaces && (
                <button onClick={onRemoveSpaces} className="btn bg-yellow-400 hover:bg-yellow-500 text-white dark:bg-yellow-500 dark:hover:bg-yellow-600">
                    No Space
                </button>
            )}
            {onCopy && (
                <button onClick={onCopy} className="btn bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700">
                    {direction === "left" ? "← Copy" : "Copy →"}
                </button>
            )}
            {onToggleView && (
                <button onClick={onToggleView} className="btn bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700">
                    {viewType === "text" ? "Tree View" : "Text View"}
                </button>
            )}
        </div>
    );
};

export default Toolbar;