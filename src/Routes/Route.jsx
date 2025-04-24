import AdminLayout from "../Layout/AdminLayout.jsx";
import AdminDashboard from "../Pages/Admin/Dashboard";
import AdminProducts from "../Pages/Admin/AdminProduct.jsx";
import AdminOrders from "../Pages/Admin/AdminOrder.jsx";
import AdminLogin from "../Pages/Admin/AdminLogin.jsx";



import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import ProductDetail from "../Pages/Admin/productDetail.jsx";
import AddProduct from "../Pages/Admin/AddProducts.jsx";
import EditProduct from "../Pages/Admin/editProduct.jsx";
import EditOrder from "../Pages/Admin/EditOrder.jsx";
import AdminUser from "../Pages/Admin/AdminUser.jsx";
import EditUser from "../Pages/Admin/EditUser.jsx";
import AddUser from "../Pages/Admin/AddUser.jsx";
import AdminRefundRequests from "../Pages/Admin/AdminRefundOrder.jsx";

const AdminPrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem("token"); // Check if user is logged in

    if (!isAuthenticated) {
        toast.error("Only admin can access."); // Show toast message
        return <Navigate to="/" replace />; // Redirect to login
    }

    return children;
};

export default AdminPrivateRoute;


export const adminRoutes = [
    {
        path: "/admin/dashboard",
        component: () => (
            <AdminPrivateRoute>
                <AdminDashboard />
            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/admin/products",
        component: () => (
            <AdminPrivateRoute>

                    <AdminProducts />

            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/admin/products/add",
        component: () => (
            <AdminPrivateRoute>

                <AddProduct/>

            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/admin/products/:id",
        component: () => (
            <AdminPrivateRoute>

               <ProductDetail/>

            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },

    {
        path: "/admin/products/edit/:id",
        component: () => (
            <AdminPrivateRoute>

               <EditProduct/>

            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/admin/orders",
        component: () => (
            <AdminPrivateRoute>
                <AdminOrders />
            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/admin/orders/edit/:orderId",
        component: () => (
            <AdminPrivateRoute>
                <EditOrder/>
            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/admin/refunds",
        component: () => (
            <AdminPrivateRoute>
               <AdminRefundRequests/>
            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/admin/users",
        component: () => (
            <AdminPrivateRoute>
              <AdminUser/>
            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/admin/users/edit/:id",
        component: () => (
            <AdminPrivateRoute>
              <EditUser/>
            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/admin/users/add",
        component: () => (
            <AdminPrivateRoute>
                <AddUser/>
            </AdminPrivateRoute>
        ),
        layout: AdminLayout,
    },
    {
        path: "/",
        component: AdminLogin,
        layout: null, // No layout for login page
    },
];
