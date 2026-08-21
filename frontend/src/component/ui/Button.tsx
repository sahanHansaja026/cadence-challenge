import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    fullWidth = false,
    children,
    className = "",
    disabled,
    ...props
}) => {
    // Base styling for all buttons
    const baseStyles =
        "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed";

    // Variant styling
    const variantStyles: Record<ButtonVariant, string> = {
        primary:
            "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500",
        secondary:
            "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-400",
        danger:
            "bg-red-200 text-gray-700 border border-gray-300 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-400",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;