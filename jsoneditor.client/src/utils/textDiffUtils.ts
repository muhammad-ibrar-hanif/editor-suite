// src/utils/textDiffUtils.ts

export interface TextStatistics {
    words: number;
    characters: number;
    lines: number;
    paragraphs: number;
    sentences: number;
}

export interface WordDiff {
    value: string;
    added?: boolean;
    removed?: boolean;
    changed?: boolean;
}

export const calculateTextStatistics = (text: string): TextStatistics => {
    if (!text || text.trim() === '') {
        return {
            words: 0,
            characters: 0,
            lines: 0,
            paragraphs: 0,
            sentences: 0
        };
    }

    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const characters = text.length;
    const lines = text.split('\n').length;
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim() !== '').length;

    return {
        words,
        characters,
        lines,
        paragraphs,
        sentences
    };
};

export const calculateWordLevelDifferences = (text1: string, text2: string): WordDiff[] => {
    if (!text1 && !text2) return [];

    const words1 = text1 ? text1.split(/(\s+)/) : [];
    const words2 = text2 ? text2.split(/(\s+)/) : [];

    const diffs: WordDiff[] = [];
    const maxLength = Math.max(words1.length, words2.length);

    for (let i = 0; i < maxLength; i++) {
        const word1 = words1[i] || '';
        const word2 = words2[i] || '';

        if (word1 === word2) {
            // Words are identical
            diffs.push({ value: word1 });
        } else if (word1 && !word2) {
            // Word removed
            diffs.push({ value: word1, removed: true });
        } else if (!word1 && word2) {
            // Word added
            diffs.push({ value: word2, added: true });
        } else {
            // Word changed
            diffs.push({ value: word1, removed: true, changed: true });
            diffs.push({ value: word2, added: true, changed: true });
        }
    }

    return diffs;
};

export const calculateCharacterLevelDifferences = (text1: string, text2: string): any[] => {
    // Simple character-level diff implementation
    const diffs = [];
    const maxLength = Math.max(text1.length, text2.length);

    for (let i = 0; i < maxLength; i++) {
        const char1 = text1[i];
        const char2 = text2[i];

        if (char1 === char2) {
            diffs.push({ value: char1 });
        } else if (char1 && !char2) {
            diffs.push({ value: char1, removed: true });
        } else if (!char1 && char2) {
            diffs.push({ value: char2, added: true });
        } else {
            diffs.push({ value: char1, removed: true });
            diffs.push({ value: char2, added: true });
        }
    }

    return diffs;
};

export const findChangedWords = (text1: string, text2: string): { added: string[], removed: string[] } => {
    const words1 = text1 ? text1.split(/\s+/) : [];
    const words2 = text2 ? text2.split(/\s+/) : [];

    const wordSet1 = new Set(words1);
    const wordSet2 = new Set(words2);

    const added = words2.filter(word => !wordSet1.has(word) && word.trim() !== '');
    const removed = words1.filter(word => !wordSet2.has(word) && word.trim() !== '');

    return { added, removed };
};

export const calculateSimilarityPercentage = (text1: string, text2: string): number => {
    if (!text1 && !text2) return 100;
    if (!text1 || !text2) return 0;

    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word));
    const totalUniqueWords = new Set([...words1, ...words2]).size;

    if (totalUniqueWords === 0) return 100;

    return Math.round((commonWords.length / totalUniqueWords) * 100);
};

export const formatTextForDisplay = (text: string, maxLength: number = 1000): string => {
    if (!text) return '';

    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }

    return text;
};

export const downloadTextAsFile = (text: string, filename: string = 'comparison_result.txt'): void => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Advanced diff algorithm for better word matching
export const advancedWordLevelDiff = (text1: string, text2: string): WordDiff[] => {
    if (!text1 && !text2) return [];

    // Split while preserving whitespace
    const tokens1 = text1 ? text1.split(/(\s+)/) : [];
    const tokens2 = text2 ? text2.split(/(\s+)/) : [];

    const diffs: WordDiff[] = [];
    let i = 0, j = 0;

    while (i < tokens1.length || j < tokens2.length) {
        const token1 = tokens1[i];
        const token2 = tokens2[j];

        if (token1 === token2) {
            // Tokens match
            diffs.push({ value: token1 });
            i++;
            j++;
        } else {
            // Look ahead to find matches
            let foundMatch = false;

            // Check next few tokens for a match
            for (let lookAhead = 1; lookAhead <= 3; lookAhead++) {
                if (i + lookAhead < tokens1.length && tokens1[i + lookAhead] === token2) {
                    // Tokens were removed
                    for (let k = i; k < i + lookAhead; k++) {
                        diffs.push({ value: tokens1[k], removed: true });
                    }
                    i += lookAhead;
                    foundMatch = true;
                    break;
                }

                if (j + lookAhead < tokens2.length && tokens2[j + lookAhead] === token1) {
                    // Tokens were added
                    for (let k = j; k < j + lookAhead; k++) {
                        diffs.push({ value: tokens2[k], added: true });
                    }
                    j += lookAhead;
                    foundMatch = true;
                    break;
                }
            }

            if (!foundMatch) {
                // No match found, treat as change
                if (token1) {
                    diffs.push({ value: token1, removed: true, changed: true });
                    i++;
                }
                if (token2) {
                    diffs.push({ value: token2, added: true, changed: true });
                    j++;
                }
            }
        }
    }

    return diffs;
};