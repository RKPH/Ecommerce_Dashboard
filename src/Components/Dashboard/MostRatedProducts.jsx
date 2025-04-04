import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import StarPurple500Icon from "@mui/icons-material/StarPurple500";
import Rating from "@mui/material/Rating";

const MostRatedProducts = () => {
    const [mostRated, setMostRated] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMostRatedProducts = async () => {
            try {
                const response = await axiosInstance.authAxios.get("/admin/topRatedProducts");
                setMostRated(response.data.data);
            } catch (error) {
                console.error("Failed to fetch most rated products", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMostRatedProducts();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <p className="text-gray-500 dark:text-gray-400">Loading most rated products...</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800  rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
            <div className="flex items-center gap-x-2 mb-6 border-b p-4">
                <StarPurple500Icon />
                <h3 className="text-base font-semibold dark:text-white"> Most Rated </h3>
            </div>

            <div className="space-y-4">
                {mostRated.map((product, index) => {
                    const isLowRating = product.averageRating < 2;

                    return (
                        <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:shadow-lg transition duration-300 space-y-4 sm:space-y-0"
                        >
                            {/* Product Image & Info */}
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <img
                                    src={product.MainImage}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-800 dark:text-white truncate">{product.name}</h4>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Rating
                                            value={product.averageRating}
                                            precision={0.1}
                                            readOnly
                                            size="small"
                                        />
                                        <p className={`text-sm font-medium ${isLowRating ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                            ({product.numberOfReviews} reviews)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MostRatedProducts;
