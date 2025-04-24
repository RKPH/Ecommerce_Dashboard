import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AxiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { Steps } from "antd";
import RouteIcon from '@mui/icons-material/Route';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import MessageIcon from '@mui/icons-material/Message';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PaymentsTwoToneIcon from '@mui/icons-material/PaymentsTwoTone';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

// Format date as "HH:MM:SS,MM/DD/YY"
const formatDate = (date) => {
    const vietnamDate = new Date(date);
    vietnamDate.setHours(vietnamDate.getHours());
    const hours = String(vietnamDate.getHours()).padStart(2, '0');
    const minutes = String(vietnamDate.getMinutes()).padStart(2, '0');
    const seconds = String(vietnamDate.getSeconds()).padStart(2, '0');
    const month = String(vietnamDate.getMonth() + 1).padStart(2, '0');
    const day = String(vietnamDate.getDate()).padStart(2, '0');
    const year = String(vietnamDate.getFullYear()).slice(-2);
    return `${hours}:${minutes}:${seconds},${month}/${day}/${year}`;
};

const EditOrder = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProductRows, setShowProductRows] = useState(true);
    const [cancellationReason, setCancellationReason] = useState("");
    const orderDetailsRef = useRef(null);
    const trackingRef = useRef(null);
    const [modal, setModal] = useState({
        isOpen: false,
        type: '',
        title: '',
        message: '',
        onClose: () => setModal({ ...modal, isOpen: false }),
    });
    const [selectedAction, setSelectedAction] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await AxiosInstance.authAxios.get(`/admin/orders/${orderId}`);
                if (response.data.success) {
                    setOrder(response.data.data);
                    if (response.data.data.cancellationReason) {
                        setCancellationReason(response.data.data.cancellationReason);
                    }
                } else {
                    throw new Error(response.data.message || "Failed to fetch order");
                }
            } catch (error) {
                console.error("Error fetching order:", error);
                navigate("/admin/orders");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId, navigate]);

    useLayoutEffect(() => {
        if (orderDetailsRef.current && trackingRef.current) {
            const orderHeight = orderDetailsRef.current.scrollHeight;
            const trackingHeight = trackingRef.current.scrollHeight;
            const maxHeight = Math.max(orderHeight, trackingHeight, 400);
            orderDetailsRef.current.style.minHeight = `${maxHeight}px`;
            trackingRef.current.style.minHeight = `${maxHeight}px`;
            trackingRef.current.style.maxHeight = 'none';
        }
    }, [order, showProductRows]);

    const handleStatusUpdate = async (newStatus) => {
        if (newStatus === "CancelledByAdmin" && !cancellationReason.trim()) {
            toast.error("Please provide a reason for cancellation");
            return;
        }

        try {
            const payload = { newStatus };
            if (newStatus === "CancelledByAdmin") {
                payload.cancellationReason = cancellationReason;
            }

            const response = await AxiosInstance.authAxios.put(
                `/admin/orders/updateOrderStatus/${orderId}`,
                payload
            );

            if (response.status === 200) {
                const actionText = newStatus === "Confirmed" ? "Order is confirmed" :
                    newStatus === "Delivering" ? "Order is being delivered" :
                        newStatus === "Delivered" ? "Order is delivered successfully" :
                            newStatus === "CancelledByAdmin" ? "Order is cancelled by admin" : `Order is ${newStatus}`;

                const formattedDate = formatDate(new Date());

                setOrder((prevOrder) => ({
                    ...prevOrder,
                    ...response.data.order,
                    history: [
                        ...prevOrder.history,
                        {
                            action: actionText,
                            date: formattedDate,
                        },
                    ],
                }));

                if (newStatus === "CancelledByAdmin") {
                    setCancellationReason("");
                }

                toast.success(`Order status updated to ${newStatus}`);
                setTimeout(() => {
                    navigate("/admin/orders", { replace: true });
                }, 500);
            } else {
                throw new Error(response.data.message || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error.response?.data || error);
            toast.error(error.response?.data?.message || "Failed to update order status");
        }
    };

    const handleSetPaid = async () => {
        try {
            const response = await AxiosInstance.authAxios.put(
                `/admin/orders/updatePaymentStatus/${orderId}`,
                { payingStatus: "Paid" }
            );

            if (response.status === 200) {
                setOrder((prevOrder) => ({
                    ...prevOrder,
                    payingStatus: "Paid",
                    PaidAt: response.data.data.PaidAt || new Date(),
                }));
                toast.success("Payment status updated to Paid");
            } else {
                throw new Error("Failed to update payment status");
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
            toast.error(error.response?.data?.message || "Failed to update payment status");
        }
    };

    const handleActionSelect = (action) => {
        setSelectedAction(action);
        if (action === "CancelledByAdmin") {
            setModal({
                isOpen: true,
                type: 'cancel',
                title: 'Cancel Order',
                message: 'Please provide a reason for cancelling this order.',
                onClose: () => setModal({ ...modal, isOpen: false }),
            });
        } else {
            handleStatusUpdate(action);
        }
    };

    const handleModalConfirm = () => {
        if (!cancellationReason.trim()) {
            toast.error("Please provide a reason for cancelling this order.");
            return;
        }
        if (!selectedAction) {
            toast.error("No action selected");
            return;
        }
        setModal({ ...modal, isOpen: false });
        handleStatusUpdate(selectedAction);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-base text-gray-800 dark:text-gray-200">Loading...</div>;
    }

    if (!order) {
        return <div className="text-center text-red-500 dark:text-red-400 mt-10 text-base">Order not found</div>;
    }

    const subtotal = order.products.reduce((acc, item) => {
        const price = item.product.price || 0;
        const quantity = item.quantity || 0;
        return acc + (price * quantity);
    }, 0);

    const packingCharge = order?.shippingFee || 10;
    const total = subtotal + packingCharge;

    const steps = order.history.map((entry) => ({
        label: entry.action,
        date: entry.date,
    }));

    const activeStepIndex = steps.length - 1;

    const getNextSteps = () => {
        const currentStatus = order.status;
        switch (currentStatus) {
            case "Pending":
                return [
                    { label: "Order is confirmed", description: "Awaiting confirmation", date: "Awaiting confirmation" },
                    { label: "Order is being delivered", description: "Preparing for delivery", date: "Preparing for delivery" },
                ];
            case "Confirmed":
                return [
                    { label: "Order is being delivered", description: "In transit", date: "In transit" },
                    { label: "Order delivered", description: "Delivery completed", date: "Delivery completed" },
                ];
            case "Delivering":
                return [
                    { label: "Order delivered", description: "Delivery completed", date: "Delivery completed" },
                    null,
                ];
            case "Delivered":
            case "Cancelled":
            case "CancelledByAdmin":
                return [null, null];
            default:
                return [null, null];
        }
    };

    const [nextStep, nextNextStep] = getNextSteps();

    const allSteps = [
        ...steps.map((step, index) => ({
            title: (
                <span className={index === activeStepIndex ? "text-red-500 font-medium" : "font-medium"}>
                    {step.label}
                </span>
            ),
            description: (
                <div className="text-sm text-gray-500">
                    <div>{step.date}</div>
                </div>
            ),
        })),
        ...(nextStep ? [{
            title: <span className="font-medium text-gray-500">{nextStep.label}</span>,
            description: (
                <div className="text-sm text-gray-500">
                    <div>{nextStep.date}</div>
                </div>
            ),
        }] : []),
        ...(nextNextStep ? [{
            title: <span className="font-medium text-gray-500">{nextNextStep.label}</span>,
            description: (
                <div className="text-sm text-gray-500">
                    <div>{nextNextStep.date}</div>
                </div>
            ),
        }] : []),
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case "Pending": return <span className="px-2 py-1 bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300 rounded text-base">Place Order</span>;
            case "Confirmed": return <span className="px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded text-base">Confirmed</span>;
            case "Delivering": return <span className="px-2 py-1 bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 rounded text-base">Delivering</span>;
            case "Delivered": return <span className="px-2 py-1 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded text-base">Delivered</span>;
            case "Cancelled": return <span className="px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded text-base">Cancelled</span>;
            case "CancelledByAdmin": return <span className="px-2 py-1 bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200 rounded text-base">Cancelled by Admin</span>;
            case "Rejected": return <span className="px-2 py-1 bg-gray-400 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded text-base">Rejected</span>;
            case "RefundRequested": return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300 rounded text-base">Refund Requested</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded text-base">Unknown</span>;
        }
    };

    const getPaymentStatusBadge = (status) => {
        switch (status) {
            case "Paid":
                return <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded text-base font-medium">Paid</span>;
            case "Unpaid":
            default:
                return <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded text-base font-medium">Unpaid</span>;
        }
    };

    const formatShippingAddress = (address) => {
        if (!address) return "Not available";
        if (typeof address === 'string') return address;
        return `${address.street || ''}, ${address.city || ''}, ${address.postalCode || ''}, ${address.country || ''}`.replace(/, ,/g, '').trim();
    };

    const formatPaidAt = (paidAt) => {
        if (!paidAt) return "Not recorded";
        return formatDate(new Date(paidAt));
    };

    const formatPaymentMethod = (method) => {
        switch (method?.toLowerCase()) {
            case "cod": return "Cash On Delivery";
            case "momo": return "MoMo";
            default: return method || "Wallet";
        }
    };

    return (
        <div className="min-h-full p-4 sm:p-6 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-5 space-y-2 sm:space-y-0">
                <h1 className="text-xl font-bold text-black dark:text-white">Order #{order.order_id}</h1>
                <nav className="text-base text-gray-600 dark:text-gray-300">
                    <Link to="/admin/dashboard" className="text-[#5671F0] hover:underline">Dashboard</Link>{" > "}
                    <Link to="/admin/orders" className="text-[#5671F0] hover:underline">Orders</Link>{" > "}
                    <span className="text-gray-800 dark:text-gray-200">Edit</span>
                </nav>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-4" ref={orderDetailsRef}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-2 p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-normal text-gray-800 dark:text-gray-200 mb-2 sm:mb-0">
                                <span className="mr-2"><ShoppingBagOutlinedIcon className="text-gray-600 dark:text-gray-400" /></span> Order Details
                            </h2>

                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                <button
                                    onClick={() => setShowProductRows(!showProductRows)}
                                    className="flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none text-base"
                                >
                                    <VisibilityRoundedIcon className="text-gray-600 dark:text-gray-300" />
                                    <span className="mr-1"></span> {showProductRows ? "Hide" : "Show"} products
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto p-4">
                            <table className="w-full text-base border-collapse">
                                <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                    <th className="p-2 border border-gray-300 dark:border-gray-700">Image</th>
                                    <th className="p-2 border border-gray-300 dark:border-gray-700">Name</th>
                                    <th className="p-2 border border-gray-300 dark:border-gray-700 text-center">Quantity</th>
                                    <th className="p-2 border border-gray-300 dark:border-gray-700 text-center">Effected price</th>
                                    <th className="p-2 border border-gray-300 dark:border-gray-700 text-center">Total</th>
                                </tr>
                                </thead>
                                <tbody>
                                {showProductRows && order.products.map((item, index) => (
                                    <tr key={index} className="border border-gray-200 dark:border-gray-700">
                                        <td className="p-2 border border-gray-300 dark:border-gray-700 flex items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                                                <img src={item.product.MainImage} className="h-16 w-16 object-contain" alt={item.product.name} />
                                            </div>
                                        </td>
                                        <td className="p-2 border border-gray-300 dark:border-gray-700 font-medium text-center">{item.product.name}</td>
                                        <td className="p-2 border border-gray-300 dark:border-gray-700 text-center">{item.quantity}</td>
                                        <td className="p-2 border border-gray-300 dark:border-gray-700 text-center">${item.product.price || 0}</td>
                                        <td className="p-2 border border-gray-300 dark:border-gray-700 text-right">${(item.quantity * (item.product.price || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                                </tbody>
                                <tfoot>
                                <tr className="border border-gray-200 dark:border-gray-700">
                                    <td colSpan="4" className="p-2 border border-gray-300 dark:border-gray-700 text-right font-medium">Subtotal</td>
                                    <td className="p-2 border border-gray-300 dark:border-gray-700 text-right w-24">${subtotal.toFixed(2)}</td>
                                </tr>
                                <tr className="border border-gray-200 dark:border-gray-700">
                                    <td colSpan="4" className="p-2 border border-gray-300 dark:border-gray-700 text-right font-medium">Packaging Charge</td>
                                    <td className="p-2 border border-gray-300 dark:border-gray-700 text-right w-24">${packingCharge.toFixed(2)}</td>
                                </tr>
                                <tr className="border border-gray-200 dark:border-gray-700">
                                    <td colSpan="4" className="p-2 border border-gray-300 dark:border-gray-700 text-right font-medium">Total</td>
                                    <td className="p-2 border border-gray-300 dark:border-gray-700 text-right w-24">${total.toFixed(2)}</td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="bg-white dark:bg-gray-800 w-full sm:w-2/3 rounded-lg shadow dark:shadow-gray-900 p-4">
                            <div className="flex items-center space-x-2 mb-2 border-b py-4 border-gray-200 dark:border-gray-700">
                                <PersonIcon fontSize="medium" className="text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-500 dark:text-gray-400 text-base font-medium">Customer Detail</span>
                            </div>
                            <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                        <img src={order.user.avatar} className="h-10 w-10 rounded-full" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-base">{order.user.name || "Customer1"}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-base">{order.user.email || "customer1@shopy.com"}</p>
                                    </div>
                                </div>
                                <div className="ml-auto flex space-x-2">
                                    <button className="p-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 rounded-full">
                                        <MessageIcon fontSize="medium" />
                                    </button>
                                    <button className="p-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded-full">
                                        <PhoneIcon fontSize="medium" />
                                    </button>
                                </div>
                            </div>
                            <div className="py-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-gray-500 dark:text-gray-400 text-base font-medium">Delivery detail</span>
                                </div>
                                <p className="text-base">
                                    <span className="font-medium">Shipping address:</span> {formatShippingAddress(order.shippingAddress)}
                                </p>
                                <p className="text-base">
                                    <span className="font-medium">Phone:</span> {order.phoneNumber}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 w-full sm:w-1/3 rounded-lg h-fit shadow dark:shadow-gray-900">
                            <div className="flex items-center space-x-2 mb-2 p-4 border-b border-gray-200 dark:border-gray-700">
                                <PaymentsTwoToneIcon className="text-gray-600 dark:text-gray-400" />
                                <h3 className="text-gray-500 dark:text-gray-400 text-base font-medium">Payment details</h3>
                            </div>

                            <p className="text-base px-4">
                                <span className="font-medium">Type:</span> {formatPaymentMethod(order.PaymentMethod)}
                            </p>
                            <p className="text-base flex gap-x-4 items-center p-4">
                                <span className="font-medium">Status:</span> {getPaymentStatusBadge(order.payingStatus || "Unpaid")}
                                {order.payingStatus !== "Paid" && order.status !== "Cancelled" && order.status !== "CancelledByAdmin" && (
                                    <button
                                        onClick={handleSetPaid}
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none text-base w-28"
                                    >
                                        Set as Paid
                                    </button>
                                )}
                            </p>
                            {order.payingStatus === "Paid" && (
                                <p className="text-base p-4">
                                    <span className="font-medium">Paid at:</span> {formatPaidAt(order.PaidAt)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4" ref={trackingRef}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 min-h-[500px]">
                        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4 mb-6">
                            <div className="flex items-center space-x-2">
                                <RouteIcon className="text-gray-700 dark:text-gray-300" />
                                <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Track Order</h2>
                                {getStatusBadge(order.status)}
                            </div>
                        </div>
                        <div className="p-4">
                            <Steps
                                progressDot
                                current={activeStepIndex}
                                direction="vertical"
                                items={allSteps}
                                className="custom-steps"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900">
                        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4 mb-6">
                            <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-base">Actions</h2>
                        </div>

                        <div className="space-y-4 p-4">
                            <div className="flex flex-col sm:flex-row justify-start space-y-2 sm:space-y-0 sm:space-x-2">
                                <select
                                    onChange={(e) => handleActionSelect(e.target.value)}
                                    className="w-full sm:w-48 p-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-500 text-base bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                    value=""
                                >
                                    <option value="" disabled>Select Action</option>
                                    {order.status === "Pending" && (
                                        <option value="Confirmed">Confirm Order</option>
                                    )}
                                    {order.status === "Confirmed" && (
                                        <option value="Delivering">Mark as Delivering</option>
                                    )}
                                    {order.status === "Delivering" && (
                                        <option value="Delivered">Mark as Delivered</option>
                                    )}
                                    {["Pending", "Confirmed", "Delivering"].includes(order.status) && (
                                        <option value="CancelledByAdmin">Cancel Order</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {modal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-4">
                            {modal.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {modal.message}
                        </p>
                        {modal.type === 'cancel' && (
                            <textarea
                                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-500 text-base bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                rows="4"
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Enter cancellation reason..."
                            />
                        )}
                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                type="button"
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                                onClick={modal.onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
                                onClick={handleModalConfirm}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditOrder;