import { useState, useEffect, useRef } from "react";
import { Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
    FormControl,
    Select,
    MenuItem,
    TextField,
    CircularProgress,
} from "@mui/material";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import { toast } from "react-toastify";
import AxiosInstance from "../../api/axiosInstance.js";
import Tippy from "@tippyjs/react/headless";
import { io } from "socket.io-client";

// Initialize Socket.IO client
const socket = io("https://backend.d2f.io.vn", {
    withCredentials: true,
    autoConnect: false,
});

const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}/${day}/${year}, ${hours}:${minutes}`;
};

const formatStatusText = (status) => {
    if (status.toLowerCase() === "cancelledbyadmin") {
        return "Cancelled by Admin";
    }
    return status;
};

const capitalizeFirstLetter = (str) => {
    if (!str || str === "N/A") return "N/A";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const convertToCSV = (data) => {
    const headers = ["Order ID,User,Total Price,Status,Payment Status,Payment Method,Created At"];
    const rows = data.map((order) =>
        `${order._id},${order.user?.name || "N/A"},${order.totalPrice?.toFixed(2) || "0.00"},${formatStatusText(order.status || "N/A")},${order.payingStatus || "N/A"},${capitalizeFirstLetter(order.PaymentMethod) || "N/A"},${order.createdAt ? formatDateTime(order.createdAt) : "N/A"}`
    );
    return [headers, ...rows].join("\n");
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
    const [payingStatusFilter, setPayingStatusFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains("dark"));
    const [pageInput, setPageInput] = useState("");

    const navigate = useNavigate();
    const tableHeaderRef = useRef(null);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        socket.connect();
        socket.on("newOrderPlaced", (data) => {
            setOrders((prevOrders) => [data, ...prevOrders.slice(0, itemsPerPage - 1)]);
            setTotalItems((prev) => prev + 1);
        });
        return () => {
            socket.off("newOrderPlaced");
            socket.disconnect();
        };
    }, [itemsPerPage]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchOrders()
            .then(() => setLoading(false))
            .catch((error) => {
                console.error("Error fetching orders:", error);
                if (error.response?.status !== 404) {
                    setError(error.message || "Failed to fetch orders");
                    toast.error(error.response?.data?.message || "Failed to fetch orders");
                }
                setLoading(false);
            });
    }, [page, itemsPerPage, searchQuery, statusFilter, paymentMethodFilter, payingStatusFilter]);

    useEffect(() => {
        if (tableHeaderRef.current) {
            tableHeaderRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [page, itemsPerPage]);

    const fetchOrders = async () => {
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: itemsPerPage,
                ...(searchQuery && { search: searchQuery }),
                ...(statusFilter && { status: statusFilter }),
                ...(paymentMethodFilter && { PaymentMethod: paymentMethodFilter }),
                ...(payingStatusFilter && { payingStatus: payingStatusFilter }),
            }).toString();

            const response = await AxiosInstance.authAxios.get(`/admin/allOrders?${queryParams}`);

            if (response.data.success) {
                setOrders(response.data.data || []);
                setTotalItems(response.data.pagination?.totalItems || 0);
                setTotalPages(response.data.pagination?.totalPages || 1);
                setPageInput(page.toString());
            } else {
                throw new Error(`API returned success: false - ${response.data.message || "Unknown error"}`);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setOrders([]);
                setTotalItems(0);
                setTotalPages(1);
                return;
            }
            throw error;
        }
    };

    const handleSearch = (e) => {
        setFilterLoading(true);
        setSearchQuery(e.target.value);
        setPage(1);
        setTimeout(() => setFilterLoading(false), 300);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            setPageInput(newPage.toString());
        }
    };

    const handleItemsPerPageChange = (event) => {
        const newItemsPerPage = event.target.value;
        setItemsPerPage(newItemsPerPage);
        setPage(1);
        setPageInput("1");
    };

    const startIndex = (page - 1) * itemsPerPage + 1;
    const endIndex = Math.min(page * itemsPerPage, totalItems);

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("");
        setPaymentMethodFilter("");
        setPayingStatusFilter("");
        setPage(1);
        setPageInput("1");
        setFilterLoading(true);
        fetchOrders().finally(() => setFilterLoading(false));
    };

    const getPaymentStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case "paid": return isDarkMode ? "bg-green-600 text-white" : "bg-green-500 text-white";
            case "unpaid": return isDarkMode ? "bg-red-600 text-white" : "bg-red-500 text-white";
            case "failed": return isDarkMode ? "bg-orange-600 text-white" : "bg-orange-500 text-white";
            default: return isDarkMode ? "bg-gray-600 text-white" : "bg-gray-500 text-white";
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case "pending": return isDarkMode ? "bg-yellow-600 text-white" : "bg-yellow-400 text-black";
            case "confirmed": return isDarkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white";
            case "delivered": return isDarkMode ? "bg-green-600 text-white" : "bg-green-500 text-white";
            case "cancelled":
            case "cancelledbyadmin": return isDarkMode ? "bg-red-600 text-white" : "bg-red-500 text-white";
            default: return isDarkMode ? "bg-gray-600 text-white" : "bg-gray-500 text-white";
        }
    };

    const handlePageInputChange = (e) => {
        setPageInput(e.target.value);
    };

    const handleGoButtonClick = () => {
        const numValue = parseInt(pageInput, 10);
        if (!isNaN(numValue) && numValue >= 1 && numValue <= totalPages) {
            setPage(numValue);
            setPageInput(numValue.toString());
        } else {
            setPageInput(page.toString());
        }
    };

    const handleExport = () => {
        const csvContent = convertToCSV(orders);
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "orders_export.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = window.innerWidth < 640 ? 3 : 5;
        const siblingCount = 1;
        const boundaryCount = 1;

        let startPage = Math.max(2, page - siblingCount);
        let endPage = Math.min(totalPages - 1, page + siblingCount);

        const totalMiddlePages = endPage - startPage + 1;
        if (totalMiddlePages > maxPagesToShow - 2 * boundaryCount) {
            const overflow = totalMiddlePages - (maxPagesToShow - 2 * boundaryCount);
            if (page <= (maxPagesToShow - 2 * boundaryCount) / 2 + 1) {
                endPage = startPage + (maxPagesToShow - 2 * boundaryCount) - 1;
            } else if (page >= totalPages - (maxPagesToShow - 2 * boundaryCount) / 2) {
                startPage = endPage - (maxPagesToShow - 2 * boundaryCount) + 1;
            } else {
                startPage += Math.floor(overflow / 2);
                endPage -= Math.ceil(overflow / 2);
            }
        }

        pages.push(
            <button
                key={1}
                onClick={() => handlePageChange(1)}
                className={`px-3 py-1.5 rounded-md mx-1 text-xs sm:text-sm font-medium transition-all duration-200 ${
                    page === 1
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
            >
                1
            </button>
        );

        if (startPage > 2) {
            pages.push(
                <span key="start-ellipsis" className="px-1 sm:px-2 py-1 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                    ...
                </span>
            );
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1.5 rounded-md mx-1 text-xs sm:text-sm font-medium transition-all duration-200 ${
                        page === i
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    }`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages - 1) {
            pages.push(
                <span key="end-ellipsis" className="px-1 sm:px-2 py-1 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                    ...
                </span>
            );
        }

        if (totalPages > 1) {
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1.5 rounded-md mx-1 text-xs sm:text-sm font-medium transition-all duration-200 ${
                        page === totalPages
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    }`}
                >
                    {totalPages}
                </button>
            );
        }

        return pages;
    };

    return (
        <div
            ref={tableHeaderRef}
            className="min-h-screen flex flex-col p-6 sm:p-8 space-y-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans"
        >
            <div className="flex flex-row justify-between items-center mb-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h1>
                <nav className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    <Link to="/admin/dashboard" className="text-blue-500 hover:underline">
                        Dashboard
                    </Link>{" > "}
                    <span className="text-gray-900 dark:text-white">All Orders</span>
                </nav>
            </div>

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                {filterLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 z-10">
                        <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
                    <div className="relative w-full sm:w-56">
                        <input
                            type="text"
                            placeholder="Search by User Name or Order ID"
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full px-3 py-2 pl-10 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <div className="relative w-full sm:w-36">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setFilterLoading(true);
                                setStatusFilter(e.target.value);
                                setPage(1);
                                setTimeout(() => setFilterLoading(false), 300);
                            }}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition appearance-none"
                        >
                            <option value="" className="dark:bg-gray-700 dark:text-gray-200">All statuses</option>
                            <option value="Pending" className="dark:bg-gray-700 dark:text-gray-200">Pending</option>
                            <option value="Confirmed" className="dark:bg-gray-700 dark:text-gray-200">Confirmed</option>
                            <option value="Delivering" className="dark:bg-gray-700 dark:text-gray-200">Delivering</option>
                            <option value="Delivered" className="dark:bg-gray-700 dark:text-gray-200">Delivered</option>
                            <option value="Cancelled" className="dark:bg-gray-700 dark:text-gray-200">Cancelled</option>
                            <option value="CancelledByAdmin" className="dark:bg-gray-700 dark:text-gray-200">Cancelled by admin</option>
                        </select>
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-36">
                        <select
                            value={paymentMethodFilter}
                            onChange={(e) => {
                                setFilterLoading(true);
                                setPaymentMethodFilter(e.target.value);
                                setPage(1);
                                setTimeout(() => setFilterLoading(false), 300);
                            }}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition appearance-none"
                        >
                            <option value="" className="dark:bg-gray-700 dark:text-gray-200">All payment methods</option>
                            <option value="cod" className="dark:bg-gray-700 dark:text-gray-200">Cod</option>
                            <option value="momo" className="dark:bg-gray-700 dark:text-gray-200">Momo</option>
                            <option value="payos" className="dark:bg-gray-700 dark:text-gray-200">Bank</option>
                        </select>
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-36">
                        <select
                            value={payingStatusFilter}
                            onChange={(e) => {
                                setFilterLoading(true);
                                setPayingStatusFilter(e.target.value);
                                setPage(1);
                                setTimeout(() => setFilterLoading(false), 300);
                            }}
                            className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition appearance-none"
                        >
                            <option value="" className="dark:bg-gray-700 dark:text-gray-200">All paying statuses</option>
                            <option value="Paid" className="dark:bg-gray-700 dark:text-gray-200">Paid</option>
                            <option value="Unpaid" className="dark:bg-gray-700 dark:text-gray-200">Unpaid</option>
                        </select>
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 rounded-md bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 text-sm font-medium transition-all w-full sm:w-auto shadow-sm"
                    >
                        Clear Filters
                    </button>
                    <button
                        className="px-3 py-2 bg-[rgba(185,80,108,0.1)] rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 text-sm font-medium text-[#b9506c] hover:bg-[rgba(185,80,108,0.2)] transition w-full sm:w-auto dark:bg-[rgba(185,80,108,0.2)] dark:text-[#b9506c] dark:hover:bg-[rgba(185,80,108,0.3)]"
                        onClick={handleExport}
                    >
                        <DownloadForOfflineIcon className="text-sm" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900 border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 bg-opacity-75">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 rounded-md p-3 mb-4">{error}</p>
                        <button
                            onClick={() => fetchOrders()}
                            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all text-sm shadow-sm"
                        >
                            Retry
                        </button>
                    </div>
                ) : orders.length > 0 ? (
                    <>
                        <div className="overflow-x-auto max-w-full">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-blue-50 dark:bg-gray-700 text-gray-900 dark:text-white sticky top-0">
                                    <tr>
                                        <th className="p-3 font-semibold">Order ID</th>
                                        <th className="p-3 font-semibold">User</th>
                                        <th className="p-3 font-semibold">Total Price</th>
                                        <th className="p-3 font-semibold">Status</th>
                                        <th className="p-3 font-semibold">Payment</th>
                                        <th className="p-3 font-semibold">Payment Method</th>
                                        <th className="p-3 font-semibold">Created At</th>
                                        <th className="p-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                    {orders.map((order) => (
                                        <tr
                                            key={order._id}
                                            className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                        >
                                            <td className="p-3 max-w-[120px]">
                                                <Tippy
                                                    render={(attrs) => (
                                                        <div
                                                            className="bg-gray-800 text-white p-2 rounded-md shadow-lg dark:bg-gray-900 text-sm"
                                                            {...attrs}
                                                        >
                                                            {order.order_id}
                                                        </div>
                                                    )}
                                                    placement="top"
                                                >
                                                    <span className="truncate block">{order.order_id}</span>
                                                </Tippy>
                                            </td>
                                            <td className="p-3 max-w-[120px]">
                                                <Tippy
                                                    render={(attrs) => (
                                                        <div
                                                            className="bg-gray-800 text-white p-2 rounded-md shadow-lg dark:bg-gray-900 text-sm"
                                                            {...attrs}
                                                        >
                                                            {order.user?.name || "N/A"}
                                                        </div>
                                                    )}
                                                    placement="top"
                                                >
                                                    <span className="truncate block">{order.user?.name || "N/A"}</span>
                                                </Tippy>
                                            </td>
                                            <td className="p-3">
                                                ${order.totalPrice?.toFixed(2) || "0.00"}
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                        order.status || "N/A"
                                                    )} hover:scale-105 transition-transform`}
                                                >
                                                    {order.status ? formatStatusText(order.status) : "N/A"}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(
                                                        order.payingStatus || "N/A"
                                                    )} hover:scale-105 transition-transform`}
                                                >
                                                    {order.payingStatus || "N/A"}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {capitalizeFirstLetter(order.PaymentMethod) || "N/A"}
                                            </td>
                                            <td className="p-3">
                                                {order.createdAt ? formatDateTime(order.createdAt) : "N/A"}
                                            </td>
                                            <td className="p-3 flex flex-row space-x-2">
                                                <button
                                                    className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center w-10 h-10 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all shadow-sm"
                                                    onClick={() => navigate(`/admin/orders/edit/${order.order_id}`)}
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-3 sm:p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 gap-3 sm:gap-0">
                            <div className="flex items-center space-x-2 text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Show</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    className="px-3 py-1.5 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                                >
                                    <option value={10} className="dark:bg-gray-700 dark:text-gray-200">10</option>
                                    <option value={25} className="dark:bg-gray-700 dark:text-gray-200">25</option>
                                    <option value={50} className="dark:bg-gray-700 dark:text-gray-200">50</option>
                                    <option value={100} className="dark:bg-gray-700 dark:text-gray-200">100</option>
                                </select>
                                <span className="text-gray-600 dark:text-gray-300">entries</span>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 order-3 sm:order-2">
                                Showing {startIndex} to {endIndex} of {totalItems} entries
                            </span>
                            <div className="flex flex-wrap items-center justify-center sm:justify-end space-x-2 order-2 sm:order-3 gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                                        page === 1
                                            ? "bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                            : "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    }`}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 19l-7-7 7-7"
                                        />
                                    </svg>
                                    Previous
                                </button>
                                <div className="flex items-center space-x-1">
                                    {renderPageNumbers()}
                                </div>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                                        page === totalPages
                                            ? "bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                            : "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    }`}
                                >
                                    Next
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 ml-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </button>
                                <div className="flex items-center space-x-1">
                                    <input
                                        type="text"
                                        value={pageInput}
                                        onChange={handlePageInputChange}
                                        className="w-14 px-2 py-1.5 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm shadow-sm text-center transition-all"
                                        placeholder="Page"
                                    />
                                    <button
                                        onClick={handleGoButtonClick}
                                        className="px-3 py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-xs sm:text-sm font-medium transition-all shadow-sm"
                                    >
                                        Go
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">No orders found</p>
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all text-sm shadow-sm"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;