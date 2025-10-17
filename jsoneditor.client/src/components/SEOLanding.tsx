// src/components/SEOLanding.tsx
import React from 'react';

const SEOLanding: React.FC = () => {
    return (
        <div className="hidden md:block"> {/* Hidden on mobile, visible to search engines */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Main Heading */}
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Free Online JSON Editor - Format, Validate & Convert JSON
                </h1>

                {/* Feature Sections */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Powerful JSON Editing Features</h2>
                    <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">🔧 JSON Formatting & Validation</h3>
                            <p>Real-time JSON validation with detailed error messages and line-by-line error highlighting. Format and minify JSON with one click.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">🔍 Advanced Search & Replace</h3>
                            <p>Powerful search functionality with regex support, case matching, and replace all capabilities. Navigate through matches easily.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">📊 Tree View Visualization</h3>
                            <p>Visualize your JSON data with an expandable tree view. Collapse and expand nodes for better data exploration.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">📁 File Management</h3>
                            <p>Upload JSON files, download formatted results, and load JSON from URLs with built-in validation.</p>
                        </div>
                    </div>
                </section>

                {/* Conversion Features */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">JSON Conversion Tools</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="font-semibold text-blue-700">JSON to YAML</div>
                            <p className="text-sm text-gray-600">Convert JSON to YAML format</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <div className="font-semibold text-green-700">JSON to XML</div>
                            <p className="text-sm text-gray-600">Transform JSON to XML structure</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="font-semibold text-purple-700">JSON to CSV</div>
                            <p className="text-sm text-gray-600">Export JSON arrays to CSV format</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg">
                            <div className="font-semibold text-orange-700">Schema Validation</div>
                            <p className="text-sm text-gray-600">Validate against JSON schemas</p>
                        </div>
                    </div>
                </section>

                {/* Usage Instructions */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Use This JSON Editor</h2>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>Paste your JSON data or upload a file</li>
                        <li>Use the format button to beautify your JSON</li>
                        <li>Validate your JSON with real-time error checking</li>
                        <li>Use search and replace for quick modifications</li>
                        <li>Export to other formats or download the result</li>
                    </ol>
                </section>

                {/* FAQ Section */}
                <section>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-lg text-gray-800">Is this JSON editor free to use?</h3>
                            <p className="text-gray-700">Yes, this JSON editor is completely free with no limitations. No registration required.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-800">Does it support large JSON files?</h3>
                            <p className="text-gray-700">Yes, the editor can handle large JSON files efficiently with optimized performance.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-800">Can I validate JSON schemas?</h3>
                            <p className="text-gray-700">Yes, we support JSON schema validation with common schemas and custom schema input.</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SEOLanding;