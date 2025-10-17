// src/components/ExportPanel.tsx - UPDATED
import React, { useState } from 'react';
import { convertToYaml, convertToXml, convertToCsv, downloadFile } from '../utils/exportUtils';
import { formatJson } from '../utils/jsonUtils';

interface ExportPanelProps {
    json: string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ json }) => {
    const [exportFormat, setExportFormat] = useState<'yaml' | 'xml' | 'csv' | 'json'>('json');
    const [exportContent, setExportContent] = useState<string>('');

    const handlePreview = () => {
        try {
            console.log('Converting to:', exportFormat); // Debug
            let content = '';

            switch (exportFormat) {
                case 'yaml':
                    content = convertToYaml(json);
                    break;
                case 'xml':
                    content = convertToXml(json);
                    break;
                case 'csv':
                    content = convertToCsv(json);
                    break;
                case 'json':
                default:
                    content = formatJson(json);
                    break;
            }
            console.log('Conversion successful, content length:', content.length); // Debug
            setExportContent(content);
        } catch (error) {
            console.error('Export error:', error); // Debug
            setExportContent(`Error converting to ${exportFormat.toUpperCase()}: ${error}`);
        }
    };

    const handleDownload = () => {
        if (!exportContent) {
            console.log('No content, generating preview first'); // Debug
            handlePreview();
            setTimeout(handleDownload, 100); // Try again after preview
            return;
        }

        const extensions = {
            json: 'json',
            yaml: 'yaml',
            xml: 'xml',
            csv: 'csv'
        };

        const mimeTypes = {
            json: 'application/json',
            yaml: 'text/yaml',
            xml: 'application/xml',
            csv: 'text/csv'
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `json-export-${timestamp}.${extensions[exportFormat]}`;

        console.log('Downloading:', filename); // Debug
        downloadFile(exportContent, filename, mimeTypes[exportFormat]);
    };

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                📤 Export to Other Formats
            </h3>

            <div className="space-y-3">
                {/* Format Selection */}
                <div className="flex gap-4 flex-wrap">
                    {(['json', 'yaml', 'xml', 'csv'] as const).map(format => (
                        <label key={format} className="flex items-center gap-2">
                            <input
                                type="radio"
                                value={format}
                                checked={exportFormat === format}
                                onChange={(e) => {
                                    setExportFormat(e.target.value as any);
                                    setExportContent(''); // Clear preview when format changes
                                }}
                                className="text-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {format.toUpperCase()}
                            </span>
                        </label>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handlePreview}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        Preview {exportFormat.toUpperCase()}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors dark:bg-green-600 dark:hover:bg-green-700"
                    >
                        Download {exportFormat.toUpperCase()}
                    </button>
                </div>

                {/* Preview */}
                {exportContent && (
                    <div className="mt-4">
                        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                            Preview:
                        </h4>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-600 overflow-auto max-h-64 text-sm font-mono text-gray-800 dark:text-gray-200">
                            {exportContent}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExportPanel;