import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
} from "@mui/material";
import { Medicine } from "../types/medicine";
import { format, addDays } from "date-fns";

interface OpenMedicineModalProps {
    isOpen: boolean;
    medicine: Medicine | null;
    onClose: () => void;
    onSave: (openedExpDate: Date) => Promise<void>;
}

export default function OpenMedicineModal({
    isOpen,
    medicine,
    onClose,
    onSave,
}: OpenMedicineModalProps) {
    const [dateStr, setDateStr] = useState("");

    useEffect(() => {
        if (medicine && isOpen) {
            // Suggest an expiration date 30 days from now for syrups
            const suggestedExp = addDays(new Date(), 30);
            setDateStr(format(suggestedExp, "yyyy-MM-dd"));
        }
    }, [medicine, isOpen]);

    const handleSubmit = async () => {
        await onSave(new Date(dateStr));
    };

    if (!medicine) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Open Medicine: {medicine.name}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Syrups and liquid medications usually expire 30-60 days after opening,
                        regardless of their original expiration date. Please consult the packaging.
                    </Typography>
                    <TextField
                        label="New Expiration Date"
                        type="date"
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}
                        fullWidth
                        required
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={onClose} sx={{ borderRadius: 14 }}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="warning" sx={{ borderRadius: 14 }}>
                    Mark as Opened
                </Button>
            </DialogActions>
        </Dialog>
    );
}
