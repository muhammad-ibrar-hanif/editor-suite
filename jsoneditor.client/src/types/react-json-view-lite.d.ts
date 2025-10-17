declare module 'react-json-view-lite' {
    import * as React from 'react';

    export const defaultStyles: any;

    export interface JsonViewProps {
        data: any;
        style?: any;
        shouldExpandNode?: (key: string | number, data: any, level?: number) => boolean;
        onToggle?: (expanded: boolean, path: Array<string | number>) => void;
    }

    export const JsonView: React.FC<JsonViewProps>;
}