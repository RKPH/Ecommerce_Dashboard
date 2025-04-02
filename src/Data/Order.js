import axiosInstance from "../api/axiosInstance.js"; // Adjust path if needed

export const getAllOrders = async () => {
    try {
        const response = await axiosInstance.authAxios.get("/admin/allOrders");
        return response.data;
    } catch (error) {
        console.error("Error fetching revenue data:", error);
        return [];
    }
};
