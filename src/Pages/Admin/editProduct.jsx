import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import { CloudUpload, Folder } from "lucide-react";
import CustomReactQuill from "../../Components/Admin/CustomReactQuill.jsx";
import Modal from "../../Components/Modal.jsx"; // Adjust the import path as needed

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [product, setProduct] = useState({
        productID: "",
        name: "",
        category: "",
        type: "",
        stock: 0,
        brand: "",
        price: "",
        description: "",
        MainImage: "",
    });
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    // State for the modal
    const [modal, setModal] = useState({
        isOpen: false,
        type: "success",
        title: "",
        message: "",
        onClose: () => {},
    });

    // Fetch product data on component mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const productResponse = await axiosInstance.normalAxios.get(`/products/${id}`);
                const data = productResponse.data.data;
                setProduct({
                    productID: data.product_id || "",
                    name: data.name || "",
                    category: data.category || "",
                    type: data.type || "",
                    stock: data.stock || 0,
                    brand: data.brand || "",
                    price: data.price || "",
                    description: data.description || "",
                    MainImage: data.MainImage || "",
                });

                const categoriesResponse = await axiosInstance.normalAxios.get("/products/categories");
                setCategories(categoriesResponse.data.data || []);

                const typesResponse = await axiosInstance.normalAxios.get("/products/types");
                setTypes(typesResponse.data.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
                setModal({
                    isOpen: true,
                    type: "error",
                    title: "Error",
                    message: `Failed to fetch product data: ${error.response?.data?.message || error.message}`,
                    onClose: () => setModal({ ...modal, isOpen: false }),
                });
            } finally {
                setLoading(false);
            }

            window.scrollTo(0, 0);
        };

        fetchData();
    }, [id]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
    };

    // Handle description change from React Quill
    const handleDescriptionChange = (value) => {
        setProduct({ ...product, description: value });
    };

    // Handle image upload
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axiosInstance.normalAxios.post("/images/upload", formData);
            const imageUrl = response.data.imageUrl;
            setProduct({ ...product, MainImage: imageUrl });
            setImageFile(file);
        } catch (error) {
            console.error("Error uploading image:", error);
            setModal({
                isOpen: true,
                type: "error",
                title: "Image Upload Failed",
                message: "Failed to upload the image. Please try again.",
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
        } finally {
            setUploading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!product.name || !product.category || !product.type || !product.price || product.stock < 0) {
            setModal({
                isOpen: true,
                type: "error",
                title: "Validation Error",
                message: "Please fill in all required fields (Name, Category, Type, Price) and ensure stock is not negative.",
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
            return;
        }

        const updatedProduct = { ...product };
        console.log("Sending updated product:", updatedProduct);

        try {
            const response = await axiosInstance.authAxios.put(`/admin/products/update/${id}`, updatedProduct);
            if (response.data.message === "Product updated successfully") {
                setModal({
                    isOpen: true,
                    type: "success",
                    title: "Success",
                    message: "Product updated successfully!",
                    onClose: () => {
                        setModal({ ...modal, isOpen: false });
                        navigate(`/admin/products/${id}`);
                    },
                });
            } else {
                throw new Error("Unexpected response from server");
            }
        } catch (error) {
            console.error("Error updating product:", error);
            setModal({
                isOpen: true,
                type: "error",
                title: "Error",
                message: `Failed to update product: ${error.response?.data?.message || error.message}`,
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
        }
    };

    // Drag-and-drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add("border-blue-500");
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-blue-500");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-blue-500");
        const file = e.dataTransfer.files[0];
        if (file) {
            handleImageUpload({ target: { files: [file] } });
        }
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleFileManagerClick = () => {
        setModal({
            isOpen: true,
            type: "info",
            title: "Not Implemented",
            message: "File manager functionality is not implemented yet.",
            onClose: () => setModal({ ...modal, isOpen: false }),
        });
    };

    return (
        <div className="min-w-fit min-h-full flex flex-col p-4 sm:p-6 space-y-6 bg-gray-100 dark:bg-gray-900 text-black dark:text-white overflow-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
                <h1 className="text-xl font-bold text-black dark:text-white">Edit Product</h1>
                <nav className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    <Link to="/admin/dashboard" className="text-blue-500 hover:underline">
                        Dashboard
                    </Link>{" > "}
                    <Link to="/admin/products" className="text-blue-500 hover:underline">
                        All Products
                    </Link>{" > "}
                    <span className="text-gray-900 dark:text-white">Edit</span>
                </nav>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-lg text-gray-600 dark:text-gray-400 animate-pulse">Loading...</p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Section: Product Details */}
                    <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={product.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder="Enter product name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type</label>
                                <select
                                    name="type"
                                    value={product.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <option value="" className="dark:bg-gray-700 dark:text-gray-100">
                                        Select Type
                                    </option>
                                    {types.map((t) => (
                                        <option key={t} value={t} className="dark:bg-gray-700 dark:text-gray-100">
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={product.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <option value="" className="dark:bg-gray-700 dark:text-gray-100">
                                        Select Category
                                    </option>
                                    {categories.map((c) => (
                                        <option key={c} value={c} className="dark:bg-gray-700 dark:text-gray-100">
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Brand</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={product.brand}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder="Enter brand name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Stock</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={product.stock}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder="Enter stock quantity"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={product.price}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder="Enter price"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Section: Description & Image Upload */}
                    <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Description
                                </label>
                                <CustomReactQuill
                                    value={product.description}
                                    onChange={handleDescriptionChange}
                                    placeholder="Enter product description"
                                    height="200px"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Images</label>
                                <div
                                    className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 cursor-pointer transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={handleClick}
                                >
                                    <div className="flex items-center space-x-3">
                                        <CloudUpload className="w-6 h-6 text-blue-500" />
                                        <span className="text-sm">Drop files here or click to upload</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="flex items-center space-x-1 text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFileManagerClick();
                                        }}
                                    >
                                        <Folder className="w-5 h-5" />
                                        <span>File manager</span>
                                    </button>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        ref={fileInputRef}
                                    />
                                </div>
                                {uploading && (
                                    <p className="text-sm text-blue-500 animate-pulse mt-2">Uploading...</p>
                                )}
                                {product.MainImage && (
                                    <div className="relative mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm">
                                        <img
                                            src={product.MainImage}
                                            alt="Preview"
                                            className="w-48 h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-300 hover:scale-105"
                                        />
                                        <button
                                            onClick={() => setProduct({ ...product, MainImage: "" })}
                                            className="absolute top-2 right-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full p-1.5 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            {!loading && (
                <div className="flex justify-end mt-6">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm font-medium"
                    >
                        Update Product
                    </button>
                </div>
            )}

            {/* Modal */}
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

export default EditProduct;