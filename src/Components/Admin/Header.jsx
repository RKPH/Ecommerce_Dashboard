import { useState, useEffect } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { getUserProfile } from "../../Redux/AuthSlice.js";
import { io } from "socket.io-client";
import Tippy from "@tippyjs/react/headless";
import { Link } from "react-router-dom";

// Initialize Socket.IO client
const socket = io("https://backend.d2f.io.vn", {
    withCredentials: true,
    autoConnect: false,
});

const Header = ({ handleDrawerToggle }) => {
    const dispatch = useDispatch();

    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated, shallowEqual);
    const user = useSelector((state) => state.auth.user, shallowEqual);

    // State for tracking if the screen is mobile or tablet (less than or equal to 1024px)
    const [isTabletOrMobile, setIsTabletOrMobile] = useState(window.innerWidth <= 1024);

    const initialTheme = localStorage.getItem("theme") || "light";
    const [theme, setTheme] = useState(initialTheme);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Update isTabletOrMobile on window resize
    useEffect(() => {
        const handleResize = () => {
            const newIsTabletOrMobile = window.innerWidth <= 1024;
            setIsTabletOrMobile(newIsTabletOrMobile);
            console.log("Window resized, isTabletOrMobile:", newIsTabletOrMobile);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        console.log("isTabletOrMobile updated:", isTabletOrMobile);
    }, [isTabletOrMobile]);

    useEffect(() => {
        localStorage.setItem("theme", theme);
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    const handleThemeToggle = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    useEffect(() => {
        if (isAuthenticated && !user) {
            dispatch(getUserProfile()).catch(console.error);
        }
    }, [isAuthenticated, user, dispatch]);

    const getTimeAgo = (date) => {
        const now = new Date();
        const diffInMs = now - new Date(date);
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return "Today";
        if (diffInDays === 1) return "1 Day ago";
        return `${diffInDays} Days ago`;
    };

    const truncateOrderId = (orderId) => {
        const orderIdStr = String(orderId);
        if (orderIdStr.length > 6) {
            return `${orderIdStr.slice(0, 6)}...`;
        }
        return orderIdStr;
    };

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            socket.connect();

            socket.emit("join", user.id);

            // Listen for notifications (admin and user)
            if (user?.role === "admin") {
                socket.on("newOrderPlaced", (data) => {
                    const { id, orderId, userId, totalPrice, paymentMethod, createdAt } = data;
                    setNotifications((prevNotifications) => [
                        ...prevNotifications,
                        {
                            id,
                            orderId,
                            userId,
                            totalPrice,
                            paymentMethod,
                            createdAt: createdAt || new Date(),
                            isRead: false,
                            title: `Order #${truncateOrderId(orderId)}`,
                            message: "Hurray!!! New order received",
                            timeAgo: getTimeAgo(createdAt || new Date()),
                        },
                    ]);
                    setUnreadCount((prev) => prev + 1);
                });

                socket.on("refundBankDetailsSubmitted", (data) => {
                    const { orderId, userId, bankName, accountNumber, accountHolderName, submittedAt } = data;
                    setNotifications((prevNotifications) => [
                        ...prevNotifications,
                        {
                            id: orderId,
                            orderId,
                            userId,
                            bankName,
                            accountNumber,
                            accountHolderName,
                            createdAt: submittedAt || new Date(),
                            isRead: false,
                            title: `Refund Request #${truncateOrderId(orderId)}`,
                            message: "Refund bank details submitted",
                            timeAgo: getTimeAgo(submittedAt || new Date()),
                        },
                    ]);
                    setUnreadCount((prev) => prev + 1);
                });
            }

            socket.on("connect", () => {
                socket.emit("join", user.id);
            });

            socket.on("disconnect", () => {
                console.log("Socket.IO disconnected");
            });

            return () => {
                socket.off("orderStatusUpdated");
                socket.off("newOrderPlaced");
                socket.off("refundBankDetailsSubmitted");
                socket.off("connect");
                socket.off("disconnect");
                socket.disconnect();
            };
        }
    }, [isAuthenticated, user]);

    const handleIconClick = () => {
        setIsOpen((prev) => !prev);
        console.log("Notification icon clicked, isOpen:", !isOpen);
    };

    const markAsRead = (index) => {
        setNotifications((prevNotifications) =>
            prevNotifications.map((notif, i) =>
                i === index ? { ...notif, isRead: true } : notif
            )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
    };

    const markAllAsRead = () => {
        setNotifications((prevNotifications) =>
            prevNotifications.map((notif) => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 sm:px-10 py-2 h-[72px] shadow-md ${
                theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-800"
            }`}
        >
            <div className="flex items-center">
                <button
                    onClick={handleDrawerToggle}
                    className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full ${
                        isTabletOrMobile ? "block" : "hidden"
                    } custom-lg:hidden`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>
            </div>

            <div className="flex items-center gap-3">
                <Tippy
                    visible={isOpen}
                    onClickOutside={() => setIsOpen(false)}
                    interactive
                    placement="bottom-end"
                    render={(attrs) => (
                        <div
                            className={`w-80 border rounded-xl shadow-xl max-h-[28rem] overflow-y-auto p-4 ${
                                theme === "dark"
                                    ? "bg-gray-800 border-gray-700 text-white"
                                    : "bg-white border-gray-200 text-gray-800"
                            }`}
                            tabIndex="-1"
                            {...attrs}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Notifications</h3>
                                {notifications.length > 0 && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={markAllAsRead}
                                            className={`text-sm font-medium transition-colors duration-300 ${
                                                theme === "dark"
                                                    ? "text-blue-400 hover:text-blue-300"
                                                    : "text-blue-600 hover:text-blue-700"
                                            }`}
                                        >
                                            Mark All as Read
                                        </button>
                                        <button
                                            onClick={clearAllNotifications}
                                            className={`text-sm font-medium transition-colors duration-300 ${
                                                theme === "dark"
                                                    ? "text-red-400 hover:text-red-300"
                                                    : "text-red-500 hover:text-red-600"
                                            }`}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 ? (
                                notifications.map((notification, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start gap-3 p-3 rounded-lg mb-2 last:mb-0 transition-all duration-200 ${
                                            notification.isRead
                                                ? theme === "dark"
                                                    ? "bg-gray-700 hover:bg-gray-600"
                                                    : "bg-gray-50 hover:bg-gray-100"
                                                : theme === "dark"
                                                    ? "bg-blue-900 border border-blue-800 hover:bg-blue-800"
                                                    : "bg-blue-50 border border-blue-200 hover:bg-blue-100"
                                        }`}
                                    >
                                        <span
                                            className={`inline-block w-3 h-3 rounded-full mt-1 ${
                                                notification.isRead
                                                    ? theme === "dark"
                                                        ? "bg-gray-500"
                                                        : "bg-gray-300"
                                                    : "bg-green-500"
                                            }`}
                                        ></span>
                                        <div className="flex-1">
                                            {notification.title ? (
                                                <Link
                                                    to={`/admin/orders/edit/${notification.orderId}`}
                                                    className="block"
                                                    onClick={() => {
                                                        if (!notification.isRead) {
                                                            markAsRead(index);
                                                        }
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-semibold">
                                                            {notification.title}
                                                        </p>
                                                        <p
                                                            className={`text-xs ${
                                                                theme === "dark"
                                                                    ? "text-gray-400"
                                                                    : "text-gray-500"
                                                            }`}
                                                        >
                                                            {getTimeAgo(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm leading-tight">
                                                        {notification.message}
                                                    </p>
                                                </Link>
                                            ) : (
                                                <Link
                                                    to={`/order/${notification.orderId}`}
                                                    className="block"
                                                    onClick={() => {
                                                        if (!notification.isRead) {
                                                            markAsRead(index);
                                                        }
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-semibold">
                                                            Order #{truncateOrderId(notification.orderId)}
                                                        </p>
                                                        <p
                                                            className={`text-xs ${
                                                                theme === "dark"
                                                                    ? "text-gray-400"
                                                                    : "text-gray-500"
                                                            }`}
                                                        >
                                                            {getTimeAgo(notification.updatedAt)}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm leading-tight">
                                                        Status updated to{" "}
                                                        <span
                                                            className={`font-semibold ${
                                                                theme === "dark"
                                                                    ? "text-blue-400"
                                                                    : "text-blue-600"
                                                            }`}
                                                        >
                                                            {notification.newStatus}
                                                        </span>
                                                    </p>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center py-6">
                                    <p
                                        className={`text-sm italic ${
                                            theme === "dark"
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                        }`}
                                    >
                                        No new notifications
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                >
                    <div className="relative">
                        <button
                            onClick={handleIconClick}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                            </svg>
                        </button>
                        {unreadCount > 0 && (
                            <span
                                className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full`}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </Tippy>

                <button
                    onClick={handleThemeToggle}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                >
                    {theme === "dark" ? (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                    ) : (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                            />
                        </svg>
                    )}
                </button>

                {user?.avatar && (
                    <img
                        src={user.avatar}
                        className="w-8 h-8 rounded-full"
                        alt="User Avatar"
                    />
                )}

                {user?.role && (
                    <span className="text-base font-medium">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                )}
            </div>
        </header>
    );
};

export default Header;