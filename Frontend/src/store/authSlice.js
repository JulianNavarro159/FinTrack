import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export const loginUserThunk = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const data = await api.login(email, password);
            api.setToken(data.token);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const registerUserThunk = createAsyncThunk(
    'auth/registerUser',
    async (userData, { rejectWithValue }) => {
        try {
            const data = await api.registerUser(userData);
            api.setToken(data.token);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchProfileThunk = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            return await api.getProfile();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateCurrencyThunk = createAsyncThunk(
    'auth/updateCurrency',
    async (currency, { rejectWithValue }) => {
        try {
            await api.updateCurrency(currency);
            return currency;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateProfileThunk = createAsyncThunk(
    'auth/updateProfile',
    async (profileData, { rejectWithValue }) => {
        try {
            const data = await api.updateProfile(profileData);
            if (data.token) {
                api.setToken(data.token);
            }
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialToken = api.getToken();

export const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: initialToken,
        isAuthenticated: !!initialToken,
        isLoading: false,
        error: null
    },
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            api.setToken(null);
        },
        setAuthUser: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            if (action.payload.token) {
                api.setToken(action.payload.token);
            }
        },
        clearAuthError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUserThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUserThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(loginUserThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(registerUserThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUserThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(registerUserThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(fetchProfileThunk.fulfilled, (state, action) => {
                state.user = action.payload;
            })
            .addCase(updateCurrencyThunk.fulfilled, (state, action) => {
                if (state.user) {
                    state.user.currency = action.payload;
                }
            })
            .addCase(updateProfileThunk.fulfilled, (state, action) => {
                if (action.payload?.user) {
                    state.user = { ...state.user, ...action.payload.user };
                }
                if (action.payload?.token) {
                    state.token = action.payload.token;
                }
            });
    }
});

export const { logout, setAuthUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
