import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const fetchMonthlySummaryThunk = createAsyncThunk(
    'finance/fetchMonthlySummary',
    async (month, { rejectWithValue }) => {
        try {
            return await api.getMonthlySummary(month);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchCategoriesThunk = createAsyncThunk(
    'finance/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            return await api.getCategories();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchTransactionsThunk = createAsyncThunk(
    'finance/fetchTransactions',
    async (filters, { rejectWithValue }) => {
        try {
            return await api.getTransactions(filters);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const createTransactionThunk = createAsyncThunk(
    'finance/createTransaction',
    async (transactionData, { dispatch, getState, rejectWithValue }) => {
        try {
            const result = await api.createTransaction(transactionData);
            const { selectedMonth, filters } = getState().finance;
            dispatch(fetchMonthlySummaryThunk(selectedMonth));
            dispatch(fetchTransactionsThunk({ ...filters, month: selectedMonth }));
            return result.transaction;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteTransactionThunk = createAsyncThunk(
    'finance/deleteTransaction',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            await api.deleteTransaction(id);
            const { selectedMonth, filters } = getState().finance;
            dispatch(fetchMonthlySummaryThunk(selectedMonth));
            dispatch(fetchTransactionsThunk({ ...filters, month: selectedMonth }));
            return id;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const financeSlice = createSlice({
    name: 'finance',
    initialState: {
        selectedMonth: getCurrentMonth(),
        summary: {
            month: getCurrentMonth(),
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            transactionCount: 0,
            categoryBreakdown: { expense: [], income: [] },
            recentTransactions: []
        },
        transactions: [],
        filteredSummary: {
            totalIncome: 0,
            totalExpense: 0,
            netBalance: 0
        },
        pagination: {
            total: 0,
            page: 1,
            totalPages: 1
        },
        categories: [],
        filters: {
            type: '',
            idCategory: '',
            paymentMethod: '',
            description: '',
            month: getCurrentMonth()
        },
        isLoadingSummary: false,
        isLoadingTransactions: false,
        isSubmitting: false,
        error: null
    },
    reducers: {
        setSelectedMonth: (state, action) => {
            state.selectedMonth = action.payload;
            state.filters.month = action.payload;
        },
        setFilter: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters: (state) => {
            state.filters = {
                type: '',
                idCategory: '',
                paymentMethod: '',
                description: '',
                month: state.selectedMonth
            };
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMonthlySummaryThunk.pending, (state) => {
                state.isLoadingSummary = true;
            })
            .addCase(fetchMonthlySummaryThunk.fulfilled, (state, action) => {
                state.isLoadingSummary = false;
                state.summary = action.payload;
            })
            .addCase(fetchMonthlySummaryThunk.rejected, (state, action) => {
                state.isLoadingSummary = false;
                state.error = action.payload;
            })
            .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
                state.categories = action.payload;
            })
            .addCase(fetchTransactionsThunk.pending, (state) => {
                state.isLoadingTransactions = true;
            })
            .addCase(fetchTransactionsThunk.fulfilled, (state, action) => {
                state.isLoadingTransactions = false;
                state.transactions = action.payload.transactions || [];
                state.pagination = {
                    total: action.payload.total || 0,
                    page: action.payload.page || 1,
                    totalPages: action.payload.totalPages || 1
                };
                if (action.payload.summary) {
                    state.filteredSummary = action.payload.summary;
                }
            })
            .addCase(fetchTransactionsThunk.rejected, (state, action) => {
                state.isLoadingTransactions = false;
                state.error = action.payload;
            })
            .addCase(createTransactionThunk.pending, (state) => {
                state.isSubmitting = true;
            })
            .addCase(createTransactionThunk.fulfilled, (state) => {
                state.isSubmitting = false;
            })
            .addCase(createTransactionThunk.rejected, (state, action) => {
                state.isSubmitting = false;
                state.error = action.payload;
            });
    }
});

export const { setSelectedMonth, setFilter, resetFilters } = financeSlice.actions;
export default financeSlice.reducer;
