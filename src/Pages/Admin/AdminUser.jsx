import { useState, useEffect, useRef } from "react";
import { Pencil, File } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
    FormControl,
    Select,
    MenuItem,
    TextField,
    CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import axiosInstance from "../../api/axiosInstance.js";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";

// Function to convert data to CSV format
const convertToCSV = (data) => {
    const headers = ["User ID,Name,Role,Email,Joined At"];
    const rows = data.map((user) => {
        const formattedDate = formatDateTime(user.createdAt);
        return `${user.user_id},${user.name},${user.role},${user.email},${formattedDate}`;
    });
    return [headers, ...rows].join("\n");
};

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

const UserManagement = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains("dark"));
    const [pageInput, setPageInput] = useState(""); // State for page number input

    const navigate = useNavigate();
    const tableHeaderRef = useRef(null);

    // Monitor dark mode changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkMode(document.documentElement.classList.contains("dark"));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    // Fetch users when page, itemsPerPage, searchQuery, or roleFilter changes
    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchUsers()
            .then(() => setLoading(false))
            .catch((error) => {
                console.error("Error fetching users:", error);
                // Only set error and show toast for non-404 errors
                if (error.response?.status !== 404) {
                    setError(error.message || "Failed to fetch users");
                    toast.error(error.response?.data?.message || "Failed to fetch users");
                }
                setLoading(false);
            });
    }, [page, itemsPerPage, searchQuery, roleFilter]);

    // Scroll to table header on page or itemsPerPage change
    useEffect(() => {
        if (tableHeaderRef.current) {
            tableHeaderRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [page, itemsPerPage]);

    // Fetch users from API with query parameters
    const fetchUsers = async () => {
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: itemsPerPage,
                ...(searchQuery && { search: searchQuery }),
                ...(roleFilter && { role: roleFilter }),
            }).toString();

            const response = await axiosInstance.authAxios.get(`/admin/users?${queryParams}`);

            if (response.data.status === "success") {
                setAllUsers(response.data.data || []);
                setTotalItems(response.data.pagination?.totalItems || 0);
                setTotalPages(response.data.pagination?.totalPages || 1);
                setPageInput(page.toString()); // Sync input with current page
            } else {
                throw new Error(`API returned error - ${response.data.message || "Unknown error"}`);
            }
        } catch (error) {
            // If the error is a 404, treat it as "no users found" instead of an error
            if (error.response?.status === 404) {
                setAllUsers([]);
                setTotalItems(0);
                setTotalPages(1);
                return; // Don't throw the error, so the UI shows "No users found"
            }
            throw error;
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            setPageInput(newPage.toString()); // Sync input with new page
        }
    };

    const handleItemsPerPageChange = (event) => {
        const newItemsPerPage = event.target.value;
        setItemsPerPage(newItemsPerPage);
        setPage(1); // Reset to first page on items per page change
        setPageInput("1"); // Reset input to 1
    };

    const startIndex = (page - 1) * itemsPerPage + 1;
    const endIndex = Math.min(page * itemsPerPage, totalItems);

    const clearFilters = () => {
        setSearchQuery("");
        setRoleFilter("");
        setPage(1);
        setPageInput("1"); // Reset input to 1
        fetchUsers(); // Immediately refetch after clearing filters
    };

    const handleExport = () => {
        const csvContent = convertToCSV(allUsers);
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "users_export.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    // Handle page number input change (only updates the input, not the page)
    const handlePageInputChange = (e) => {
        setPageInput(e.target.value);
    };

    // Handle Enter key press to submit page number
    const handlePageInputKeyPress = (e) => {
        if (e.key === "Enter") {
            const numValue = parseInt(pageInput, 10);
            if (!isNaN(numValue) && numValue >= 1 && numValue <= totalPages) {
                setPage(numValue);
                setPageInput(numValue.toString()); // Ensure input reflects the new page
            } else {
                setPageInput(page.toString()); // Revert to current page if invalid
            }
        }
    };

    // Render page numbers for custom pagination
    const renderPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5; // Maximum number of page buttons to show (excluding first/last)
        const siblingCount = 1; // Number of pages to show on each side of the current page
        const boundaryCount = 1; // Always show the first and last pages

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

        // Always include the first page
        pages.push(
            <button
                key={1}
                onClick={() => handlePageChange(1)}
                className={`px-3 py-1 rounded-lg mx-1 ${
                    page === 1 ? "bg-blue-500 text-white" : "bg-white border hover:bg-gray-100"
                }`}
            >
                1
            </button>
        );

        // Add ellipsis if there's a gap between the first page and startPage
        if (startPage > 2) {
            pages.push(
                <span key="start-ellipsis" className="px-2 py-1">
                    ...
                </span>
            );
        }

        // Render middle pages
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 rounded-lg mx-1 ${
                        page === i ? "bg-blue-500 text-white" : "bg-white border hover:bg-gray-100"
                    }`}
                >
                    {i}
                </button>
            );
        }

        // Add ellipsis if there's a gap between endPage and the last page
        if (endPage < totalPages - 1) {
            pages.push(
                <span key="end-ellipsis" className="px-2 py-1">
                    ...
                </span>
            );
        }

        // Always include the last page if totalPages > 1
        if (totalPages > 1) {
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1 rounded-lg mx-1 ${
                        page === totalPages ? "bg-blue-500 text-white" : "bg-white border hover:bg-gray-100"
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
            className="min-h-full flex flex-col p-4 sm:p-5 space-y-5 bg-gray-100 dark:bg-gray-900 text-black dark:text-gray-200 overflow-auto"
        >
            <div className="flex flex-row justify-between items-center mb-5 space-y-2 sm:space-y-0">
                <h1 className="text-xl font-bold text-black dark:text-white">User Management</h1>
                <nav className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    <Link to="/admin/dashboard" className="text-[#5671F0] dark:text-purple-300 hover:underline">
                        Dashboard
                    </Link>{" > "}
                    <span className="text-black dark:text-white">All Users</span>
                </nav>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-48 md:w-56 lg:w-64">
                        <input
                            type="text"
                            placeholder="Search by Name or Email"
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

                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPage(1);
                        }}
                        className="w-full sm:w-32 md:w-36 lg:w-40 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <option value="" className="dark:bg-gray-700 dark:text-gray-200">All roles</option>
                        {[...new Set(allUsers.map((u) => u.role))].map((role) => (
                            <option key={role} value={role} className="dark:bg-gray-700 dark:text-gray-200">
                                {role}
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

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center w-full sm:w-auto">
                    {/* Add New Button */}
                    <button
                        onClick={() => navigate("/admin/users/add")}
                        className="px-3 py-2 bg-blue-500 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 text-sm font-medium text-white hover:bg-blue-600 transition w-full sm:w-auto"
                    >
                        <span>+ Add New</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <CircularProgress />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <p className="text-lg text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={() => fetchUsers()}
                            className="px-3 py-2 bg-purple-600 text-white dark:text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            Retry
                        </button>
                    </div>
                ) : allUsers.length > 0 ? (
                    <>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#f1f6fd] dark:bg-gray-700 text-black dark:text-white">
                            <tr>
                                <th className="p-2 sm:p-3 font-semibold">User ID</th>
                                <th className="p-2 sm:p-3 font-semibold">User</th>
                                <th className="p-2 sm:p-3 font-semibold">Role</th>
                                <th className="p-2 sm:p-3 font-semibold">Email</th>
                                <th className="p-2 sm:p-3 font-semibold">Joined At</th>
                                <th className="p-2 sm:p-3 font-semibold">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 text-black dark:text-white">
                            {allUsers.map((user) => (
                                <tr
                                    key={user.user_id}
                                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <td className="p-2 sm:p-3">{user.user_id}</td>
                                    <td className="p-2 sm:p-3 flex items-center space-x-2">
                                        <img
                                            src={user.avatar || "https://via.placeholder.com/40"}
                                            alt={`${user.name}'s avatar`}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <span>{user.name}</span>
                                    </td>
                                    <td className="p-2 sm:p-3">{user.role}</td>
                                    <td className="p-2 sm:p-3">{user.email}</td>
                                    <td className="p-2 sm:p-3">
                                        {user.createdAt ? formatDateTime(user.createdAt) : "N/A"}
                                    </td>
                                    <td className="p-2 sm:p-3 flex flex-row space-x-2">
                                        <button
                                            className="text-green-500 dark:text-green-300 hover:text-green-700 dark:hover:text-green-400 p-2 rounded-lg bg-green-100 dark:bg-green-100/20 flex items-center justify-center w-10 h-10"
                                            onClick={() => navigate(`/admin/users/edit/${user.user_id}`)}
                                        >
                                            <Pencil size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-2 sm:p-3 bg-white dark:bg-gray-900 text-black dark:text-gray-200">
                            <div className="flex items-center space-x-2 text-sm">
                                <span>Show</span>
                                <FormControl variant="outlined" size="small">
                                    <Select
                                        value={itemsPerPage}
                                        onChange={handleItemsPerPageChange}
                                        className="min-w-[60px] bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded"
                                    >
                                        <MenuItem value={10}>10</MenuItem>
                                        <MenuItem value={25}>25</MenuItem>
                                        <MenuItem value={50}>50</MenuItem>
                                        <MenuItem value={100}>100</MenuItem>
                                    </Select>
                                </FormControl>
                                <span>entries</span>
                            </div>
                            <span className="text-sm mt-2 sm:mt-0">
                                Showing {startIndex} to {endIndex} of {totalItems} entries
                            </span>
                            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className={`px-3 py-1 rounded-lg border ${page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
                                >
                                    Previous
                                </button>
                                {renderPageNumbers()}
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className={`px-3 py-1 rounded-lg border ${page === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
                                >
                                    Next
                                </button>
                                <TextField
                                    variant="outlined"
                                    size="small"
                                    value={pageInput}
                                    onChange={handlePageInputChange}
                                    onKeyPress={handlePageInputKeyPress}
                                    inputProps={{ style: { textAlign: "center" } }}
                                    className="w-16 bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded text-sm"
                                    placeholder="Go to page"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">No users found</p>
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

export default UserManagement;