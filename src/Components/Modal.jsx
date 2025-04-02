// Modal.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const Modal = ({ isOpen, onClose, type = "success", title, message }) => {
    const closeButtonRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleEsc);
            closeButtonRef.current?.focus();
        }
        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const handleTab = (e) => {
                if (e.key === "Tab") {
                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            };

            window.addEventListener("keydown", handleTab);
            return () => window.removeEventListener("keydown", handleTab);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const modalStyles = {
        success: {
            borderColor: "border-green-500",
            textColor: "text-green-500",
            buttonBg: "bg-green-600",
            buttonHoverBg: "hover:bg-green-700",
        },
        error: {
            borderColor: "border-red-500",
            textColor: "text-red-500",
            buttonBg: "bg-red-600",
            buttonHoverBg: "hover:bg-red-700",
        },
        info: {
            borderColor: "border-blue-500",
            textColor: "text-blue-500",
            buttonBg: "bg-blue-600",
            buttonHoverBg: "hover:bg-blue-700",
        },
    };

    const currentStyles = modalStyles[type] || modalStyles.success;

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
            style={{ opacity: isOpen ? 1 : 0 }}
            role="dialog"
            aria-labelledby="modal-title"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full border-t-4 ${currentStyles.borderColor} transform transition-transform duration-300`}
                style={{ transform: isOpen ? "scale(1)" : "scale(0.95)" }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2
                    id="modal-title"
                    className={`text-lg font-semibold ${currentStyles.textColor} mb-2`}
                >
                    {title}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
                <div className="flex justify-end">
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className={`px-4 py-2 text-white rounded-lg ${currentStyles.buttonBg} ${currentStyles.buttonHoverBg} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${
                            currentStyles.textColor.split("-")[1]
                        }-500 transition-all duration-200`}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default Modal;