import axiosInstance from "../api/axiosInstance.js"; // Adjust path if needed

export const fetchNumberEachType = async () => {
    try {
        const response = await axiosInstance.authAxios.get("/admin/product-type-sales");
        return response.data;
    } catch (error) {
        console.error("Error fetching revenue data:", error);
        return [];
    }
};
