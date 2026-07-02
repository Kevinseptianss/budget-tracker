import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
} from "@mui/material";
import { MedicineFormData, MedicineType, Medicine } from "../types/medicine";
import { format } from "date-fns";

interface AddMedicineModalProps {
    isOpen: boolean;
    medicine?: Medicine | null;
    onClose: () => void;
    onSave: (medicineData: MedicineFormData) => Promise<void>;
}

export default function AddMedicineModal({
    isOpen,
    medicine,
    onClose,
    onSave,
}: AddMedicineModalProps) {
    const [formData, setFormData] = useState<MedicineFormData>({
        name: "",
        quantity: 1,
        type: "tablet",
        originalExpDate: new Date(),
    });

    const [dateStr, setDateStr] = useState("");

    useEffect(() => {
        if (medicine && isOpen) {
            setFormData({
                name: medicine.name,
                quantity: medicine.quantity,
                type: medicine.type,
                originalExpDate: medicine.originalExpDate,
            });
            setDateStr(format(medicine.originalExpDate, "yyyy-MM-dd"));
        } else if (isOpen) {
            setFormData({
                name: "",
                quantity: 1,
                type: "tablet",
                originalExpDate: new Date(),
            });
            setDateStr(format(new Date(), "yyyy-MM-dd"));
        }
    }, [medicine, isOpen]);

    const handleSubmit = async () => {
        await onSave({
            ...formData,
            originalExpDate: new Date(dateStr),
        });
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{medicine ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        fullWidth
                        required
                    />
                    <FormControl fullWidth required>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as MedicineType })}
                            label="Type"
                        >
                            <MenuItem value="tablet">Tablet</MenuItem>
                            <MenuItem value="pill">Pill</MenuItem>
                            <MenuItem value="syrup">Syrup</MenuItem>
                            <MenuItem value="compounded_medication">Compounded Medication</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Original Expiration Date"
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
                <Button onClick={handleSubmit} variant="contained" disabled={!formData.name || formData.quantity <= 0} sx={{ borderRadius: 14 }}>
                    {medicine ? "Update" : "Add"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
