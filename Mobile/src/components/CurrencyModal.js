import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { CURRENCIES } from '../utils/currencies';
import { theme } from '../theme';

export const CurrencyModal = ({ visible, onClose, currentCurrency = 'USD', onSelectCurrency }) => {
    const [selected, setSelected] = useState(currentCurrency);
    const [isSaving, setIsSaving] = useState(false);

    const handleConfirm = async () => {
        try {
            setIsSaving(true);
            await onSelectCurrency(selected);
            onClose();
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo actualizar la moneda');
        } finally {
            setIsSaving(false);
        }
    };

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
                        <Text style={styles.title}>Selecciona tu Moneda</Text>
                        <Text style={styles.subtitle}>
                            Elige la divisa que usarás en FinTrack
                        </Text>
                    </View>

                    <FlatList
                        data={CURRENCIES}
                        keyExtractor={(item) => item.code}
                        renderItem={({ item }) => {
                            const isChosen = selected === item.code;
                            return (
                                <TouchableOpacity
                                    style={[styles.itemCard, isChosen && styles.itemCardSelected]}
                                    onPress={() => setSelected(item.code)}
                                >
                                    <View style={styles.symbolBox}>
                                        <Text style={styles.symbolText}>{item.symbol}</Text>
                                    </View>
                                    <View style={styles.infoBox}>
                                        <Text style={styles.codeText}>{item.code}</Text>
                                        <Text style={styles.nameText}>{item.name}</Text>
                                    </View>
                                    {isChosen && <Text style={styles.checkText}>✓</Text>}
                                </TouchableOpacity>
                            );
                        }}
                    />

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={isSaving}>
                            <Text style={styles.btnCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnSave} onPress={handleConfirm} disabled={isSaving}>
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.btnSaveText}>Guardar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
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
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%'
    },
    header: {
        marginBottom: 16
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text
    },
    subtitle: {
        fontSize: 13,
        color: theme.colors.textMuted,
        marginTop: 4
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 8,
        backgroundColor: theme.colors.card
    },
    itemCardSelected: {
        borderColor: theme.colors.emerald,
        backgroundColor: theme.colors.emeraldLight
    },
    symbolBox: {
        width: 36,
        height: 36,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    symbolText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text
    },
    infoBox: {
        flex: 1
    },
    codeText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text
    },
    nameText: {
        fontSize: 12,
        color: theme.colors.textMuted
    },
    checkText: {
        color: theme.colors.emerald,
        fontSize: 18,
        fontWeight: '800'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border
    },
    btnCancel: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.bg
    },
    btnCancelText: {
        color: theme.colors.textMuted,
        fontWeight: '600'
    },
    btnSave: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.primary
    },
    btnSaveText: {
        color: '#FFFFFF',
        fontWeight: '700'
    }
});
