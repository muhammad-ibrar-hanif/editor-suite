import React from "react";

interface EditorPanelProps {
    title: string;
    children: React.ReactNode;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ title, children }) => {
    return (
        <div className="bg-white rounded-xl shadow-md p-4 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">{title}</h2>
            {children}
        </div>
    );
};

export default EditorPanel;
