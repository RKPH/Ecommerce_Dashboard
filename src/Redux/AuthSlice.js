import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance.js';
import { toast } from 'react-toastify';

// Async thunk for login
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.publicAxios.post('/admin/login', credentials);

            const { token, refreshToken, user } = response.data;

            // Store token and refresh token in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('isAuthenticated', 'true');

            return { user, token, refreshToken };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Something went wrong');
        }
    }
);

// Async thunk for registering a new user
export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userDetails, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.publicAxios.post('/auth/register', userDetails);
            const { token, refreshToken, user } = response.data;

            // Store token and refresh token in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);


            return { user, token, refreshToken };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Something went wrong');
        }
    }
);

export const verifyUser = createAsyncThunk(
    'auth/verifyUser',
    async ({ verificationCode }, { rejectWithValue }) => {
        try {
            // Send userId and verificationCode to the backend for verification
            const response = await axiosInstance.authAxios.post('/auth/verify', {  verificationCode });

            // Assuming you will return user data after successful verification
            const { user, message } = response.data;
            localStorage.setItem('isAuthenticated', 'true');
            return { user, message };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Verification failed');
        }
    }
);


// Async thunk for getting user profile
export const getUserProfile = createAsyncThunk(
    'auth/getUserProfile',
    async (_, { rejectWithValue }) => {  // ✅ Removed extra comma
        try {
            const response = await axiosInstance.authAxios.get('/auth/profile');
            const user = response.data.user;

            return { user };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Something went wrong');
        }
    }
);

// Async thunk for updating user profile
export const updateUserInfo = createAsyncThunk(
    'auth/updateUserInfo',
    async (userInfo, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.authAxios.put('/users/profile', userInfo);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Update failed');
        }
    }
);

// Async thunk for logging out
export const logoutUserApi = createAsyncThunk(
    'auth/logoutUserApi',
    async (_, {rejectWithValue }) => {
        try {
            await axiosInstance.publicAxios.post('/auth/logout');

            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('isAuthenticated');

        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Logout failed');
        }
    }
);

// Async thunk for refreshing the token
export const refreshToken = createAsyncThunk(
    'auth/refreshToken',
    async (_, { rejectWithValue }) => {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
            return rejectWithValue('No refresh token found');   
        }

        try {
            const response = await axiosInstance.refreshTokenAxios.post('/auth/refresh', { refreshToken: storedRefreshToken });
            const { token, refreshToken } = response.data;

            // Update tokens in local storage
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);

            return { token, refreshToken };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        sessionID: null,
        isLoading: false,
        isAuthenticated: !!localStorage.getItem('isAuthenticated'), // Persist authentication status
        error: null,
        verificationMessage: null,
    },
    reducers: {
        logoutUser: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('isAuthenticated');
        },
        updateCart: (state, action) => {
            if (state.user) {
                state.user.Cart= action.payload;
            }
        },
        deleteCart: (state, action) => {
            if (state.user) {
                state.user.Cart= state.user.Cart - 1;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(verifyUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.verificationMessage = null;
            })
            .addCase(verifyUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated =true
                state.user = action.payload.user;
                state.verificationMessage = action.payload.message; // Store success message

            })
            .addCase(verifyUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                toast.error('Verification failed');
            })
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                window.location.href = '/admin/dashboard';
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;

                state.user = action.payload.user;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(getUserProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
            })
            .addCase(getUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.error = action.payload;
                toast.error('Session expired, please log in again.');
                localStorage.removeItem('isAuthenticated');
            })
                .addCase(logoutUserApi.fulfilled, (state) => {
                    state.isAuthenticated = false;
                    state.user = null;
                })
            .addCase(logoutUserApi.rejected, (state, action) => {
                state.isAuthenticated = false;
                state.user = null;
                state.error = action.payload;
            })
            .addCase(refreshToken.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
            })
            .addCase(refreshToken.rejected, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = false;
                state.error = action.payload;
            })
            .addCase(updateUserInfo.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateUserInfo.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
            })
            .addCase(updateUserInfo.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Failed to update user information');
            });
    },
});

export const { deleteCart } = authSlice.actions;



export default authSlice.reducer;
