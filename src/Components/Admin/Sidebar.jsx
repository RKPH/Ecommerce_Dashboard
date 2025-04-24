// Sidebar.jsx
import { useState } from "react";
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import {
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    ListAlt as ListAltIcon,
    People as PeopleIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    ExitToApp as LogoutIcon,

} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutUserApi } from "../../Redux/AuthSlice.js";
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import './sidebar.css';

const drawerWidth = 260;

const Sidebar = ({ mobileOpen, handleDrawerToggle, isSmallScreen, theme }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedIndex, setSelectedIndex] = useState(() => {
        return parseInt(localStorage.getItem("selectedIndex")) || 0;
    });
    const [systemOpen, setSystemOpen] = useState(true);
    const [itemsOpen, setItemsOpen] = useState(true);
    const [manageShopsOpen, setManageShopsOpen] = useState(true);

    const sidebarSections = [
        {
            title: "SYSTEM",
            open: systemOpen,
            toggle: () => setSystemOpen(!systemOpen),
            items: [
                { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
            ],
        },
        {
            title: "ITEMS",
            open: itemsOpen,
            toggle: () => setItemsOpen(!itemsOpen),
            items: [
                { text: "Products", icon: <InventoryIcon />, path: "/admin/products" },
                { text: "Orders", icon: <ListAltIcon />, path: "/admin/orders" },
                { text: "Refunds", icon: <CurrencyExchangeIcon/>, path: "/admin/refunds" },
            ],
        },
        {
            title: "MANAGE SHOPS",
            open: manageShopsOpen,
            toggle: () => setManageShopsOpen(!manageShopsOpen),
            items: [
                { text: "Users", icon: <PeopleIcon />, path: "/admin/users" },
            ],
        },
    ];

    const handleItemClick = (index) => {
        setSelectedIndex(index);
        localStorage.setItem("selectedIndex", index);
        if (isSmallScreen) handleDrawerToggle();
    };

    const handleLogout = () => {
        localStorage.removeItem("selectedIndex");
        dispatch(logoutUserApi());
        navigate("/");
    };

    const renderSidebarContent = () => (
        <div
            className={`h-full flex flex-col dark:bg-[#1A1C23] bg-white transition-colors duration-300`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <img
                        src="https://micro-front-end-sport-ecommerce-homepage.vercel.app/logo.png"
                        alt="logo"
                        className="h-10"
                    />
                    <span className="text-3xl font-semibold dark:text-white text-black">
                        D2F
                    </span>
                </div>
            </div>

            {/* Navigation Items with Custom Scrollbar */}
            <div
                className={`flex-grow p-2 space-y-2 overflow-y-auto custom-scrollbar ${
                    theme === "dark" ? "dark-scrollbar" : "light-scrollbar"
                }`}
            >
                {sidebarSections.map((section, sectionIndex) => {
                    const sectionItemCount = section.items.length;
                    let itemIndexOffset = sidebarSections
                        .slice(0, sectionIndex)
                        .reduce((acc, sec) => acc + sec.items.length, 0);

                    return (
                        <div key={section.title}>
                            {/* Section Header */}
                            <div
                                className="flex items-center justify-between px-4 py-2 cursor-pointer"
                                onClick={section.toggle}
                            >
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    {section.title}
                                </span>
                                {section.open ? (
                                    <ExpandLessIcon className="text-gray-500" />
                                ) : (
                                    <ExpandMoreIcon className="text-gray-500" />
                                )}
                            </div>

                            {/* Section Items */}
                            {section.open && (
                                <List className="space-y-1">
                                    {section.items.map((item, index) => {
                                        const globalIndex = itemIndexOffset + index;
                                        return (
                                            <Link
                                                key={index}
                                                to={item.path}
                                                onClick={() => handleItemClick(globalIndex)}
                                                className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                    selectedIndex === globalIndex
                                                        ? "bg-gray-100 dark:bg-gray-700 text-black dark:text-white border-r-4 border-blue-500"
                                                        : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                                }`}
                                            >
                                                <span
                                                    className={`text-lg ${
                                                        selectedIndex === globalIndex
                                                            ? "text-blue-500"
                                                            : "text-gray-500 dark:text-gray-400"
                                                    }`}
                                                >
                                                    {item.icon}
                                                </span>
                                                <span>{item.text}</span>
                                            </Link>
                                        );
                                    })}
                                </List>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Logout Button */}
            <div className="p-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-l-md rounded-r-none bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                    <LogoutIcon />
                    <span>Log out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        borderRight: "none",
                        backgroundColor: theme === "dark" ? "#1A1C23" : "white",
                        color: theme === "dark" ? "white" : "black",
                        boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
                        zIndex: 40, // Set to 40 to be above the Header (z-30) but below the modal (z-50)
                    },
                }}
            >
                {renderSidebarContent()}
            </Drawer>

            {/* Permanent Drawer */}
            {!isSmallScreen && (
                <Drawer
                    variant="permanent"
                    sx={{
                        "& .MuiDrawer-paper": {
                            width: drawerWidth,
                            borderRight: "none",
                            backgroundColor: theme === "dark" ? "#1A1C23" : "white",
                            color: theme === "dark" ? "white" : "black",
                            boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
                            zIndex: 40, // Set to 40 to be above the Header (z-30) but below the modal (z-50)
                        },
                    }}
                >
                    {renderSidebarContent()}
                </Drawer>
            )}
        </>
    );
};

export default Sidebar;