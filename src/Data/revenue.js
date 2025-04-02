import axiosInstance from "../api/axiosInstance.js"; // Adjust path if needed

export const getMonthlyRevenue = async () => {
    try {
        const response = await axiosInstance.authAxios.get("/admin/revenue");
        return response.data;
    } catch (error) {
        console.error("Error fetching revenue data:", error);
        return [];
    }
};
