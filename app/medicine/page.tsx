"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Container,
    Typography,
    Card,
    CardContent,
    Fab,
    Box,
    List,
    ListItem,
    Chip,
    Button,
    Alert,
    Snackbar,
    CircularProgress,
    Divider,
    IconButton,
} from "@mui/material";
import {
    Add as AddIcon,
    Medication as MedicineIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    LockOpen as OpenIcon,
} from "@mui/icons-material";
import { format, isBefore, addDays } from "date-fns";
import { Medicine, MedicineFormData } from "../../types/medicine";
import {
    getMedicines,
    addMedicine,
    updateMedicine,
    markMedicineAsOpened,
    deleteMedicine,
} from "../../services/medicineService";
import AddMedicineModal from "../../components/AddMedicineModal";
import OpenMedicineModal from "../../components/OpenMedicineModal";

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    Expired: { bg: "rgba(255,59,48,0.1)", border: "rgba(255,59,48,0.25)", text: "#c42b4a" },
    "Expiring Soon": { bg: "rgba(255,159,10,0.1)", border: "rgba(255,159,10,0.25)", text: "#b86a00" },
    Valid: { bg: "rgba(52,199,89,0.1)", border: "rgba(52,199,89,0.25)", text: "#1d8a3a" },
};

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    tablet: { bg: "rgba(10,132,255,0.1)", border: "rgba(10,132,255,0.25)", text: "#0a6ddb" },
    pill: { bg: "rgba(90,200,250,0.1)", border: "rgba(90,200,250,0.25)", text: "#0a6ddb" },
    syrup: { bg: "rgba(255,159,10,0.1)", border: "rgba(255,159,10,0.25)", text: "#b86a00" },
    compounded_medication: { bg: "rgba(191,90,242,0.1)", border: "rgba(191,90,242,0.25)", text: "#8e3db8" },
};

export default function MedicineTracker() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [openModalOpen, setOpenModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
    const [openingMedicine, setOpeningMedicine] = useState<Medicine | null>(null);

    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: "success" | "error";
    }>({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const medicinesData = await getMedicines();
            setMedicines(medicinesData);
        } catch (error) {
            console.error("Error loading medicines:", error);
            showSnackbar("Error loading medicines", "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSaveMedicine = async (medicineData: MedicineFormData) => {
        try {
            if (editingMedicine && editingMedicine.id) {
                await updateMedicine(editingMedicine.id, medicineData);
                showSnackbar("Medicine updated successfully");
            } else {
                await addMedicine(medicineData);
                showSnackbar("Medicine added successfully");
            }
            setAddModalOpen(false);
            setEditingMedicine(null);
            await loadData();
        } catch (error) {
            showSnackbar("Failed to save medicine", "error");
        }
    };

    const handleOpenMedicine = async (openedExpDate: Date) => {
        try {
            if (openingMedicine && openingMedicine.id) {
                await markMedicineAsOpened(openingMedicine.id, openedExpDate);
                showSnackbar("Medicine marked as opened");
            }
            setOpenModalOpen(false);
            setOpeningMedicine(null);
            await loadData();
        } catch (error) {
            showSnackbar("Failed to open medicine", "error");
        }
    };

    const handleDeleteMedicine = async (id: string | undefined) => {
        if (!id) return;
        try {
            if (confirm("Are you sure you want to delete this medicine?")) {
                await deleteMedicine(id);
                showSnackbar("Medicine deleted successfully");
                await loadData();
            }
        } catch (error) {
            showSnackbar("Failed to delete medicine", "error");
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "tablet": return "Tablet";
            case "pill": return "Pill";
            case "syrup": return "Syrup";
            case "compounded_medication": return "Compounded";
            default: return type;
        }
    };

    const getExpirationStatus = (medicine: Medicine) => {
        const today = new Date();
        const expDate = medicine.isOpened && medicine.openedExpDate
            ? medicine.openedExpDate
            : medicine.originalExpDate;

        if (isBefore(expDate, today)) {
            return { label: "Expired" };
        }

        const thirtyDaysFromNow = addDays(today, 30);
        if (isBefore(expDate, thirtyDaysFromNow)) {
            return { label: "Expiring Soon" };
        }

        return { label: "Valid" };
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress size={48} />
            </Box>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ pb: 14, pt: 3, position: "relative", zIndex: 1 }}>
            <Box className={mounted ? "lg-anim-fade-up" : ""} sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
                    <MedicineIcon sx={{ color: "var(--accent)" }} />
                    Medicine
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--text-secondary)", mt: 0.5 }}>
                    Track your medicine inventory and expirations
                </Typography>
            </Box>

            <Card className={`lg-glass-card ${mounted ? "lg-anim-fade-up lg-stagger-1" : ""}`} sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <MedicineIcon sx={{ color: "var(--accent)", fontSize: 22 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Inventory
                        </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    {medicines.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 5 }}>
                            <MedicineIcon sx={{ fontSize: 48, color: "var(--text-secondary)", opacity: 0.4, mb: 1 }} />
                            <Typography variant="body2" sx={{ color: "var(--text-secondary)" }}>
                                No medicines yet. Tap + to add one.
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ py: 0 }}>
                            {medicines.map((medicine, index) => {
                                const expStatus = getExpirationStatus(medicine);
                                const isActiveExpDate = medicine.isOpened && medicine.openedExpDate;
                                const statusStyle = statusColors[expStatus.label] || statusColors.Valid;
                                const typeStyle = typeColors[medicine.type] || typeColors.tablet;

                                return (
                                    <ListItem
                                        key={medicine.id}
                                        className={mounted ? `lg-anim-fade-up lg-stagger-${Math.min(index + 2, 6)}` : ""}
                                        sx={{
                                            px: 1.5,
                                            flexDirection: "column",
                                            alignItems: "stretch",
                                            borderRadius: 3,
                                            mb: 1.25,
                                            py: 1.5,
                                            background: "rgba(255,255,255,0.4)",
                                            transition: "all 0.25s ease",
                                            "&:hover": { background: "rgba(255,255,255,0.65)" },
                                        }}
                                    >
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                                    {medicine.name}
                                                    <Chip
                                                        size="small"
                                                        label={`Qty: ${medicine.quantity}`}
                                                        sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, background: "rgba(0,0,0,0.05)" }}
                                                    />
                                                </Typography>
                                                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                                                    <Chip
                                                        size="small"
                                                        label={getTypeLabel(medicine.type)}
                                                        sx={{ background: typeStyle.bg, border: `1px solid ${typeStyle.border}`, color: typeStyle.text, height: 22, fontSize: "0.68rem", fontWeight: 600 }}
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={expStatus.label}
                                                        sx={{ background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.text, height: 22, fontSize: "0.68rem", fontWeight: 600 }}
                                                    />
                                                    {medicine.isOpened && (
                                                        <Chip
                                                            size="small"
                                                            label="Opened"
                                                            sx={{ background: "rgba(255,159,10,0.1)", border: "1px solid rgba(255,159,10,0.25)", color: "#b86a00", height: 22, fontSize: "0.68rem", fontWeight: 600 }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                            <Box sx={{ display: "flex", flexShrink: 0 }}>
                                                <IconButton
                                                    size="small"
                                                    sx={{ mr: 0.5 }}
                                                    onClick={() => {
                                                        setEditingMedicine(medicine);
                                                        setAddModalOpen(true);
                                                    }}
                                                >
                                                    <EditIcon sx={{ fontSize: 18, color: "var(--accent)" }} />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteMedicine(medicine.id)}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 18, color: "#ff3b30" }} />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                background: "rgba(0,0,0,0.03)",
                                                p: 1.25,
                                                borderRadius: 2,
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="caption" sx={{ display: "block", color: isActiveExpDate ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: 600 }}>
                                                    Original Exp: {format(medicine.originalExpDate, "dd MMM yyyy")}
                                                </Typography>
                                                {medicine.isOpened && medicine.openedExpDate && (
                                                    <Typography variant="caption" sx={{ display: "block", color: "#c42b4a", fontWeight: 700 }}>
                                                        Opened Exp: {format(medicine.openedExpDate, "dd MMM yyyy")}
                                                    </Typography>
                                                )}
                                            </Box>

                                            {!medicine.isOpened && medicine.type === "syrup" && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<OpenIcon />}
                                                    onClick={() => {
                                                        setOpeningMedicine(medicine);
                                                        setOpenModalOpen(true);
                                                    }}
                                                    sx={{
                                                        borderRadius: 12,
                                                        textTransform: "none",
                                                        borderColor: "rgba(255,159,10,0.25)",
                                                        color: "#b86a00",
                                                        "&:hover": {
                                                            borderColor: "rgba(255,159,10,0.4)",
                                                            background: "rgba(255,159,10,0.05)",
                                                        },
                                                    }}
                                                >
                                                    Open
                                                </Button>
                                            )}
                                        </Box>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </CardContent>
            </Card>

            <Fab
                color="primary"
                aria-label="add"
                className={mounted ? "lg-anim-scale-in" : ""}
                sx={{ position: "fixed", bottom: 84, right: 20, zIndex: 999 }}
                onClick={() => {
                    setEditingMedicine(null);
                    setAddModalOpen(true);
                }}
            >
                <AddIcon />
            </Fab>

            <AddMedicineModal
                isOpen={addModalOpen}
                medicine={editingMedicine}
                onClose={() => setAddModalOpen(false)}
                onSave={handleSaveMedicine}
            />
            <OpenMedicineModal
                isOpen={openModalOpen}
                medicine={openingMedicine}
                onClose={() => setOpenModalOpen(false)}
                onSave={handleOpenMedicine}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
