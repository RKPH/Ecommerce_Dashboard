import { useState } from "react";
import Sidebar from "../Components/Admin/Sidebar.jsx";
import Header from "../Components/Admin/Header.jsx";

const NormalLayout = ({ children }) => {


    return (
        <div className="flex flex-grow dark:bg-[#121317] bg-white dark:text-white h-screen min-h-fit">

            <div className="flex dark:bg-[#121317]  min-h-fit    flex-col flex-grow">
                {/* Header */}
                <Header/>
                {/* Ensures content is below the fixed header */}
                <div className="h-16" /> {/* Height of the header */}
                <div className="flex-grow  p-6 py5   dark:bg-[#121317]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default NormalLayout;
