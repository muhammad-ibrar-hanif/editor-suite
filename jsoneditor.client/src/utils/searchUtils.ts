// src/utils/searchUtils.ts
export interface SearchMatch {
    index: number;
    length: number;
    line: number;
    column: number;
    match: string;
}

export interface SearchOptions {
    matchCase: boolean;
    useRegex: boolean;
}

export const replaceMatch = (
    text: string,
    match: SearchMatch,
    replaceWith: string
): string => {
    return (
        text.substring(0, match.index) +
        replaceWith +
        text.substring(match.index + match.length)
    );
};

export const replaceAllMatches = (
    text: string,
    matches: SearchMatch[],
    replaceWith: string
): string => {
    let result = text;
    let offset = 0;

    matches.forEach(match => {
        const adjustedIndex = match.index + offset;
        result =
            result.substring(0, adjustedIndex) +
            replaceWith +
            result.substring(adjustedIndex + match.length);

        offset += replaceWith.length - match.length;
    });

    return result;
};

export const validateRegex = (pattern: string): boolean => {
    try {
        new RegExp(pattern);
        return true;
    } catch {
        return false;
    }
};

// src/utils/searchUtils.ts - Optimized version
export const findAllMatches = (
    text: string,
    searchTerm: string,
    options: SearchOptions
): SearchMatch[] => {
    if (!searchTerm) return [];

    const matches: SearchMatch[] = [];

    try {
        if (options.useRegex) {
            // More efficient regex handling
            const flags = options.matchCase ? 'gm' : 'gmi';
            const regex = new RegExp(searchTerm, flags);

            let match;
            let lastIndex = 0;

            // Limit the number of iterations to prevent infinite loops
            let safetyCounter = 0;
            const MAX_ITERATIONS = 1000;

            while ((match = regex.exec(text)) !== null && safetyCounter < MAX_ITERATIONS) {
                safetyCounter++;

                if (match[0].length === 0) {
                    // Skip zero-length matches to avoid infinite loops
                    regex.lastIndex++;
                    continue;
                }

                // Calculate line and column
                const textBeforeMatch = text.substring(0, match.index);
                const lines = textBeforeMatch.split('\n');
                const lineNumber = lines.length;
                const column = lines[lines.length - 1].length + 1;

                matches.push({
                    index: match.index,
                    length: match[0].length,
                    line: lineNumber,
                    column: column,
                    match: match[0]
                });

                // Break if we've found too many matches (performance)
                if (matches.length > 500) {
                    console.warn('Too many matches found, stopping search for performance');
                    break;
                }

                // Prevent infinite loop for patterns that match empty strings
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                lastIndex = regex.lastIndex;
            }
        } else {
            // Plain text search (keep existing efficient implementation)
            const lines = text.split('\n');
            let globalIndex = 0;

            lines.forEach((line, lineIndex) => {
                let searchInLine = line;
                let searchFor = searchTerm;

                if (!options.matchCase) {
                    searchInLine = line.toLowerCase();
                    searchFor = searchTerm.toLowerCase();
                }

                let startIndex = 0;
                let matchIndex;

                while ((matchIndex = searchInLine.indexOf(searchFor, startIndex)) !== -1) {
                    matches.push({
                        index: globalIndex + matchIndex,
                        length: searchFor.length,
                        line: lineIndex + 1,
                        column: matchIndex + 1,
                        match: line.substring(matchIndex, matchIndex + searchFor.length)
                    });
                    startIndex = matchIndex + searchFor.length;

                    // Performance limit
                    if (matches.length > 500) break;
                }

                globalIndex += line.length + 1;
            });
        }
    } catch (error) {
        console.warn('Invalid regex pattern:', error);
    }

    return matches;
};