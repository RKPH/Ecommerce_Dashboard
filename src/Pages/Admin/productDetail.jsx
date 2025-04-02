import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import { Rating } from "@mui/material";

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data } = await axiosInstance.normalAxios.get(`/reviews/${id}/reviews`);
                if (data.reviews.length > 0) {
                    setReviews(
                        data.reviews.map((review) => ({
                            id: review._id,
                            name: review.name,
                            user: review.user,
                            rating: review.rating,
                            comment: review.comment,
                            date: new Date(review.date).toISOString().split("T")[0],
                        }))
                    );
                }
            } catch (error) {
                console.error("Error fetching reviews:", error);
            }
        };
        fetchReviews();
    }, [id]);

    useEffect(() => {
        axiosInstance.normalAxios
            .get(`/products/${id}`)
            .then((res) => setProduct(res.data.data))
            .catch((err) => console.error("Error fetching product:", err));
    }, [id]);

    if (!product)
        return (
            <div className="flex justify-center items-center h-screen text-base text-gray-800 dark:text-gray-200 animate-pulse">
                Loading...
            </div>
        );

    return (
        <div className="min-h-screen p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 lg:px-20 overflow-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center text-base text-gray-600 dark:text-gray-300 mb-5">
                <Link
                    to="/admin/dashboard"
                    className="text-[#5671F0] hover:underline transition-colors duration-200"
                >
                    Dashboard
                </Link>
                <span className="mx-2">{">"}</span>
                <Link
                    to="/admin/products"
                    className="text-[#5671F0] hover:underline transition-colors duration-200"
                >
                    All Products
                </Link>
                <span className="mx-2">{">"}</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">{product.name}</span>
            </nav>

            {/* Product Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                <div className="flex flex-col md:flex-row">
                    {/* Product Image */}
                    <div className="w-full md:w-1/2 p-6">
                        <img
                            src={product.MainImage}
                            alt={product.name}
                            className="w-full h-80 md:h-96 object-contain rounded-lg transition-transform duration-300 hover:scale-105"
                        />
                    </div>

                    {/* Product Info */}
                    <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                {product.name}
                            </h1>

                            {/* Rating */}
                            <div className="flex items-center mb-4">
                                <Rating
                                    value={product.rating}
                                    precision={0.5}
                                    readOnly
                                    sx={{
                                        color: "gold",
                                        "& .MuiRating-iconEmpty": { color: "rgba(255, 215, 0, 0.5)" },
                                    }}
                                />
                                <span className="ml-2 text-gray-600 dark:text-gray-400 text-base">
                                    {product?.rating?.toFixed(1)} ({reviews.length || 0})
                                </span>
                            </div>

                            {/* Product Details */}
                            <div className="space-y-3 text-base text-gray-700 dark:text-gray-300">
                                <p>
                                    <span className="font-medium">Brand:</span>{" "}
                                    {product.brand || "N/A"}
                                </p>
                                <p>
                                    <span className="font-medium">Category:</span>{" "}
                                    {product.category || "N/A"}
                                </p>
                                <p>
                                    <span className="font-medium">Type:</span>{" "}
                                    {product.type || "N/A"}
                                </p>
                                <p>
                                    <span className="font-medium">Stock:</span>{" "}
                                    {product.stock > 0 ? (
                                        <span className="text-green-500 dark:text-green-400">{product.stock} available</span>
                                    ) : (
                                        <span className="text-red-500 dark:text-red-400">Out of stock</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Price */}
                        <p className="text-3xl font-bold text-[#5671F0] mt-6">
                            ${product.price.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-5">
                    Customer Reviews
                </h2>
                {reviews.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <p className="text-base">No reviews yet. Be the first to leave one!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="border-b border-gray-200 dark:border-gray-700 pb-5 last:border-b-0"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* User Avatar */}
                                        <img
                                            src={review?.user?.avatar || "https://via.placeholder.com/40"}
                                            alt={review.name}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600 transition-transform duration-200 hover:scale-110"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                                    {review.name}
                                                </span>
                                                <Rating
                                                    value={review.rating}
                                                    precision={0.5}
                                                    readOnly
                                                    size="small"
                                                    sx={{
                                                        color: "gold",
                                                        "& .MuiRating-iconEmpty": {
                                                            color: "rgba(255, 215, 0, 0.5)",
                                                        },
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {review.date}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-3 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {review.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;