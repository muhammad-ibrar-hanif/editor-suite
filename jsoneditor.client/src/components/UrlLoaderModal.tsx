// src/components/UrlLoaderModal.tsx - Complete Dark Mode Version
import React, { useState } from "react";

interface UrlLoaderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (url: string) => void;
    isLoading?: boolean;
    error?: string;
}

const UrlLoaderModal: React.FC<UrlLoaderModalProps> = ({
    isOpen,
    onClose,
    onLoad,
    isLoading = false,
    error
}) => {
    const [url, setUrl] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onLoad(url.trim());
        }
    };

    const handleClose = () => {
        setUrl("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md dark:bg-gray-800 dark:border dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Load JSON from URL</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                            JSON URL
                        </label>
                        <input
                            type="url"
                            id="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://api.example.com/data.json"
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!url.trim() || isLoading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            {isLoading ? "Loading..." : "Load JSON"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UrlLoaderModal;