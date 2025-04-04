import { useState, useEffect } from "react";
import { Wallet, ShoppingBag, Users } from "lucide-react";
import axiosInstance from "../../api/axiosInstance.js";
import MostRatedProducts from "../../Components/Dashboard/MostRatedProducts.jsx";
import ShowChartTwoToneIcon from '@mui/icons-material/ShowChartTwoTone';
import TrendingUpTwoToneIcon from '@mui/icons-material/TrendingUpTwoTone';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useLocation } from "react-router-dom";
import { Select } from "@mui/material";

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, coordinate, barWidth = 90 }) => {
    if (active && payload && payload.length) {
        // Calculate the x position to center the tooltip over the bar
        const tooltipWidth = barWidth; // Match the bar width
        const xPosition = coordinate.x - tooltipWidth / 2; // Center the tooltip over the bar

        return (
            <div
                className="bg-gray-800 text-white p-2 rounded shadow-lg dark:bg-gray-900"
                style={{
                    width: `${tooltipWidth}px`, // Strictly enforce the bar width
                    textAlign: "center",
                    position: "absolute",
                    left: `${xPosition}px`, // Position the tooltip to align with the bar
                    top: `${coordinate.y - 50}px`, // Adjust vertical position above the bar
                    border: "none",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
            >
                <p className="text-sm m-0">{`${label}: $${payload[0].value.toFixed(2)}`}</p>
            </div>
        );
    }
    return null;
};

const MostOrderedProducts = () => {
    const [category, setCategory] = useState("All");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axiosInstance.normalAxios.get("/products/categories");
                if (response.data.status === "success") {
                    setCategories(["All", ...response.data.data]);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const categoryParam = category === "All" ? "" : `?category=${category}`;
            const response = await axiosInstance.authAxios.get(
                `/admin/topOrderedProducts${categoryParam}`
            );
            setProducts(response.data.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [category]);

    return (
        <div className="bg-white h-[700px] overflow-y-auto dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
            {/* Header Section with Category Filter */}
            <div className="flex justify-between items-center mb-6 border-b p-4 dark:border-gray-700">
                <div className="flex items-center gap-x-2">
                    <TrendingUpTwoToneIcon />
                    <h3 className="text-base font-semibold dark:text-white">
                        Most Ordered Products
                    </h3>
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={categoriesLoading}
                    className="w-full sm:w-32 md:w-36 lg:w-40 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                    <option value="" disabled className="dark:bg-gray-700 dark:text-gray-200">
                        {categoriesLoading ? "Loading..." : "Select Category"}
                    </option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat} className="dark:bg-gray-700 dark:text-gray-200">
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            {/* Products List or Loading State */}
            <div className="space-y-4">
                {loading ? (
                    // Skeleton or loading effect within the product list area
                    [...Array(5)].map((_, index) => (
                        <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse space-y-4 sm:space-y-0"
                        >
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-lg" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="w-16 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
                        </div>
                    ))
                ) : products.length > 0 ? (
                    products.map((product,Index) => (
                        <div
                            key={Index}
                            className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:shadow-lg transition duration-300 space-y-4 sm:space-y-0"
                        >
                            {/* Product Image & Info */}
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <img
                                    src={product.MainImage}
                                    alt={product.productName}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-800 dark:text-white truncate">
                                        {product.productName}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Category: {product.category}
                                    </p>
                                </div>
                            </div>

                            {/* Order Count */}
                            <p className="text-sm font-medium text-gray-700 dark:text-white whitespace-nowrap">
                                {product.totalOrdered} orders
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">No products found</p>
                )}
            </div>
        </div>
    );
};

const RevenueStatsChart = () => {
    const [timeframe, setTimeframe] = useState("monthly");
    const [chartData, setChartData] = useState([]);
    const [range, setRange] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRevenueData("monthly");
    }, []);

    const fetchRevenueData = async (type) => {
        setLoading(true);
        setChartData([]); // Clear old data immediately for smoother transition

        try {
            const url = type === "monthly" ? "admin/revenue" : "admin/WeeklyRevenue";
            const response = await axiosInstance.authAxios.get(url);
            const data = response.data;

            if (type === "monthly") {
                const formattedData = data.monthlyRevenue.map((item) => ({
                    name: item.month,
                    revenue: item.revenue,
                }));
                setChartData(formattedData);
                setRange(data.range);
            } else {
                const formattedData = data.weeklyRevenue.map((item) => ({
                    name: item.day, // e.g., Sun, Mon, etc.
                    revenue: item.revenue,
                }));
                setChartData(formattedData);
                setRange(data.weekDateRange);
            }
        } catch (error) {
            console.error(`Failed to fetch ${type} revenue data`, error);
            setChartData([]);
        } finally {
            setTimeout(() => setLoading(false), 300); // Optional slight delay to smooth appearance
        }
    };

    const handleTimeframeChange = (newTimeframe) => {
        if (newTimeframe !== timeframe) {
            setTimeframe(newTimeframe);
            fetchRevenueData(newTimeframe);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b mb-6 dark:border-gray-700">
                <div className="flex gap-x-2">
                    <ShowChartTwoToneIcon />
                    <h3 className="text-base font-semibold dark:text-white">Revenue Overview</h3>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={() => handleTimeframeChange("monthly")}
                        className={`px-3 py-1 rounded transition ${
                            timeframe === "monthly"
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => handleTimeframeChange("weekly")}
                        className={`px-3 py-1 rounded transition ${
                            timeframe === "weekly"
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                    >
                        Weekly
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <div className="h-80 relative p-2">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-90 z-10 transition-opacity animate-fade-in">
                        <p className="text-gray-500 dark:text-gray-400">Loading revenue data...</p>
                    </div>
                )}

                <div
                    className={`h-full transition-opacity duration-500 ${
                        loading ? "opacity-0" : "opacity-100"
                    }`}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                className="text-gray-300 dark:text-gray-600"
                            />
                            <XAxis dataKey="name" className="text-gray-700 text-base dark:text-gray-300" />
                            <YAxis className="text-gray-700 text-base dark:text-gray-300" />
                            <Tooltip
                                content={<CustomTooltip barWidth={90} />}
                                wrapperStyle={{ outline: "none", border: "none", padding: 0 }}
                                cursor={false} // Disable the default cursor rectangle
                            />
                            <Bar
                                dataKey="revenue"
                                fill="#5671F0"
                                barSize={50}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Date Range */}
            {!loading && chartData.length > 0 && (
                <div className="my-4 text-center text-base text-gray-400 dark:text-gray-300">
                    <span className="font-medium">{range}</span>
                </div>
            )}
        </div>
    );
};

const AdminDashboard = () => {
    const [revenueData, setRevenueData] = useState({
        currentMonthRevenue: 0,
        previousMonthRevenue: 0,
        percentageChange: "0.00%",
    });
    const location = useLocation();
    const [ordersData, setOrdersData] = useState({
        currentMonthOrders: 0,
        previousMonthOrders: 0,
        percentageChange: "0.00%",
    });
    const [usersData, setUsersData] = useState({
        currentMonthUsers: 0,
        previousMonthUsers: 0,
        percentageChange: "0.00%",
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    useEffect(() => {
        const fetchRevenueData = async () => {
            try {
                const response = await axiosInstance.authAxios.get("/admin/total");
                setRevenueData(response.data);
            } catch (error) {
                console.error("Failed to fetch revenue data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRevenueData();
    }, []);

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const response = await axiosInstance.authAxios.get("/admin/totalOrders");
                setOrdersData(response.data);
            } catch (error) {
                console.error("Failed to fetch order data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, []);
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axiosInstance.authAxios.get("/admin/totalUsers");
                setUsersData(response.data);
            } catch (error) {
                console.error("Failed to fetch order data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const cards = [
        {
            title: "REVENUES THIS MONTH",
            value: `$${revenueData.currentMonthRevenue.toLocaleString()}`,
            icon: <Wallet className="w-8 h-8 text-red-500" />,
            bgColor: "bg-red-100 dark:bg-red-900",
            textColor: "text-red-500",
            change: parseFloat(revenueData.percentageChange),
        },
        {
            title: "ORDERS THIS MONTH",
            value: `${ordersData.currentMonthOrders.toLocaleString()}`,
            icon: <ShoppingBag className="w-8 h-8 text-blue-500" />,
            bgColor: "bg-blue-100 dark:bg-blue-900",
            textColor: "text-blue-500",
            change: parseFloat(ordersData.percentageChange),
        },
        {
            title: "USERS JOINED THIS MONTH",
            value: `${usersData.totalUsers?.currentMonth.toLocaleString() || 0}`,
            icon: <Users className="w-8 h-8 text-green-500" />,
            bgColor: "bg-green-100 dark:bg-green-900",
            textColor: "text-green-500",
            change: parseFloat(usersData.totalUsers?.percentageChange || "0"),
        },
    ];

    return (
        <div
            className="min-w-fit min-h-screen flex flex-col p-4 sm:p-5 space-y-5 bg-gray-100 dark:bg-gray-900 text-black dark:text-white overflow-auto"
        >
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-xl font-bold text-black dark:text-white">Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="p-4 border rounded-lg shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex justify-between items-center transition-transform transform hover:scale-105"
                    >
                        <div>
                            <h2 className={`text-sm font-bold ${card.textColor}`}>
                                {card.title}
                            </h2>
                            <p className="text-xl font-bold text-black dark:text-white">
                                {card.value}
                            </p>

                            {/* Percentage Change Indicator */}
                            <div className="flex items-center space-x-1 mt-1">
                                {card.change !== undefined && (
                                    <span
                                        className={`text-sm font-medium ${
                                            card.change >= 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                                        }`}
                                    >
                                        {card.change >= 0 ? "▲" : "▼"} {Math.abs(card.change)}%
                                    </span>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    compared to last month
                                </p>
                            </div>
                        </div>
                        <div className={`p-2 rounded ${card.bgColor}`}>
                            {card.icon}
                        </div>
                    </div>
                ))}
            </div>

            <RevenueStatsChart />

            <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4">
                <MostOrderedProducts />
                <MostRatedProducts />
            </div>
        </div>
    );
};

export default AdminDashboard;