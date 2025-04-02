import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import { CloudUpload } from "lucide-react";
import Modal from "../../Components/Modal.jsx"; // Adjust the import path as needed

const AddUser = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        firstName: "",
        lastName: "",
        email: "",
        avatar: "",
        password: "",
        emailVerified: false,
        role: "customer",
    });
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // State for the modal
    const [modal, setModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onClose: () => {},
    });

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
                type: 'error',
                title: 'Image Upload Failed',
                message: 'Failed to upload the image. Please try again.',
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
        } finally {
            setUploading(false);
        }
    };

    // Handle form submission for adding a new user
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newUser = {
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            avatar: user.avatar,
            password: user.password || undefined,
            emailVerified: user.emailVerified,
            role: user.role,
        };

        if (!newUser.password) {
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Validation Error',
                message: 'Password is required for new users!',
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
            return;
        }

        try {
            const response = await axiosInstance.authAxios.post(`/admin/users/create`, newUser);
            if (response.data.status === "success") {
                setModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Success',
                    message: 'User added successfully!',
                    onClose: () => {
                        setModal({ ...modal, isOpen: false });
                        navigate(`/admin/users`);
                    },
                });
            } else {
                throw new Error("Unexpected response from server");
            }
        } catch (error) {
            console.error("Error adding user:", error);
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: `Failed to add user: ${error.response?.data?.message || error.message}`,
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
            type: 'info',
            title: 'Not Implemented',
            message: 'File manager functionality is not implemented yet.',
            onClose: () => setModal({ ...modal, isOpen: false }),
        });
    };

    return (
        <div className="min-w-fit min-h-full flex flex-col p-4 sm:p-5 space-y-5 bg-gray-100 dark:bg-gray-900 text-black dark:text-white overflow-auto">
            <div className="flex flex-row justify-between items-center mb-5 space-y-2 sm:space-y-0">
                <h1 className="text-xl font-bold text-black dark:text-white">Add New User</h1>
                <nav className="text-sm sm:text-base text-gray-600">
                    <Link to="/admin/dashboard" className="text-[#5671F0] hover:underline">
                        Dashboard
                    </Link>{" > "}
                    <Link to="/admin/users" className="text-[#5671F0] hover:underline">
                        Users
                    </Link>{" > "}
                    <span className="text-black dark:text-white ">Add New</span>
                </nav>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: General Details */}
                <div className="flex-1 bg-white dark:bg-gray-800/90 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">General</h2>
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={user.firstName}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={user.lastName}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={user.email}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                            <select
                                name="role"
                                value={user.role}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                            >
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Password (required)
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={user.password}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Right Section: Avatar Upload */}
                <div className="lg:w-1/2 bg-white dark:bg-gray-800/90 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Avatar</h2>
                    <div className="space-y-5">
                        <div>
                            <div
                                className="flex items-center justify-between p-6 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg text-gray-600 dark:text-white cursor-pointer"
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={handleClick}
                            >
                                <div className="flex items-center space-x-2">
                                    <CloudUpload className="w-6 h-6" />
                                    <span>Drop files here or click to upload.</span>
                                </div>
                                <button
                                    type="button"
                                    className="text-gray-600 dark:text-white hover:text-gray-800 dark:hover:text-gray-300"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileManagerClick();
                                    }}
                                >
                                    File manager
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
                                <div className="relative mt-3">
                                    <img
                                        src={user.avatar}
                                        alt="User Avatar Preview"
                                        className="w-48 h-48 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600 transition-all duration-300 hover:scale-105"
                                    />
                                    <button
                                        onClick={() => setUser({ ...user, avatar: "" })}
                                        className="absolute top-0 right-0 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full p-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        ✕
                                    </button>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">0 b</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
                >
                    Add User
                </button>
            </div>

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

export default AddUser;