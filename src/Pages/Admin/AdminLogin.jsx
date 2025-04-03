import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../Redux/AuthSlice.js";
import { toast } from "react-toastify";
import ImageLight from '../../assets/img/login-office.jpeg';
import ImageDark from '../../assets/img/login-office-dark.jpeg';
import { Label, Input, Button } from '@windmill/react-ui';

function AdminLogin() {
    useEffect(() => {
        if (localStorage.getItem("theme") === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useDispatch();
    const { isLoading } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(loginUser({ email, password })).unwrap();
            toast.success("Login successfully");
        } catch (error) {
            toast.error(error || "Login failed. Please try again.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="flex w-full max-w-4xl overflow-hidden bg-white rounded-2xl shadow-lg dark:bg-gray-800">
                {/* Left side image */}
                <div className="hidden md:block md:w-1/2">
                    <img
                        aria-hidden="true"
                        className="object-cover w-full h-full rounded-l-2xl dark:hidden"
                        src={ImageLight}
                        alt="Office"
                    />
                    <img
                        aria-hidden="true"
                        className="hidden object-cover w-full h-full rounded-l-2xl dark:block"
                        src={ImageDark}
                        alt="Office"
                    />
                </div>

                {/* Right side form */}
                <div className="flex items-center justify-center p-8 w-full md:w-1/2">
                    <div className="w-full max-w-md">
                        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 text-center">
                            Admin Login
                        </h1>

                        <form onSubmit={handleSubmit} className="mt-6">
                            <Label className="block">
                                <span className="text-gray-700 dark:text-gray-300">Email</span>
                                <Input
                                    className="mt-2 block w-full p-2 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                    type="email"
                                    placeholder="john@doe.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </Label>

                            <Label className="block mt-4">
                                <span className="text-gray-700 dark:text-gray-300">Password</span>
                                <Input
                                    className="mt-2 block p-2 w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                    type="password"
                                    placeholder="***************"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </Label>

                            {/* Submit Button */}
                            <div className="mt-6">
                                <Button
                                    type="submit"
                                    className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Logginggg in..." : "Log in"}
                                </Button>
                            </div>
                        </form>

                        <hr className="my-8 border-gray-300 dark:border-gray-600" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
