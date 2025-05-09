import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import { CloudUpload, Folder, X } from "lucide-react";
import Modal from "../../Components/Modal.jsx";

const EditUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState({
        firstName: "",
        lastName: "",
        email: "",
        avatar: "",
        password: "",
        emailVerified: false,
        role: "",
    });
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    const [modal, setModal] = useState({
        isOpen: false,
        type: "success",
        title: "",
        message: "",
        onClose: () => {},
    });

    useEffect(() => {
        setLoading(true);
        axiosInstance.authAxios
            .get(`/admin/users/${id}`)
            .then((response) => {
                const data = response.data.data;
                const nameParts = (data.name || "").split(" ");
                setUser({
                    firstName: nameParts[0] || "",
                    lastName: nameParts.slice(1).join(" ") || "",
                    email: data.email || "",
                    avatar: data.avatar || "",
                    password: "",
                    emailVerified: data.isVerified || false,
                    role: data.role || "customer",
                });
            })
            .catch((error) => {
                console.error("Error fetching user:", error);
                setModal({
                    isOpen: true,
                    type: "error",
                    title: "Error",
                    message: `Failed to fetch user data: ${error.response?.data?.message || error.message}`,
                    onClose: () => setModal({ ...modal, isOpen: false }),
                });
            })
            .finally(() => setLoading(false));

        window.scrollTo(0, 0);
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUser({ ...user, [name]: type === "checkbox" ? checked : value });
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axiosInstance.normalAxios.post("/images/upload", formData);
            const imageUrl = response.data.urlMinio;
            setUser({ ...user, avatar: imageUrl });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const updatedUser = {
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            avatar: user.avatar,
            password: user.password || undefined,
            emailVerified: user.emailVerified,
            role: user.role,
        };
        if (!updatedUser.password) {
            delete updatedUser.password;
        }

        try {
            const response = await axiosInstance.authAxios.put(`/admin/users/update/${id}`, updatedUser);
            if (response.data.status === "success") {
                setModal({
                    isOpen: true,
                    type: "success",
                    title: "Success",
                    message: "User updated successfully!",
                    onClose: () => {
                        setModal({ ...modal, isOpen: false });
                        navigate(`/admin/users`);
                    },
                });
            } else {
                throw new Error("Unexpected response from server");
            }
        } catch (error) {
            console.error("Error updating user:", error);
            setModal({
                isOpen: true,
                type: "error",
                title: "Error",
                message: `Failed to update user: ${error.response?.data?.message || error.message}`,
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
        }
    };

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
        <div className="min-h-screen flex flex-col p-6 sm:p-8 space-y-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Customer</h1>
                <nav className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    <Link to="/admin/dashboard" className="text-blue-500 hover:underline">
                        Dashboard
                    </Link>{" > "}
                    <Link to="/admin/users" className="text-blue-500 hover:underline">
                        Customers
                    </Link>{" > "}
                    <span className="text-gray-900 dark:text-white">Edit</span>
                </nav>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 bg-opacity-75 rounded-xl">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={user.firstName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                            placeholder="Enter first name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={user.lastName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                            placeholder="Enter last name"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={user.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                        placeholder="Enter user email"
                                        required
                                    />
                                    <label className="flex items-center space-x-2 mt-3">
                                        <input
                                            type="checkbox"
                                            name="emailVerified"
                                            checked={user.emailVerified}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Set email as verified</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Role
                                    </label>
                                    <select
                                        name="role"
                                        value={user.role}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 appearance-none"
                                    >
                                        <option value="customer" className="dark:bg-gray-700 dark:text-gray-100">Customer</option>
                                        <option value="admin" className="dark:bg-gray-700 dark:text-gray-100">Admin</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Password (optional)
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={user.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                        placeholder="Enter new password"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Avatar
                                    </label>
                                    <div
                                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm"
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
                                        <div className="flex items-center space-x-2 mt-2">
                                            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-sm text-blue-500">Uploading...</p>
                                        </div>
                                    )}
                                    {user.avatar && (
                                        <div className="relative mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm">
                                            <img
                                                src={user.avatar}
                                                alt="User Avatar Preview"
                                                className="w-48 h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-600 transition-all duration-300 hover:scale-105"
                                            />
                                            <button
                                                onClick={() => setUser({ ...user, avatar: "" })}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors duration-200 shadow-sm"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/users")}
                            className="px-6 py-3 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md shadow-md hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium transition-all duration-200"
                        >
                            Update User
                        </button>
                    </div>
                </form>
            )}

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

export default EditUser;