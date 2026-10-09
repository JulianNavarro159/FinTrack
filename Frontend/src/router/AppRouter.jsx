import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth0 } from '@auth0/auth0-react';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { HistoryPage } from '../pages/HistoryPage';
import { AuthPage } from '../pages/AuthPage';
import { registerUserThunk } from '../store/authSlice';

export const AppRouter = () => {
    const dispatch = useDispatch();
    const { isAuthenticated, token } = useSelector((state) => state.auth);
    const { isAuthenticated: isAuth0Authenticated, user: auth0User, isLoading: isAuth0Loading } = useAuth0();

    useEffect(() => {
        if (isAuth0Authenticated && auth0User && !token) {
            dispatch(registerUserThunk({
                name: auth0User.name || auth0User.nickname || auth0User.email.split('@')[0],
                email: auth0User.email,
                profilephoto: auth0User.picture,
                emailVerified: auth0User.email_verified || false
            }));
        }
    }, [dispatch, isAuth0Authenticated, auth0User, token]);

    if (isAuth0Loading) {
        return (
            <div className="fullscreen-loading">
                <div className="spinner" />
                <p>Cargando FinTrack...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
        );
    }

    return (
        <MainLayout>
            {({ onOpenTransactionModal, onOpenCurrencyModal }) => (
                <Routes>
                    <Route
                        path="/"
                        element={
                            <DashboardPage
                                onOpenTransactionModal={onOpenTransactionModal}
                                onOpenCurrencyModal={onOpenCurrencyModal}
                            />
                        }
                    />
                    <Route
                        path="/history"
                        element={
                            <HistoryPage
                                onOpenTransactionModal={onOpenTransactionModal}
                            />
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}
        </MainLayout>
    );
};