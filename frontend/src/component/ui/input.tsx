import React, { useState } from "react";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
    validateOnBlur?: boolean;
    validate?: (value: string) => string | null;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error: externalError,
            fullWidth = true,
            className = "",
            id,
            type,
            required,
            validateOnBlur = true,
            validate,
            onBlur,
            onChange,
            ...props
        },
        ref
    ) => {
        const [internalError, setInternalError] = useState<string | null>(null);
        const [touched, setTouched] = useState(false);
        const [value, setValue] = useState("");

        const inputId =
            id ||
            (label
                ? label.toLowerCase().replace(/\s+/g, "-")
                : undefined);

        // Email validation
        const isValidEmail = (email: string) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };

        // Password validation
        const isValidPassword = (password: string) => {
            return password.length >= 8;
        };

        const performValidation = (inputValue: string) => {
            if (required && !inputValue.trim()) {
                return `${label || "This field"} is required`;
            }

            if (
                type === "email" &&
                inputValue.trim() &&
                !isValidEmail(inputValue)
            ) {
                return "Please enter a valid email address";
            }

            if (
                type === "password" &&
                inputValue &&
                !isValidPassword(inputValue)
            ) {
                return "Password must be at least 8 characters";
            }

            if (validate) {
                return validate(inputValue);
            }

            return null;
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setTouched(true);

            if (validateOnBlur) {
                const validationError = performValidation(e.target.value);
                setInternalError(validationError);
            }

            onBlur?.(e);
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;

            setValue(newValue);

            // Once the user starts typing, update validation
            if (touched || validateOnBlur) {
                const validationError = performValidation(newValue);
                setInternalError(validationError);
            }

            onChange?.(e);
        };

        const errorMessage = externalError || internalError;

        // Don't show validation status for empty untouched fields
        const hasValue = value.trim().length > 0;

        const isValid =
            hasValue &&
            !errorMessage &&
            (type === "email"
                ? isValidEmail(value)
                : type === "password"
                    ? isValidPassword(value)
                    : true);

        const isInvalid = hasValue && !!errorMessage;

        const baseStyles =
            "block w-full rounded-xl border px-4 py-3 pr-12 text-sm " +
            "transition-all duration-200 outline-none " +
            "focus:ring-4 focus:ring-offset-0 " +
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

        const borderStyles = isInvalid
            ? "border-red-500 bg-red-50/50 text-red-900 focus:border-red-500 focus:ring-red-500/10"
            : isValid
                ? "border-green-500 bg-green-50/30 text-gray-900 focus:border-green-500 focus:ring-green-500/10"
                : "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500/10";

        const widthStyle = fullWidth ? "w-full" : "inline-block";

        return (
            <div className={`${widthStyle}`}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-2 block text-sm font-medium text-gray-100"
                    >
                        {label}

                        {required && (
                            <span className="ml-1 text-red-400">*</span>
                        )}
                    </label>
                )}

                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        type={type}
                        required={required}
                        value={value}
                        onBlur={handleBlur}
                        onChange={handleChange}
                        className={`${baseStyles} ${borderStyles} ${className}`}
                        {...props}
                    />

                    {/* Validation Icon */}
                    {hasValue && (
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                            {isValid && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8.5 11.086l6.793-6.793a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}

                            {isInvalid && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
                                    <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l2.879 2.879a1 1 0 01-1.414 1.414L10 11.414l-4.293 2.879a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {errorMessage && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500">
                        <span>⚠</span>
                        {errorMessage}
                    </p>
                )}

                {/* Success message */}
                {isValid && (
                    <p className="mt-1.5 text-xs font-medium text-green-500">
                        {type === "email"
                            ? "Email address is valid"
                            : type === "password"
                                ? "Password is valid"
                                : "Looks good"}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;