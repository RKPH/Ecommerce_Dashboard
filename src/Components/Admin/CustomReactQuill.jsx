// src/components/CustomReactQuill.jsx
import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import React Quill styles

const CustomReactQuill = ({
                              value,
                              onChange,
                              placeholder = "Enter text here...",
                              height = "1200px", // Default height
                              modules,
                              formats,
                              className = "",
                              ...props
                          }) => {
    // Default toolbar and formats if not provided
    const defaultModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["clean"],
        ],
    };

    const defaultFormats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "list",
        "bullet",
        "link",
    ];

    return (
        <div className="w-full">
            <ReactQuill
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                modules={modules || defaultModules}
                formats={formats || defaultFormats}
                className={`
                    bg-gray-100 dark:bg-gray-700 
                    rounded-lg border border-gray-300 dark:border-gray-600 
                    text-gray-900 dark:text-gray-100
                    ${className}
                `}
                {...props}
            />
            {/* Custom styles applied via Tailwind CSS */}
            <style jsx>{`
                .ql-container {
                    min-height: 200px;
                    overflow-y: auto;
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                }
                .ql-toolbar.ql-snow {
                    background: #f3f4f6; /* bg-gray-100 */
                    border: 1px solid #d1d5db; /* border-gray-300 */
                    border-bottom: none;
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                }
                .dark .ql-toolbar.ql-snow {
                    background: #374151; /* bg-gray-700 */
                    border: 1px solid #4b5563; /* border-gray-600 */
                }
                .ql-container.ql-snow {
                    background: #f3f4f6; /* bg-gray-100 */
                    border: 1px solid #d1d5db; /* border-gray-300 */
                    color: #111827; /* text-gray-900 */
                }
                .dark .ql-container.ql-snow {
                    background: #374151; /* bg-gray-700 */
                    border: 1px solid #4b5563; /* border-gray-600 */
                    color: #f3f4f6; /* text-gray-100 */
                }
                .ql-editor::before {
                    color: #6b7280; /* placeholder-gray-500 */
                }
                .dark .ql-editor::before {
                    color: #9ca3af; /* dark:placeholder-gray-400 */
                }
                .ql-toolbar.ql-snow .ql-formats {
                    margin-right: 8px;
                }
                .ql-toolbar.ql-snow .ql-picker-label,
                .ql-toolbar.ql-snow .ql-picker-item {
                    color: #374151; /* text-gray-700 */
                }
                .dark .ql-toolbar.ql-snow .ql-picker-label,
                .dark .ql-toolbar.ql-snow .ql-picker-item {
                    color: #d1d5db; /* text-gray-300 */
                }
                .ql-toolbar.ql-snow .ql-picker-label:hover,
                .ql-toolbar.ql-snow .ql-picker-item:hover,
                .ql-toolbar.ql-snow .ql-button:hover {
                    color: #2563eb; /* text-blue-600 */
                }
                .dark .ql-toolbar.ql-snow .ql-picker-label:hover,
                .dark .ql-toolbar.ql-snow .ql-picker-item:hover,
                .dark .ql-toolbar.ql-snow .ql-button:hover {
                    color: #60a5fa; /* text-blue-400 */
                }
            `}</style>
        </div>
    );
};

export default CustomReactQuill;