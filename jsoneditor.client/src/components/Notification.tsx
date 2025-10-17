// src/components/Notification.tsx - Complete Dark Mode Version
import React, { useEffect } from "react";

interface NotificationProps {
    message: string;
    type: "success" | "error" | "info";
    onClose: () => void;
    duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
    message,
    type,
    onClose,
    duration = 3000
}) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = {
        success: "bg-green-500 dark:bg-green-600",
        error: "bg-red-500 dark:bg-red-600",
        info: "bg-blue-500 dark:bg-blue-600"
    }[type];

    return (
        <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right dark:shadow-gray-900`}>
            <div className="flex items-center gap-3">
                <span>{message}</span>
                <button onClick={onClose} className="text-white hover:text-gray-200">
                    ✕
                </button>
            </div>
        </div>
    );
};

export default Notification;