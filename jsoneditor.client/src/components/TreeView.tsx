// src/components/TreeView.tsx - Complete Dark Mode Version
import React, { useEffect, useState } from "react";

interface TreeViewProps {
    json?: string;
    jsonText?: string;
    searchTerm?: string;
    onSearchResults?: (count: number) => void;
    highlightedPath?: string;
}

interface NodeProps {
    name?: string;
    data: any;
    depth: number;
    collapsedAll: boolean;
    searchTerm?: string;
    path: string;
    onHighlight?: (path: string) => void;
    isHighlighted?: boolean;
}

/**
 * Enhanced Node with search highlighting
 */
const Node: React.FC<NodeProps> = ({
    name,
    data,
    depth,
    collapsedAll,
    searchTerm,
    path,
    onHighlight,
    isHighlighted
}) => {
    const initialOpen = depth === 0 ? true : false;
    const [isOpen, setIsOpen] = useState<boolean>(initialOpen);

    useEffect(() => {
        setIsOpen(!collapsedAll);
    }, [collapsedAll]);

    // Auto-expand if this node or its children match search
    useEffect(() => {
        if (searchTerm && matchesSearch(data, name, searchTerm)) {
            setIsOpen(true);
        }
    }, [searchTerm, data, name]);

    const toggle = () => setIsOpen((v) => !v);
    const indentStyle = { marginLeft: depth * 12 };

    // Check if this node matches search
    const matchesSearch = (nodeData: any, nodeName?: string, term?: string): boolean => {
        if (!term) return false;

        const searchLower = term.toLowerCase();

        // Check node name
        if (nodeName && nodeName.toLowerCase().includes(searchLower)) {
            return true;
        }

        // Check primitive values
        if (nodeData !== null && typeof nodeData !== 'object') {
            return String(nodeData).toLowerCase().includes(searchLower);
        }

        return false;
    };

    // Highlight matching text
    const highlightText = (text: string, term?: string): React.ReactNode => {
        if (!term) return text;

        const lowerText = text.toLowerCase();
        const lowerTerm = term.toLowerCase();
        const index = lowerText.indexOf(lowerTerm);

        if (index === -1) return text;

        return (
            <>
                {text.substring(0, index)}
                <mark className="bg-yellow-200 px-1 rounded dark:bg-yellow-600 dark:text-yellow-900">
                    {text.substring(index, index + term.length)}
                </mark>
                {text.substring(index + term.length)}
            </>
        );
    };

    // Handle click to highlight this node
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onHighlight?.(path);
    };

    // Render for objects / arrays
    if (data && typeof data === "object") {
        const entries = Array.isArray(data)
            ? (data as any[]).map((v, i) => [String(i), v])
            : Object.entries(data);

        const hasMatch = searchTerm && matchesSearch(data, name, searchTerm);
        const displayName = name ? `${name}:` : "";

        return (
            <div style={indentStyle} className="mb-1">
                <div
                    onClick={toggle}
                    className={`cursor-pointer select-none font-semibold hover:text-indigo-600 transition ${isHighlighted ? 'bg-blue-100 rounded px-1 dark:bg-blue-900' : ''
                        } ${hasMatch ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-gray-200'}`}
                >
                    <span className="inline-block w-4">{isOpen ? "▼" : "▶"}</span>
                    <span onClick={handleClick}>
                        {searchTerm ? highlightText(displayName, searchTerm) : displayName}
                    </span>
                </div>

                {isOpen && (
                    <div className="pl-4 border-l border-gray-200 ml-1 dark:border-gray-700">
                        {entries.map(([key, value]) => (
                            <Node
                                key={key}
                                name={key}
                                data={value}
                                depth={depth + 1}
                                collapsedAll={collapsedAll}
                                searchTerm={searchTerm}
                                path={`${path}.${key}`}
                                onHighlight={onHighlight}
                                isHighlighted={isHighlighted}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Primitive value
    const hasMatch = searchTerm && matchesSearch(data, name, searchTerm);

    return (
        <div
            style={indentStyle}
            className={`mb-1 ${isHighlighted ? 'bg-blue-100 rounded px-1 dark:bg-blue-900' : ''}`}
            onClick={handleClick}
        >
            {name ? (
                <span>
                    <span className={`font-semibold ${hasMatch ? 'text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {searchTerm ? highlightText(`${name}:`, searchTerm) : `${name}:`}
                    </span>{" "}
                    <span className="text-blue-600 dark:text-blue-400">
                        {searchTerm ? highlightText(JSON.stringify(data), searchTerm) : JSON.stringify(data)}
                    </span>
                </span>
            ) : (
                <span className="text-blue-600 dark:text-blue-400">
                    {searchTerm ? highlightText(JSON.stringify(data), searchTerm) : JSON.stringify(data)}
                </span>
            )}
        </div>
    );
};

const TreeView: React.FC<TreeViewProps> = ({
    json,
    jsonText,
    searchTerm,
    onSearchResults,
    highlightedPath
}) => {
    const source = typeof jsonText === "string" ? jsonText : json ?? "";

    const [collapsedAll, setCollapsedAll] = useState<boolean>(false);
    const [parsed, setParsed] = useState<any>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [currentHighlight, setCurrentHighlight] = useState<string>("");

    // Parse input JSON whenever it changes
    useEffect(() => {
        if (!source || source.trim() === "") {
            setParsed({});
            setParseError(null);
            return;
        }

        try {
            setParsed(JSON.parse(source));
            setParseError(null);
        } catch (e: any) {
            const msg = e?.message ? String(e.message) : "Invalid JSON";
            setParsed(null);
            setParseError(msg);
        }
    }, [source]);

    // Handle search result highlighting
    const handleHighlight = (path: string) => {
        setCurrentHighlight(path);
    };

    // If parse error — show helpful UI
    if (parseError) {
        return (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                <div className="font-semibold mb-1">Invalid JSON</div>
                <div className="text-sm">{parseError}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-end gap-2 mb-2">
                <button
                    onClick={() => setCollapsedAll(false)}
                    className="px-3 py-1 text-sm rounded-md bg-green-500 text-white hover:bg-green-600 transition dark:bg-green-600 dark:hover:bg-green-700"
                >
                    Expand All
                </button>
                <button
                    onClick={() => setCollapsedAll(true)}
                    className="px-3 py-1 text-sm rounded-md bg-gray-500 text-white hover:bg-gray-600 transition dark:bg-gray-600 dark:hover:bg-gray-700"
                >
                    Collapse All
                </button>
            </div>

            <div className="overflow-auto flex-1 border rounded p-2 bg-white font-mono text-sm min-h-[120px] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                <Node
                    data={parsed ?? {}}
                    depth={0}
                    collapsedAll={collapsedAll}
                    searchTerm={searchTerm}
                    path="root"
                    onHighlight={handleHighlight}
                    isHighlighted={currentHighlight === highlightedPath}
                />
            </div>
        </div>
    );
};

export default TreeView;