// ModalContext.jsx
import { createContext, useContext, useState } from "react";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
    const [modal, setModal] = useState({
        isOpen: false,
        type: "success",
        title: "",
        message: "",
        onClose: null,
    });

    const showModal = ({ type, title, message, onClose }) => {
        setModal({
            isOpen: true,
            type,
            title,
            message,
            onClose,
        });
    };

    const closeModal = () => {
        if (modal.onClose) {
            modal.onClose();
        }
        setModal((prev) => ({ ...prev, isOpen: false }));
    };

    return (
        <ModalContext.Provider value={{ showModal, closeModal, modal }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};