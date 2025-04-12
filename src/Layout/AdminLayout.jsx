// AdminLayout.jsx
import { useState, useEffect } from "react";
import Sidebar from "../Components/Admin/Sidebar.jsx";
import Header from "../Components/Admin/Header.jsx";
import { useMediaQuery } from "@mui/material";
import Modal from "../Components/Modal.jsx";
import { ModalProvider, useModal } from "../Context/ModalContext.jsx";

const AdminLayout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const isSmallScreen = useMediaQuery("(max-width: 1024px)");
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        const html = document.documentElement;
        if (theme === "dark") {
            html.classList.add("dark");
        } else {
            html.classList.remove("dark");
        }
    }, [theme]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <ModalProvider>
            <div className={`flex h-screen w-screen dark:bg-black bg-white dark:text-white`}>
                <Sidebar
                    mobileOpen={mobileOpen}
                    handleDrawerToggle={handleDrawerToggle}
                    isSmallScreen={isSmallScreen}
                    theme={theme}
                    className="z-40" // Updated to match the Drawer's z-index
                />

                <div
                    className={`flex flex-col flex-grow min-w-0 w-full transition-all duration-300 ${
                        isSmallScreen ? "ml-0" : "ml-[260px]"
                    }`}
                >
                    <div className="fixed top-0 left-0 right-0 z-30"> {/* Lowered from z-40 to z-30 */}
                        <Header handleDrawerToggle={handleDrawerToggle} />
                    </div>

                    <div className="flex-grow overflow-auto mt-16 dark:bg-black">
                        {children}
                    </div>

                    <footer className="w-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-4 text-center text-sm">
                        <div className="container mx-auto flex justify-between items-center px-4">
                            <span>2025 D2F-Alright reserved</span>
                            <div className="space-x-4">
                                <a href="/about" className="hover:text-gray-900 dark:hover:text-white">
                                    About
                                </a>
                                <a href="/support" className="hover:text-gray-900 dark:hover:text-white">
                                    Support
                                </a>
                                <a href="/contact" className="hover:text-gray-900 dark:hover:text-white">
                                    Contact Us
                                </a>
                            </div>
                        </div>
                    </footer>
                </div>

                <ModalWrapper />
            </div>
        </ModalProvider>
    );
};

const ModalWrapper = () => {
    const { modal, closeModal } = useModal();
    return (
        <Modal
            isOpen={modal.isOpen}
            onClose={closeModal}
            type={modal.type}
            title={modal.title}
            message={modal.message}
        />
    );
};

export default AdminLayout;