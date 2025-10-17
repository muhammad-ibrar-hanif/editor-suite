import React, { useState, useCallback } from 'react';
import { conversionMap, type ConversionType, type ConversionResult } from '../utils/conversionUtils';

interface ConversionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFormat: 'json' | 'xml' | 'yaml';
    currentData: string;
    onConverted: (convertedData: string, targetFormat: 'json' | 'xml' | 'yaml') => void;
}

const ConversionModal: React.FC<ConversionModalProps> = ({
    isOpen,
    onClose,
    currentFormat,
    currentData,
    onConverted
}) => {
    const [targetFormat, setTargetFormat] = useState<'json' | 'xml' | 'yaml'>(
        currentFormat === 'json' ? 'xml' :
            currentFormat === 'xml' ? 'yaml' : 'json'
    );
    const [convertedData, setConvertedData] = useState<string>('');
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // DEBUG: Log the props to see what's being passed
    console.log('ConversionModal props:', {
        currentFormat,
        currentDataLength: currentData?.length,
        currentDataStart: currentData?.substring(0, 50)
    });

    const handleConvert = useCallback(async () => {
        if (!currentData.trim()) {
            setError('No data to convert');
            return;
        }

        setIsConverting(true);
        setError('');

        const conversionKey = `${currentFormat}-${targetFormat}` as ConversionType;
        const converter = conversionMap[conversionKey];

        console.log('Conversion attempt:', {
            from: currentFormat,
            to: targetFormat,
            conversionKey,
            dataLength: currentData.length,
            dataStart: currentData.substring(0, 100)
        });

        if (converter) {
            const result: ConversionResult = converter(currentData);

            console.log('Conversion result:', result);

            if (result.success) {
                setConvertedData(result.data);
            } else {
                setError(result.error || 'Conversion failed');
            }
        } else {
            setError(`Conversion from ${currentFormat} to ${targetFormat} is not available`);
        }

        setIsConverting(false);
    }, [currentData, currentFormat, targetFormat]);

    const handleUseConvertedData = () => {
        if (convertedData) {
            onConverted(convertedData, targetFormat);
            onClose();
        }
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(convertedData);
    };

    // Get all available target formats
    const availableFormats = ['json', 'xml', 'yaml'].filter(format => format !== currentFormat);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>🔄 Convert {currentFormat.toUpperCase()}</h3>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="conversion-controls">
                        <div className="format-selector">
                            <label>Convert to:</label>
                            <select
                                value={targetFormat}
                                onChange={(e) => setTargetFormat(e.target.value as 'json' | 'xml' | 'yaml')}
                            >
                                {availableFormats.map(format => (
                                    <option key={format} value={format}>
                                        {format.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="convert-button"
                            onClick={handleConvert}
                            disabled={isConverting}
                        >
                            {isConverting ? '🔄 Converting...' : '⚡ Convert'}
                        </button>
                    </div>

                    {/* DEBUG: Show current conversion path */}
                    <div style={{ marginBottom: '10px', padding: '8px', background: '#2a2d2e', borderRadius: '4px' }}>
                        <small>Conversion: <strong>{currentFormat.toUpperCase()} → {targetFormat.toUpperCase()}</strong></small>
                    </div>

                    {error && (
                        <div className="error-message">
                            ❌ {error}
                        </div>
                    )}

                    {convertedData && (
                        <div className="conversion-result">
                            <div className="result-header">
                                <h4>Converted {currentFormat.toUpperCase()} → {targetFormat.toUpperCase()}</h4>
                                <div className="result-actions">
                                    <button onClick={handleCopyToClipboard} className="action-button">
                                        📋 Copy
                                    </button>
                                    <button onClick={handleUseConvertedData} className="action-button primary">
                                        ✅ Use This Data
                                    </button>
                                </div>
                            </div>
                            <pre className="converted-data">{convertedData}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversionModal;