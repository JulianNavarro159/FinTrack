import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavBar } from './navbar/NavBar';
import { Footer } from './footer/Footer';
import { CurrencyModal } from '../components/CurrencyModal';
import { TransactionModal } from '../components/TransactionModal';
import { ProfileModal } from '../components/ProfileModal';
import { StorageBackupModal } from '../components/StorageBackupModal';
import { fetchCategoriesThunk, fetchMonthlySummaryThunk, fetchTransactionsThunk } from '../store/financeSlice';
import { fetchProfileThunk } from '../store/authSlice';

export const MainLayout = ({ children }) => {
    const dispatch = useDispatch();
    const token = useSelector((state) => state.auth.token);
    const selectedMonth = useSelector((state) => state.finance.selectedMonth);

    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
    const [transactionModalType, setTransactionModalType] = useState('expense');

    useEffect(() => {
        if (token) {
            dispatch(fetchProfileThunk());
            dispatch(fetchCategoriesThunk());
        }
    }, [dispatch, token]);

    const handleOpenTransactionModal = (type = 'expense') => {
        setTransactionModalType(type);
        setIsTransactionModalOpen(true);
    };

    const handleDataRestored = () => {
        dispatch(fetchProfileThunk());
        dispatch(fetchCategoriesThunk());
        dispatch(fetchMonthlySummaryThunk(selectedMonth));
        dispatch(fetchTransactionsThunk({ month: selectedMonth }));
    };

    return (
        <div className="app-shell">
            <NavBar
                onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
                onOpenTransactionModal={handleOpenTransactionModal}
                onOpenProfileModal={() => setIsProfileModalOpen(true)}
                onOpenStorageModal={() => setIsStorageModalOpen(true)}
            />

            <main className="main-content-area">
                {typeof children === 'function'
                    ? children({
                        onOpenTransactionModal: handleOpenTransactionModal,
                        onOpenCurrencyModal: () => setIsCurrencyModalOpen(true),
                        onOpenProfileModal: () => setIsProfileModalOpen(true),
                        onOpenStorageModal: () => setIsStorageModalOpen(true)
                    })
                    : React.cloneElement(children, {
                        onOpenTransactionModal: handleOpenTransactionModal,
                        onOpenCurrencyModal: () => setIsCurrencyModalOpen(true),
                        onOpenProfileModal: () => setIsProfileModalOpen(true),
                        onOpenStorageModal: () => setIsStorageModalOpen(true)
                    })}
            </main>

            <Footer />

            <CurrencyModal
                isOpen={isCurrencyModalOpen}
                onClose={() => setIsCurrencyModalOpen(false)}
            />

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />

            <TransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                initialType={transactionModalType}
            />

            <StorageBackupModal
                isOpen={isStorageModalOpen}
                onClose={() => setIsStorageModalOpen(false)}
                onDataRestored={handleDataRestored}
            />
        </div>
    );
};