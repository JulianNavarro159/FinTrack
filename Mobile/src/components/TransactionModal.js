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
import { Ionicons } from '@expo/vector-icons';
import { getCurrencySymbol, PAYMENT_METHODS } from '../utils/currencies';
import { theme } from '../theme';

const getAmountPresets = (curr) => {
    if (['COP', 'CLP', 'ARS', 'PYG'].includes(curr)) {
        return [
            { label: '+10K', value: 10000 },
            { label: '+20K', value: 20000 },
            { label: '+50K', value: 50000 },
            { label: '+100K', value: 100000 }
        ];
    }
    return [
        { label: '+10', value: 10 },
        { label: '+25', value: 25 },
        { label: '+50', value: 50 },
        { label: '+100', value: 100 }
    ];
};

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
};

const getMethodIcon = (methodId) => {
    switch (methodId) {
        case 'cash':
            return 'cash-outline';
        case 'credit_card':
            return 'card-outline';
        case 'debit_card':
            return 'wallet-outline';
        case 'transfer':
            return 'swap-horizontal-outline';
        default:
            return 'card-outline';
    }
};

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
    const [date, setDate] = useState(getTodayStr());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            setType(initialType);
            setAmount('');
            setDescription('');
            setPaymentMethod('cash');
            setDate(getTodayStr());
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

    const handleAddPreset = (val) => {
        const currentVal = parseFloat(amount) || 0;
        setAmount(String(currentVal + val));
    };

    const handleSave = async () => {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Alert.alert('Atencion', 'Ingresa un monto valido mayor a cero');
            return;
        }

        if (!idCategory) {
            Alert.alert('Atencion', 'Selecciona una categoria');
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
            Alert.alert('Error', error.message || 'No se pudo guardar la transaccion');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isIncome = type === 'income';
    const symbol = getCurrencySymbol(currency);
    const presets = getAmountPresets(currency);
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

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
                        <View style={styles.headerTitleWrap}>
                            <Ionicons
                                name={isIncome ? 'arrow-down-circle' : 'arrow-up-circle'}
                                size={22}
                                color={isIncome ? theme.colors.emerald : theme.colors.rose}
                            />
                            <Text style={styles.title}>
                                {isIncome ? 'Registrar Ingreso' : 'Registrar Gasto'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, isIncome && styles.toggleIncomeActive]}
                                onPress={() => setType('income')}
                            >
                                <Ionicons
                                    name="arrow-down-circle-outline"
                                    size={16}
                                    color={isIncome ? theme.colors.emerald : theme.colors.textMuted}
                                />
                                <Text style={[styles.toggleText, isIncome && styles.toggleTextActiveIncome]}>
                                    Ingreso
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.toggleBtn, !isIncome && styles.toggleExpenseActive]}
                                onPress={() => setType('expense')}
                            >
                                <Ionicons
                                    name="arrow-up-circle-outline"
                                    size={16}
                                    color={!isIncome ? theme.colors.rose : theme.colors.textMuted}
                                />
                                <Text style={[styles.toggleText, !isIncome && styles.toggleTextActiveExpense]}>
                                    Gasto
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Monto ({currency})</Text>
                        <View style={styles.amountInputWrap}>
                            <Text style={styles.currencySymbol}>{symbol}</Text>
                            <TextInput
                                style={styles.amountInput}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                value={amount}
                                onChangeText={setAmount}
                                placeholderTextColor={theme.colors.textSubtle}
                            />
                            {amount.length > 0 && (
                                <TouchableOpacity onPress={() => setAmount('')} style={styles.clearBtn}>
                                    <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.presetRow}>
                            {presets.map((p) => (
                                <TouchableOpacity
                                    key={p.label}
                                    style={styles.presetChip}
                                    onPress={() => handleAddPreset(p.value)}
                                >
                                    <Text style={styles.presetText}>{p.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Fecha</Text>
                        <View style={styles.dateSelectorRow}>
                            <TouchableOpacity
                                style={[styles.dateShortcut, date === today && styles.dateShortcutActive]}
                                onPress={() => setDate(today)}
                            >
                                <Text style={[styles.dateShortcutText, date === today && styles.dateShortcutTextActive]}>
                                    Hoy
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dateShortcut, date === yesterday && styles.dateShortcutActive]}
                                onPress={() => setDate(yesterday)}
                            >
                                <Text style={[styles.dateShortcutText, date === yesterday && styles.dateShortcutTextActive]}>
                                    Ayer
                                </Text>
                            </TouchableOpacity>
                            <TextInput
                                style={styles.dateInput}
                                value={date}
                                onChangeText={setDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={theme.colors.textSubtle}
                            />
                        </View>

                        <Text style={styles.label}>Categoria</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                            {availableCategories.map((c) => {
                                const selected = idCategory === c.id;
                                return (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.categoryChip, selected && (isIncome ? styles.chipIncomeActive : styles.chipExpenseActive)]}
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
                            {isIncome ? 'Forma de recepcion' : 'Metodo de pago'}
                        </Text>
                        <View style={styles.paymentGrid}>
                            {PAYMENT_METHODS.map((m) => {
                                const selected = paymentMethod === m.id;
                                const iconName = getMethodIcon(m.id);
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[styles.paymentChip, selected && styles.paymentChipActive]}
                                        onPress={() => setPaymentMethod(m.id)}
                                    >
                                        <Ionicons
                                            name={iconName}
                                            size={15}
                                            color={selected ? theme.colors.primary : theme.colors.textMuted}
                                        />
                                        <Text style={[styles.paymentChipText, selected && styles.paymentChipActiveText]}>
                                            {isIncome ? m.incomeLabel : m.expenseLabel}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.label}>Descripcion (opcional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ej. Mercado, transporte, almuerzo..."
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
    headerTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text
    },
    closeBtn: {
        padding: 6
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: theme.colors.bg,
        padding: 4,
        borderRadius: theme.radii.md,
        marginBottom: 14,
        gap: 6
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: theme.radii.sm,
        gap: 6
    },
    toggleIncomeActive: {
        backgroundColor: theme.colors.card,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4
    },
    toggleExpenseActive: {
        backgroundColor: theme.colors.card,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted
    },
    toggleTextActiveIncome: {
        color: theme.colors.emerald,
        fontWeight: '700'
    },
    toggleTextActiveExpense: {
        color: theme.colors.rose,
        fontWeight: '700'
    },
    label: {
        fontSize: 12,
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
        paddingHorizontal: 14,
        paddingVertical: 8
    },
    currencySymbol: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.primary,
        marginRight: 6
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text
    },
    clearBtn: {
        padding: 4
    },
    presetRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8
    },
    presetChip: {
        flex: 1,
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        paddingVertical: 6,
        alignItems: 'center',
        justifyContent: 'center'
    },
    presetText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textMuted
    },
    dateSelectorRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center'
    },
    dateShortcut: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm
    },
    dateShortcutActive: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary
    },
    dateShortcutText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textMuted
    },
    dateShortcutTextActive: {
        color: theme.colors.primary,
        fontWeight: '700'
    },
    dateInput: {
        flex: 1,
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 13,
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
    chipIncomeActive: {
        backgroundColor: theme.colors.emeraldLight,
        borderColor: theme.colors.emerald
    },
    chipExpenseActive: {
        backgroundColor: theme.colors.roseLight,
        borderColor: theme.colors.rose
    },
    categoryChipText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '600'
    },
    chipActiveText: {
        color: theme.colors.text,
        fontWeight: '700'
    },
    paymentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4
    },
    paymentChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    paymentChipActive: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary
    },
    paymentChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textMuted
    },
    paymentChipActiveText: {
        color: theme.colors.primary,
        fontWeight: '700'
    },
    textInput: {
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: theme.colors.text
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
        borderRadius: theme.radii.sm,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnIncome: {
        backgroundColor: theme.colors.emerald
    },
    btnExpense: {
        backgroundColor: theme.colors.rose
    },
    btnSubmitText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14
    }
});
