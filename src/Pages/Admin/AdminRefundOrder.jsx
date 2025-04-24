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

// Function to format datetime as MM/DD/YY, HH:MM
const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}/${day}/${year}, ${hours}:${minutes}`;
};

// Function to format refund status text
const formatRefundStatusText = (status) => {
    return status || "N/A";
};

// Function to convert refund requests to CSV format
const convertToCSV = (data) => {
    const headers = ["Order ID,User,Cancellation Reason,Refund Status,Bank Account Name,Bank Name,Account Number,Created At"];
    const rows = data.map((request) =>
        `${request.order_id},${request.user?.name || "N/A"},"${request.cancellationReason || "N/A"}",${formatRefundStatusText(request.refundStatus || "N/A")},${request.refundInfo?.accountName || "N/A"},${request.refundInfo?.bankName || "N/A"},${request.refundInfo?.accountNumber || "N/A"},${request.createdAt ? formatDateTime(request.createdAt) : "N/A"}`
    );
    return [headers, ...rows].join("\n");
};

const AdminRefundRequests = () => {
    const [requests, setRequests] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [refundStatusFilter, setRefundStatusFilter] = useState("All"); // Changed to "All" for initial load
    const [loading, setLoading] = useState(true);
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
        setLoading(true);
        setError(null);
        fetchRefundRequests()
            .then(() => setLoading(false))
            .catch((error) => {
                console.error("Error fetching refund requests:", error);
                if (error.response?.status !== 404) {
                    setError(error.message || "Failed to fetch refund requests");
                    toast.error(error.response?.data?.message || "Failed to fetch refund requests");
                }
                setLoading(false);
            });
    }, [page, itemsPerPage, searchQuery, refundStatusFilter]);

    useEffect(() => {
        if (tableHeaderRef.current) {
            tableHeaderRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [page, itemsPerPage]);

    const fetchRefundRequests = async () => {
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: itemsPerPage,
                ...(searchQuery && { search: searchQuery }),
                ...(refundStatusFilter !== "All" && { refundStatus: refundStatusFilter }), // Only include if not "All"
            }).toString();

            const response = await AxiosInstance.authAxios.get(`/admin/refund-requests?${queryParams}`);

            if (response.data.success) {
                setRequests(response.data.data || []);
                setTotalItems(response.data.totalItems || response.data.data.length);
                setTotalPages(response.data.totalPages || Math.ceil(response.data.data.length / itemsPerPage) || 1);
                setPageInput(page.toString());
            } else {
                throw new Error(`API returned success: false - ${response.data.message || "Unknown error"}`);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setRequests([]);
                setTotalItems(0);
                setTotalPages(1);
                return;
            }
            throw error;
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
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

    const handleRefundStatusUpdate = async (orderId, newRefundStatus) => {
        try {
            const response = await AxiosInstance.authAxios.put(
                `/admin/orders/updateRefundStatus/${orderId}`,
                { refundStatus: newRefundStatus }
            );

            if (response.status === 200) {
                setRequests((prevRequests) =>
                    prevRequests.map((request) =>
                        request.order_id === orderId
                            ? { ...request, refundStatus: newRefundStatus }
                            : request
                    )
                );
                toast.success(`Refund status updated to ${newRefundStatus}`);
            } else {
                throw new Error("Failed to update refund status");
            }
        } catch (error) {
            console.error("Error updating refund status:", error);
            toast.error(error.response?.data?.message || "Failed to update refund status");
        }
    };

    const startIndex = (page - 1) * itemsPerPage + 1;
    const endIndex = Math.min(page * itemsPerPage, totalItems);

    const clearFilters = () => {
        setSearchQuery("");
        setRefundStatusFilter("All"); // Reset to "All"
        setPage(1);
        setPageInput("1");
        fetchRefundRequests();
    };

    const getRefundStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "Motinitiated": return isDarkMode ? "bg-gray-700 text-white" : "bg-gray-500 text-white";
            case "Pending": return isDarkMode ? "bg-yellow-700 text-white" : "bg-yellow-500 text-white";
            case "Processing": return isDarkMode ? "bg-blue-700 text-white" : "bg-blue-500 text-white";
            case "Completed": return isDarkMode ? "bg-green-700 text-white" : "bg-green-500 text-white";
            case "Failed": return isDarkMode ? "bg-red-700 text-white" : "bg-red-500 text-white";
            default: return isDarkMode ? "bg-gray-700 text-white" : "bg-gray-500 text-white";
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
        const csvContent = convertToCSV(requests);
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "refund_requests_export.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const refundStatusOptions = ["All", "NotInitiated", "Pending", "Processing", "Completed", "Failed"];

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
                className={`px-2 sm:px-3 py-1 rounded-full mx-1 text-xs sm:text-sm font-medium transition-colors duration-200 ${
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
                    className={`px-2 sm:px-3 py-1 rounded-full mx-1 text-xs sm:text-sm font-medium transition-colors duration-200 ${
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
                    className={`px-2 sm:px-3 py-1 rounded-full mx-1 text-xs sm:text-sm font-medium transition-colors duration-200 ${
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
            className="min-h-screen flex flex-col p-4 sm:p-5 space-y-5 bg-gray-100 dark:bg-gray-900 text-black dark:text-white overflow-auto"
        >
            <div className="flex flex-row justify-between items-center mb-5 space-y-2 sm:space-y-0">
                <h1 className="text-xl font-bold text-black dark:text-white">Refund Requests</h1>
                <nav className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    <Link to="/admin/dashboard" className="text-[#5671F0] hover:underline">
                        Dashboard
                    </Link>{" > "}
                    <span className="text-black dark:text-white hover:underline">Refund Requests</span>
                </nav>
            </div>

            <div className="overflow-x-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-48 md:w-56 lg:w-64">
                        <input
                            type="text"
                            placeholder="Search by User Name or Order ID"
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full px-3 py-1.5 pl-10 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
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

                    {/* Refund Status Filter */}
                    <select
                        value={refundStatusFilter}
                        onChange={(e) => {
                            setRefundStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full sm:w-32 md:w-36 lg:w-40 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        {refundStatusOptions.map((status) => (
                            <option key={status} value={status} className="dark:bg-gray-700 dark:text-gray-200">
                                {status}
                            </option>
                        ))}
                    </select>

                    {/* Export Button */}
                    <button
                        className="px-3 py-2 bg-[rgba(185,80,108,0.1)] rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 text-sm font-medium text-[#b9506c] hover:bg-[rgba(185,80,108,0.2)] transition w-full sm:w-auto dark:bg-[rgba(185,80,108,0.2)] dark:text-[#b9506c] dark:hover:bg-[rgba(185,80,108,0.3)]"
                        onClick={handleExport}
                    >
                        <DownloadForOfflineIcon className="text-sm" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <CircularProgress />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <p className="text-lg text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => fetchRefundRequests()}
                            className="px-3 py-2 bg-purple-600 text-white dark:text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            Retry
                        </button>
                    </div>
                ) : requests.length > 0 ? (
                    <>
                        {/* Scrollable Table Container */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left text-sm">
                                <thead className="bg-[#f1f6fd] dark:bg-gray-700 text-black dark:text-white sticky top-0">
                                <tr>
                                    <th className="p-2 sm:p-3 font-semibold">Order ID</th>
                                    <th className="p-2 sm:p-3 font-semibold">User</th>
                                    <th className="p-2 sm:p-3 font-semibold">Cancellation Reason</th>
                                    <th className="p-2 sm:p-3 font-semibold">Refund Status</th>
                                    <th className="p-2 sm:p-3 font-semibold">Bank Info</th>
                                    <th className="p-2 sm:p-3 font-semibold">Created At</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 text-black dark:text-white">
                                {requests.map((request) => (
                                    <tr
                                        key={request.order_id}
                                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <td className="p-2 sm:p-3 truncate">{request.order_id}</td>
                                        <td className="p-2 sm:p-3 truncate">{request.user?.name || "N/A"}</td>
                                        <td className="p-2 sm:p-3 truncate">{request.cancellationReason || "N/A"}</td>
                                        <td className="p-2 sm:p-3 truncate">
                                            <select
                                                value={request.refundStatus || "NotInitiated"}
                                                onChange={(e) => handleRefundStatusUpdate(request.order_id, e.target.value)}
                                                className="px-2 py-1 rounded-full text-xs font-semibold border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                                                disabled={request.refundStatus === "Completed"}
                                            >
                                                {refundStatusOptions.filter(status => status !== "All").map((status) => (
                                                    <option key={status} value={status} className="dark:bg-gray-700 dark:text-gray-200">
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2 sm:p-3">
                                            {request.refundInfo ? (
                                                <ul className="text-sm text-gray-700 space-y-1">
                                                    <li className="truncate">
                                                        <span className="font-medium">Account Name:</span> {request.refundInfo.accountName || "N/A"}
                                                    </li>
                                                    <li className="truncate">
                                                        <span className="font-medium">Account Number:</span> {request.refundInfo.accountNumber || "N/A"}
                                                    </li>
                                                    <li className="truncate">
                                                        <span className="font-medium">Bank:</span> {request.refundInfo.bankName || "N/A"}
                                                    </li>
                                                </ul>
                                            ) : (
                                                <span className="text-sm text-gray-700">N/A</span>
                                            )}
                                        </td>
                                        <td className="p-2 sm:p-3 truncate">
                                            {request.createdAt ? formatDateTime(request.createdAt) : "N/A"}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Responsive Footer */}
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-3 sm:p-4 bg-white dark:bg-gray-800 text-black dark:text-white border-t border-gray-200 dark:border-gray-700 gap-3 sm:gap-0">
                            {/* Show Entries Dropdown */}
                            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">Show</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 text-xs sm:text-sm"
                                >
                                    <option value={10} className="dark:bg-gray-700 dark:text-gray-200">10</option>
                                    <option value={25} className="dark:bg-gray-700 dark:text-gray-200">25</option>
                                    <option value={50} className="dark:bg-gray-700 dark:text-gray-200">50</option>
                                    <option value={100} className="dark:bg-gray-700 dark:text-gray-200">100</option>
                                </select>
                                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">entries</span>
                            </div>

                            {/* Showing X to Y of Z Entries */}
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 order-3 sm:order-2">
                                Showing {startIndex} to {endIndex} of {totalItems} entries
                            </span>

                            {/* Pagination Controls */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-end space-x-1 sm:space-x-2 order-2 sm:order-3">
                                {/* Previous Button */}
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className={`flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                                        page === 1
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                            : "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    }`}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 sm:h-5 w-4 sm:w-5 mr-1"
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

                                {/* Page Numbers */}
                                <div className="flex items-center space-x-1">
                                    {renderPageNumbers()}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className={`flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                                        page === totalPages
                                            ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                            : "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    }`}
                                >
                                    Next
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 sm:h-5 w-4 sm:w-5 ml-1"
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

                                {/* Page Input with Go Button */}
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <input
                                        type="text"
                                        value={pageInput}
                                        onChange={handlePageInputChange}
                                        className="w-12 sm:w-16 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm text-center transition-colors duration-200"
                                        placeholder="Page"
                                    />
                                    <button
                                        onClick={handleGoButtonClick}
                                        className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-xs sm:text-sm font-medium transition-colors duration-200"
                                    >
                                        Go
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">No refund requests found</p>
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 bg-purple-600 text-white dark:text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRefundRequests;