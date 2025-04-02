import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import { CloudUpload, Folder } from "lucide-react";
import Modal from "../../Components/Modal.jsx"; // Adjust the import path as needed

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

    // State for the modal
    const [modal, setModal] = useState({
        isOpen: false,
        type: "success",
        title: "",
        message: "",
        onClose: () => {},
    });

    // Fetch user data on component mount
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

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUser({ ...user, [name]: type === "checkbox" ? checked : value });
    };

    // Handle avatar image upload
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axiosInstance.normalAxios.post("/images/upload", formData);
            const imageUrl = response.data.imageUrl;
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

    // Handle form submission
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
        console.log("Sending updated user:", updatedUser);

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
                <h1 className="text-xl font-bold text-black dark:text-white">Edit Customer</h1>
                <nav className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
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
                <div className="flex justify-center items-center h-64">
                    <p className="text-lg text-gray-600 dark:text-gray-400 animate-pulse">Loading...</p>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Section: General Details */}
                    <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={user.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div>
                                    <label sınıfName="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={user.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                        placeholder="Enter last name"
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
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder="Enter user email"
                                />
                                <label className="flex items-center space-x-2 mt-2">
                                    <input
                                        type="checkbox"
                                        name="emailVerified"
                                        checked={user.emailVerified}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600"
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
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <option value="customer" className="dark:bg-gray-700 dark:text-gray-100">
                                        Customer
                                    </option>
                                    <option value="admin" className="dark:bg-gray-700 dark:text-gray-100">
                                        Admin
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Password (if you need to change)
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={user.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
                                    placeholder="Enter new password"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Section: Avatar Upload */}
                    <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Avatar
                                </label>
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
                                        className="fex items-center space-x-1 text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
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
                                {user.avatar && (
                                    <div className="relative mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm">
                                        <img
                                            src={user.avatar}
                                            alt="User Avatar Preview"
                                            className="w-48 h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-300 hover:scale-105"
                                        />
                                        <button
                                            onClick={() => setUser({ ...user, avatar: "" })}
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
                        Update User
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

export default EditUser;