import { useState, useEffect, useRef } from "react";
import { Pencil, Trash } from "lucide-react";
import axiosInstance from "../../api/axiosInstance.js"; // Adjust path based on your structure
import {
    Select,
    MenuItem,
    FormControl,
    TextField,
    CircularProgress,
} from "@mui/material";
import DownloadForOfflineIcon from "@mui/icons-material/DownloadForOffline";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Modal from "../../Components/Modal.jsx"; // Adjust the import path as needed

// Function to convert data to CSV format
const convertToCSV = (data) => {
    const headers = ["ID,Name,Price,Category,Type,Stock,Rating"];
    const rows = data.map(
        (product) =>
            `${product.product_id},${product.name},${product.price},${product.category},${product.type},${product.stock},${product.rating || "N/A"}`
    );
    return [headers, ...rows].join("\n");
};

// Utility function to capitalize the first letter of a string
const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const AdminProducts = () => {
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [pageInput, setPageInput] = useState("");

    // New state for categories and types
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [typesLoading, setTypesLoading] = useState(false);

    // State for the modal
    const [modal, setModal] = useState({
        isOpen: false,
        type: "success",
        title: "",
        message: "",
        onClose: () => {},
    });

    const navigate = useNavigate();
    const tableHeaderRef = useRef(null);

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            setCategoriesLoading(true);
            try {
                const response = await axiosInstance.normalAxios.get("/products/categories");
                if (response.data.status === "success") {
                    setCategories(response.data.data || []);
                } else {
                    throw new Error("Failed to fetch categories");
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                setModal({
                    isOpen: true,
                    type: "error",
                    title: "Error",
                    message: error.response?.data?.message || "Failed to fetch categories due to a network error. Please try again.",
                    onClose: () => setModal({ ...modal, isOpen: false }),
                });
                setCategories([]);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Fetch types from API
    useEffect(() => {
        const fetchTypes = async () => {
            setTypesLoading(true);
            try {
                const response = await axiosInstance.normalAxios.get("/products/types");
                if (response.data.status === "success") {
                    setTypes(response.data.data || []);
                } else {
                    throw new Error("Failed to fetch types");
                }
            } catch (error) {
                console.error("Error fetching types:", error);
                setModal({
                    isOpen: true,
                    type: "error",
                    title: "Error",
                    message: error.response?.data?.message || "Failed to fetch types due to a network error. Please try again.",
                    onClose: () => setModal({ ...modal, isOpen: false }),
                });
                setTypes([]);
            } finally {
                setTypesLoading(false);
            }
        };

        fetchTypes();
    }, []);

    // Fetch products with server-side search and pagination
    useEffect(() => {
        setLoading(true);
        axiosInstance.authAxios
            .get("admin/products/all", {
                params: {
                    page,
                    limit: itemsPerPage,
                    category: categoryFilter || undefined,
                    type: typeFilter || undefined,
                    search: searchTerm || undefined,
                },
            })
            .then((response) => {
                if (response.data.status === "success") {
                    setAllProducts(response.data.data);
                    setFilteredProducts(response.data.data);
                    setTotalItems(response.data.pagination.totalItems);
                    setTotalPages(response.data.pagination.totalPages);
                    setPageInput(page.toString());
                }
            })
            .catch((error) => {
                console.error("Error fetching products:", error);
                setModal({
                    isOpen: true,
                    type: "error",
                    title: "Error",
                    message: error.response?.data?.message || "Failed to fetch products due to a network error. Please try again.",
                    onClose: () => setModal({ ...modal, isOpen: false }),
                });
                setAllProducts([]);
                setFilteredProducts([]);
                setTotalPages(1);
                setTotalItems(0);
            })
            .finally(() => setLoading(false));
    }, [page, itemsPerPage, categoryFilter, typeFilter, searchTerm]);

    useEffect(() => {
        if (tableHeaderRef.current) {
            tableHeaderRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [page, itemsPerPage]);

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

    // Delete Modal Functions
    const openDeleteModal = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setProductToDelete(null);
        setDeleteLoading(false);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        setDeleteLoading(true);
        try {
            const response = await axiosInstance.authAxios.delete(
                `/admin/products/${productToDelete.product_id}`
            );
            if (response.status === 200) {
                axiosInstance.normalAxios
                    .get("/products/all", {
                        params: {
                            page,
                            limit: itemsPerPage,
                            category: categoryFilter || undefined,
                            type: typeFilter || undefined,
                            search: searchTerm || undefined,
                        },
                    })
                    .then((response) => {
                        if (response.data.status === "success") {
                            setAllProducts(response.data.data);
                            setFilteredProducts(response.data.data);
                            setTotalItems(response.data.pagination.totalItems - 1);
                            setTotalPages(Math.ceil((response.data.pagination.totalItems - 1) / itemsPerPage));

                            if (page > response.data.pagination.totalPages && response.data.pagination.totalPages > 0) {
                                setPage(response.data.pagination.totalPages);
                            } else if (filteredProducts.length === 0 && page > 1) {
                                setPage(page - 1);
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Error refetching products:", error);
                        setModal({
                            isOpen: true,
                            type: "error",
                            title: "Error",
                            message: error.response?.data?.message || "Failed to refetch products after deletion.",
                            onClose: () => setModal({ ...modal, isOpen: false }),
                        });
                    });

                setModal({
                    isOpen: true,
                    type: "success",
                    title: "Success",
                    message: `Product "${productToDelete.name}" deleted successfully!`,
                    onClose: () => setModal({ ...modal, isOpen: false }),
                });
                closeDeleteModal();
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            setModal({
                isOpen: true,
                type: "error",
                title: "Error",
                message: error.response?.data?.message || "Failed to delete product!",
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    // Import Modal Functions
    const openImportModal = () => {
        setShowImportModal(true);
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setImportFile(null);
        setImporting(false);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImportFile(file);
        }
    };

    const confirmImport = async () => {
        if (!importFile) {
            setModal({
                isOpen: true,
                type: "error",
                title: "Error",
                message: "Please select a file to import!",
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
            return;
        }

        setImporting(true);
        const formData = new FormData();
        formData.append("file", importFile);

        try {
            const response = await axiosInstance.authAxios.post("/admin/products/import", formData);
            if (response.data.status === "success") {
                axiosInstance.normalAxios
                    .get("/products/all", {
                        params: {
                            page,
                            limit: itemsPerPage,
                            category: categoryFilter || undefined,
                            type: typeFilter || undefined,
                            search: searchTerm || undefined,
                        },
                    })
                    .then((response) => {
                        if (response.data.status === "success") {
                            setAllProducts(response.data.data);
                            setFilteredProducts(response.data.data);
                            setTotalItems(response.data.pagination.totalItems);
                            setTotalPages(response.data.pagination.totalPages);
                        }
                    })
                    .catch((error) => {
                        console.error("Error refetching products:", error);
                        setModal({
                            isOpen: true,
                            type: "error",
                            title: "Error",
                            message: error.response?.data?.message || "Failed to refetch products after import.",
                            onClose: () => setModal({ ...modal, isOpen: false }),
                        });
                    });

                setModal({
                    isOpen: true,
                    type: "success",
                    title: "Success",
                    message: response.data.message || "Products imported successfully!",
                    onClose: () => setModal({ ...modal, isOpen: false }),
                });
                closeImportModal();
            }
        } catch (error) {
            console.error("Error importing products:", error);
            setModal({
                isOpen: true,
                type: "error",
                title: "Error",
                message: error.response?.data?.message || "Failed to import products!",
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
        } finally {
            setImporting(false);
        }
    };

    const handleExport = () => {
        const csvContent = convertToCSV(filteredProducts);
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "products_export.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const startIndex = (page - 1) * itemsPerPage + 1;
    const endIndex = Math.min(page * itemsPerPage, totalItems);

    const clearFilters = () => {
        setSearchTerm("");
        setCategoryFilter("");
        setTypeFilter("");
        setPage(1);
        setPageInput("1");
    };

    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
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

    const renderPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = window.innerWidth < 640 ? 3 : 5; // Show fewer pages on mobile
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
            className="min-h-screen flex flex-col p-2 sm:p-4 md:p-5 lg:p-6 space-y-4 sm:space-y-5 bg-gray-100 dark:bg-gray-900 text-black dark:text-white overflow-auto"
        >
            <div className="flex flex-row justify-between items-center mb-4 sm:mb-5 space-y-2 sm:space-y-0">
                <h1 className="text-xl font-bold text-black dark:text-white">Products</h1>
                <nav className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    <Link to="/admin/dashboard" className="text-[#5671F0] hover:underline">
                        Dashboard
                    </Link>{" > "}
                    <span className="text-black dark:text-white hover:underline">All Products</span>
                </nav>
            </div>

            {/* Header Controls */}
            <div className="flex flex-col lg:flex-row sm:items-center justify-between gap-2 sm:gap-4 md:gap-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center w-full sm:w-auto">
                    <div className="relative w-full sm:w-48 md:w-56 lg:w-64">
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
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

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setPage(1);
                        }}
                        disabled={categoriesLoading}
                        className="w-full sm:w-32 md:w-36 lg:w-40 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <option value="" className="dark:bg-gray-700 dark:text-gray-200">
                            {categoriesLoading ? "Loading..." : "All Categories"}
                        </option>
                        {categories.map((category) => (
                            <option key={category} value={category} className="dark:bg-gray-700 dark:text-gray-200">
                                {truncateText(capitalizeFirstLetter(category), 15)}
                            </option>
                        ))}
                    </select>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setPage(1);
                        }}
                        disabled={typesLoading}
                        className="w-full sm:w-32 md:w-36 lg:w-40 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <option value="" className="dark:bg-gray-700 dark:text-gray-200">
                            {typesLoading ? "Loading..." : "All Types"}
                        </option>
                        {types.map((type) => (
                            <option key={type} value={type} className="dark:bg-gray-700 dark:text-gray-200">
                                {truncateText(capitalizeFirstLetter(type), 15)}
                            </option>
                        ))}
                    </select>
                    <button
                        className="px-3 py-2 bg-[rgba(185,80,108,0.1)] rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 text-sm font-medium text-[#b9506c] hover:bg-[rgba(185,80,108,0.2)] transition w-full sm:w-auto dark:bg-[rgba(185,80,108,0.2)] dark:text-[#b9506c] dark:hover:bg-[rgba(185,80,108,0.3)]"
                        onClick={handleExport}
                    >
                        <DownloadForOfflineIcon className="text-sm" />
                        <span>Export</span>
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center w-full sm:w-auto">
                    <button
                        onClick={openImportModal}
                        className="px-3 py-2 bg-[rgba(126,80,250,0.1)] rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 text-sm font-medium text-[#7e50fa] hover:bg-[#7e50fa] hover:text-white transition w-full sm:w-auto dark:bg-[rgba(126,80,250,0.2)] dark:text-[#7e50fa] dark:hover:bg-[#7e50fa] dark:hover:text-white"
                    >
                        <svg
                            className="w-4 sm:w-5 h-4 sm:h-5 text-sm"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <span>Import</span>
                    </button>
                    <button
                        onClick={() => navigate("/admin/products/add")}
                        className="px-3 py-2 bg-blue-500 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 text-sm font-medium text-white hover:bg-blue-600 transition w-full sm:w-auto"
                    >
                        <span>+ Add New</span>
                    </button>
                </div>
            </div>

            {/* Table and Custom Pagination */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <CircularProgress size={24} />
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <>
                        {/* Scrollable Table Container */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left text-sm">
                                <thead className="bg-[#f1f6fd] text-black dark:bg-gray-700 dark:text-white sticky top-0">
                                <tr>
                                    <th className="p-1 sm:p-2 md:p-3 font-semibold text-sm">ID</th>
                                    <th className="p-1 sm:p-2 md:p-3 font-semibold text-sm">Name</th>
                                    <th className="p-1 sm:p-2 md:p-3 font-semibold text-sm">Price</th>
                                    <th className="p-1 sm:p-2 md:p-3 font-semibold text-sm">Category</th>
                                    <th className="p-1 sm:p-2 md:p-3 font-semibold text-sm">Type</th>
                                    <th className="p-1 sm:p-2 md:p-3 font-semibold text-sm">Stock</th>
                                    <th className="p-1 sm:p-2 md:p-3 font-semibold text-sm">Rating</th>
                                    <th className="p-1 sm:p-2 md:p-3 font-semibold text-sm">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white text-black dark:bg-gray-800 dark:text-white">
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product._id}
                                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <td className="p-1 sm:p-2 md:p-3 text-sm">{product.product_id}</td>
                                        <td className="p-1 sm:p-2 md:p-3 text-sm">{truncateText(product.name, 20)}</td>
                                        <td className="p-1 sm:p-2 md:p-3 text-sm">${product.price}</td>
                                        <td className="p-1 sm:p-2 text-[#5671F0] md:p-3 text-sm">{truncateText(capitalizeFirstLetter(product.category), 15)}</td>
                                        <td className="p-1 sm:p-2 md:p-3 text-sm">{truncateText(capitalizeFirstLetter(product.type), 15)}</td>
                                        <td className="p-1 sm:p-2 md:p-3 text-sm">
                                                <span
                                                    className={`inline-flex items-center ${
                                                        product.stock === 0 ? "text-red-500 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                                                    } text-sm`}
                                                >
                                                    {product.stock === 0 && (
                                                        <span className="w-2 sm:w-3 h-2 sm:h-3 bg-red-500 dark:bg-red-400 rounded-full mr-1 sm:mr-2"></span>
                                                    )}
                                                    {product.stock}
                                                </span>
                                        </td>
                                        <td className="p-1 sm:p-2 md:p-3 text-sm text-green-400 dark:text-green-300">
                                            ⭐ {product.rating || 0}
                                        </td>
                                        <td className="p-2 sm:p-3 flex flex-row space-x-2">
                                            <button
                                                className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center w-10 h-10 hover:bg-blue-200 dark:hover:bg-blue-800 transition-all shadow-sm"
                                                onClick={() =>
                                                    navigate(`/admin/products/edit/${product.product_id}`)
                                                }
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="text-white dark:text-white hover:bg-red-500 dark:hover:bg-red-700 p-1 sm:p-2 rounded-lg bg-red-600 dark:bg-red-700 flex items-center justify-center w-10 h-10 text-sm"
                                                onClick={() => openDeleteModal(product)}
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Responsive Footer */}
                        <div className="flex flex-col lg:flex-row justify-between items-center mt-4 p-3 sm:p-4 bg-white dark:bg-gray-800 text-black dark:text-white border-t border-gray-200 dark:border-gray-700 gap-3 sm:gap-0">
                            {/* Show Entries Dropdown */}
                            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm md:text-sm lg:text-sm">
                                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">Show</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={handleItemsPerPageChange}
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 text-xs sm:text-sm md:text-sm lg:text-sm"
                                >
                                    <option value={10} className="dark:bg-gray-700 dark:text-gray-200">10</option>
                                    <option value={25} className="dark:bg-gray-700 dark:text-gray-200">25</option>
                                    <option value={50} className="dark:bg-gray-700 dark:text-gray-200">50</option>
                                    <option value={100} className="dark:bg-gray-700 dark:text-gray-200">100</option>
                                </select>
                                <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">entries</span>
                            </div>

                            {/* Showing X to Y of Z Entries */}
                            <span className="text-xs sm:text-sm md:text-sm lg:text-sm text-gray-600 dark:text-gray-300 order-3 sm:order-2">
                                Showing {startIndex} to {endIndex} of {totalItems} entries
                            </span>

                            {/* Pagination Controls */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-end space-x-1 sm:space-x-2 md:space-x-1 lg:space-x-2 order-2 sm:order-3 gap-y-2">
                                {/* Previous Button */}
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 md:py-1.5 lg:py-2 rounded-lg text-xs sm:text-sm md:text-sm lg:text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
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
                                    className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 md:py-1.5 lg:py-2 rounded-lg text-xs sm:text-sm md:text-sm lg:text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
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
                                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-1 lg:space-x-2">
                                    <input
                                        type="text"
                                        value={pageInput}
                                        onChange={handlePageInputChange}
                                        className="w-12 sm:w-16 md:w-14 lg:w-16 px-2 sm:px-3 py-1 sm:py-1.5 md:py-1.5 lg:py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm md:text-sm lg:text-sm text-center transition-colors duration-200"
                                        placeholder="Page"
                                    />
                                    <button
                                        onClick={handleGoButtonClick}
                                        className="px-2 sm:px-3 py-1 sm:py-1.5 md:py-1.5 lg:py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-xs sm:text-sm md:text-sm lg:text-sm font-medium transition-colors duration-200"
                                    >
                                        Go
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">No products found</p>
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 bg-purple-600 text-white dark:text-white rounded-lg hover:bg-purple-700 transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-lg dark:shadow-gray-900">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Confirm Deletion</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm">
                            Are you sure you want to delete the product{" "}
                            <span className="font-medium">
                                {truncateText(productToDelete?.name, 20)} (ID: {productToDelete?.product_id})
                            </span>
                            ? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-2 sm:space-x-4">
                            <button
                                onClick={closeDeleteModal}
                                className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition text-sm"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-2 sm:px-3 py-1 sm:py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition text-sm"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? (
                                    <CircularProgress size={16} color="inherit" />
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-lg dark:shadow-gray-900">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Import Products</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                            Upload a CSV file to add products. Ensure the file has columns: name,
                            category, type, stock, brand, price, description, mainImage.
                        </p>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="w-full p-2 sm:p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4 text-sm"
                        />
                        {importing && <p className="text-blue-500 dark:text-blue-400 animate-pulse mb-4 text-sm">Importing...</p>}
                        <div className="flex justify-end space-x-2 sm:space-x-4">
                            <button
                                onClick={closeImportModal}
                                className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition text-sm"
                                disabled={importing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmImport}
                                className="px-2 sm:px-3 py-1 sm:py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition text-sm"
                                disabled={importing}
                            >
                                {importing ? (
                                    <CircularProgress size={16} color="inherit" />
                                ) : (
                                    "Import"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Success/Error Messages */}
            <Modal
                isOpen={modal.isOpen}
                onClose={modal.onClose}
                type={modal.type}
                title={modal.title}
                message={modal.message}
            />
        </div>
    );
};

export default AdminProducts;