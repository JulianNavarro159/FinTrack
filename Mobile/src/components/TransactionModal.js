import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { getCurrencySymbol, PAYMENT_METHODS } from '../utils/currencies';
import { theme } from '../theme';

export const TransactionModal = ({
    visible,
    onClose,
    initialType = 'expense',
    currency = 'USD',
    categories = [],
    onSubmit
}) => {
    const [type, setType] = useState(initialType);
    const [amount, setAmount] = useState('');
    const [idCategory, setIdCategory] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            setType(initialType);
            setAmount('');
            setDescription('');
            setPaymentMethod('cash');
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [visible, initialType]);

    const availableCategories = categories.filter((c) => c.type === type);

    useEffect(() => {
        if (availableCategories.length > 0) {
            setIdCategory(availableCategories[0].id);
        } else {
            setIdCategory(null);
        }
    }, [type, categories]);

    const handleSave = async () => {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Atención', 'Ingresa un monto válido mayor a cero');
            return;
        }

        if (!idCategory) {
            Alert.alert('Atención', 'Selecciona una categoría');
            return;
        }

        try {
            setIsSubmitting(true);
            await onSubmit({
                type,
                amount: parsedAmount,
                idCategory,
                paymentMethod,
                description: description.trim(),
                date
            });
            onClose();
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo guardar la transacción');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isIncome = type === 'income';
    const symbol = getCurrencySymbol(currency);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {isIncome ? 'Registrar Ingreso' : 'Registrar Gasto'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, isIncome && styles.toggleIncomeActive]}
                                onPress={() => setType('income')}
                            >
                                <Text style={[styles.toggleText, isIncome && styles.toggleTextActive]}>
                                    + Ingreso
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.toggleBtn, !isIncome && styles.toggleExpenseActive]}
                                onPress={() => setType('expense')}
                            >
                                <Text style={[styles.toggleText, !isIncome && styles.toggleTextActive]}>
                                    - Gasto
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Monto ({currency})</Text>
                        <View style={styles.amountInputWrap}>
                            <Text style={styles.currencySymbol}>{symbol}</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                placeholderTextColor={theme.colors.textSubtle}
                            />
                        </View>

                        <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
                        <TextInput
                            style={styles.textInput}
                            value={date}
                            onChangeText={setDate}
                            placeholder="YYYY-MM-DD"
                        />

                        <Text style={styles.label}>Categoría</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                            {availableCategories.map((c) => {
                                const selected = idCategory === c.id;
                                return (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.categoryChip, selected && styles.chipActive]}
                                        onPress={() => setIdCategory(c.id)}
                                    >
                                        <Text style={[styles.categoryChipText, selected && styles.chipActiveText]}>
                                            {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <Text style={styles.label}>
                            {isIncome ? 'Forma de recepción' : 'Método de pago'}
                        </Text>
                        <View style={styles.paymentGrid}>
                            {PAYMENT_METHODS.map((m) => {
                                const selected = paymentMethod === m.id;
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[styles.paymentChip, selected && styles.paymentChipActive]}
                                        onPress={() => setPaymentMethod(m.id)}
                                    >
                                        <Text style={[styles.paymentChipText, selected && styles.paymentChipActiveText]}>
                                            {isIncome ? m.incomeLabel : m.expenseLabel}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.label}>Descripción (opcional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ej. Salario, compras del supermercado..."
                            value={description}
                            onChangeText={setDescription}
                            placeholderTextColor={theme.colors.textSubtle}
                        />

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={isSubmitting}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btnSubmit, isIncome ? styles.btnIncome : styles.btnExpense]}
                                onPress={handleSave}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.btnSubmitText}>
                                        {isIncome ? 'Guardar Ingreso' : 'Guardar Gasto'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end'
    },
    card: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text
    },
    closeBtn: {
        padding: 4
    },
    closeBtnText: {
        fontSize: 18,
        color: theme.colors.textMuted
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: theme.colors.bg,
        padding: 4,
        borderRadius: theme.radii.md,
        marginBottom: 16
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: theme.radii.sm
    },
    toggleIncomeActive: {
        backgroundColor: theme.colors.card,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    toggleExpenseActive: {
        backgroundColor: theme.colors.card,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    toggleText: {
        fontWeight: '600',
        color: theme.colors.textMuted
    },
    toggleTextActive: {
        color: theme.colors.text,
        fontWeight: '700'
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted,
        marginBottom: 6,
        marginTop: 10
    },
    amountInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.bg,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.textMuted,
        marginRight: 6
    },
    amountInput: {
        flex: 1,
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text
    },
    textInput: {
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text
    },
    horizontalChips: {
        flexDirection: 'row',
        marginBottom: 4
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: theme.radii.full,
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginRight: 8
    },
    chipActive: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary
    },
    categoryChipText: {
        fontSize: 13,
        color: theme.colors.textMuted,
        fontWeight: '500'
    },
    chipActiveText: {
        color: theme.colors.primary,
        fontWeight: '700'
    },
    paymentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    paymentChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    paymentChipActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryLight
    },
    paymentChipText: {
        fontSize: 12,
        color: theme.colors.text
    },
    paymentChipActiveText: {
        color: theme.colors.primary,
        fontWeight: '700'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 20,
        marginBottom: 10
    },
    btnCancel: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.bg
    },
    btnCancelText: {
        color: theme.colors.textMuted,
        fontWeight: '600'
    },
    btnSubmit: {
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: theme.radii.sm
    },
    btnIncome: {
        backgroundColor: theme.colors.emerald
    },
    btnExpense: {
        backgroundColor: theme.colors.rose
    },
    btnSubmitText: {
        color: '#FFFFFF',
        fontWeight: '700'
    }
});
