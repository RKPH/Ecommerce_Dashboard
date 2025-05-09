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

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, coordinate, barWidth = 90 }) => {
    if (active && payload && payload.length) {
        const tooltipWidth = barWidth;
        const xPosition = coordinate.x - tooltipWidth / 2;

        return (
            <div
                className="bg-blue-900 text-white p-3 rounded-md shadow-lg dark:bg-blue-950"
                style={{
                    width: `${tooltipWidth}px`,
                    textAlign: "center",
                    position: "absolute",
                    left: `${xPosition}px`,
                    top: `${coordinate.y - 60}px`,
                    border: "none",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                }}
            >
                <p className="text-sm font-medium m-0">{`${label}: $${payload[0].value.toFixed(2)}`}</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                <div className="flex items-center gap-x-3">
                    <TrendingUpTwoToneIcon className="text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Most Ordered Products
                    </h3>
                </div>
                <div className="relative">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={categoriesLoading}
                        className="appearance-none w-40 pl-4 pr-8 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
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
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-4">
                {loading ? (
                    [...Array(5)].map((_, index) => (
                        <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg animate-pulse space-y-4 sm:space-y-0"
                        >
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer" />
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 shimmer" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 shimmer" />
                                </div>
                            </div>
                            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded shimmer" />
                        </div>
                    ))
                ) : products.length > 0 ? (
                    products.map((product) => (
                        <div
                            key={product._id}
                            className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition shadow-sm"
                        >
                            <div className="flex items-center space-x-4 w-full sm:w-auto">
                                <img
                                    src={product.MainImage}
                                    alt={product.productName}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-medium text-gray-800 dark:text-white truncate">
                                        {product.productName}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Category: {product.category}
                                    </p>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-white whitespace-nowrap">
                                {product.totalOrdered} orders
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center">No products found</p>
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
        setChartData([]);
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
                    name: item.day,
                    revenue: item.revenue,
                }));
                setChartData(formattedData);
                setRange(data.weekDateRange);
            }
        } catch (error) {
            console.error(`Failed to fetch ${type} revenue data`, error);
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTimeframeChange = (newTimeframe) => {
        if (newTimeframe !== timeframe) {
            setTimeframe(newTimeframe);
            fetchRevenueData(newTimeframe);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                <div className="flex items-center gap-x-3">
                    <ShowChartTwoToneIcon className="text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Revenue Overview
                    </h3>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleTimeframeChange("monthly")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            timeframe === "monthly"
                                ? "bg-blue-500 text-white dark:bg-blue-600"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => handleTimeframeChange("weekly")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            timeframe === "weekly"
                                ? "bg-blue-500 text-white dark:bg-blue-600"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                    >
                        Weekly
                    </button>
                </div>
            </div>
            <div className="relative p-6">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-75 z-10 transition-opacity">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <div
                    className={`h-80 transition-opacity duration-500 ${
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
                                stroke="#E5E7EB"
                                className="dark:stroke-gray-600"
                            />
                            <XAxis
                                dataKey="name"
                                className="text-gray-700 text-sm dark:text-gray-300"
                                fontSize={14}
                            />
                            <YAxis
                                className="text-gray-700 text-sm dark:text-gray-300"
                                fontSize={14}
                            />
                            <Tooltip
                                content={<CustomTooltip barWidth={90} />}
                                wrapperStyle={{ outline: "none", border: "none", padding: 0 }}
                                cursor={false}
                            />
                            <Bar
                                dataKey="revenue"
                                fill="#3B82F6"
                                barSize={50}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {!loading && chartData.length > 0 && (
                <div className="pb-6 text-center text-sm text-gray-500 dark:text-gray-400">
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
    const [ordersData, setOrdersData] = useState({
        currentMonthOrders: 0,
        previousMonthOrders: 0,
        percentageChange: "0.00%",
    });
    const [usersData, setUsersData] = useState({
        totalUsers: { currentMonth: 0, previousMonth: 0, percentageChange: "0.00%" },
        customers: { currentMonth: 0, previousMonth: 0, percentageChange: "0.00%" },
        admins: { currentMonth: 0, previousMonth: 0, percentageChange: "0.00%" },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [revenueResponse, ordersResponse, usersResponse] = await Promise.all([
                    axiosInstance.authAxios.get("/admin/total"),
                    axiosInstance.authAxios.get("/admin/totalOrders"),
                    axiosInstance.authAxios.get("/admin/totalUsers"),
                ]);
                setRevenueData(revenueResponse.data);
                setOrdersData(ordersResponse.data);
                setUsersData(usersResponse.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                setError("Failed to load dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const cards = [
        {
            title: "REVENUES THIS MONTH",
            value: `$${revenueData.currentMonthRevenue.toLocaleString()}`,
            previousValue: `$${revenueData.previousMonthRevenue.toLocaleString()}`,
            icon: <Wallet className="w-8 h-8 text-red-500" />,
            bgColor: "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800",
            textColor: "text-red-600 dark:text-red-400",
            change: parseFloat(revenueData.percentageChange),
        },
        {
            title: "ORDERS THIS MONTH",
            value: `${ordersData.currentMonthOrders.toLocaleString()}`,
            previousValue: `${ordersData.previousMonthOrders.toLocaleString()}`,
            icon: <ShoppingBag className="w-8 h-8 text-blue-500" />,
            bgColor: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800",
            textColor: "text-blue-600 dark:text-blue-400",
            change: parseFloat(ordersData.percentageChange),
        },
        {
            title: "CUSTOMERS JOINED THIS MONTH",
            value: `${usersData.customers.currentMonth.toLocaleString()}`,
            previousValue: `${usersData.customers.previousMonth.toLocaleString()}`,
            icon: <Users className="w-8 h-8 text-green-500" />,
            bgColor: "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800",
            textColor: "text-green-600 dark:text-green-400",
            change: parseFloat(usersData.customers.percentageChange),
        },
    ];

    return (
        <div className="min-h-screen flex flex-col p-6 sm:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Dashboard</h1>
            {error && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md">
                    {error}
                </div>
            )}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cards.map((card, index) => (
                            <div
                                key={index}
                                className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className={`text-sm font-semibold ${card.textColor} uppercase tracking-wide`}>
                                            {card.title}
                                        </h2>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                            {card.value}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Last Month: {card.previousValue}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-2">
                                            {card.change !== undefined && (
                                                <span
                                                    className={`text-sm font-medium ${
                                                        card.change >= 0
                                                            ? "text-green-500 dark:text-green-400"
                                                            : "text-red-500 dark:text-red-400"
                                                    }`}
                                                >
                                                    {card.change >= 0 ? "▲" : "▼"} {Math.abs(card.change)}%
                                                </span>
                                            )}
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                vs. last month
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-lg ${card.bgColor}`}>
                                        {card.icon}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8">
                        <RevenueStatsChart />
                    </div>
                    <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <MostOrderedProducts />
                        <MostRatedProducts />
                    </div>
                </>
            )}
            <style jsx>{`
                .shimmer {
                    background: linear-gradient(
                        90deg,
                        rgba(229, 231, 235, 0.2) 25%,
                        rgba(229, 231, 235, 0.4) 50%,
                        rgba(229, 231, 235, 0.2) 75%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                .dark .shimmer {
                    background: linear-gradient(
                        90deg,
                        rgba(55, 65, 81, 0.2) 25%,
                        rgba(55, 65, 81, 0.4) 50%,
                        rgba(55, 65, 81, 0.2) 75%
                    );
                }
                @keyframes shimmer {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;