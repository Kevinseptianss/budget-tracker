"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  List,
  ListItem,
  ListItemText,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Popover,
} from "@mui/material";
import { SketchPicker } from "react-color";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Category as CategoryIcon,
  Restaurant as RestaurantIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalGasStation as GasStationIcon,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  LocalTaxi as TaxiIcon,
  LocalMovies as MoviesIcon,
  MedicalServices as MedicalIcon,
  School as SchoolIcon,
  Build as BuildIcon,
} from "@mui/icons-material";
import { Category, CategoryFormData } from "../../types/category";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";

// Helper function to determine if a color is light or dark
const isLightColor = (color: string): boolean => {
  if (!color) return true;
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
};

// Helper function to get icon component by name
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getIconComponent = (iconName: string): React.ComponentType<any> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    restaurant: RestaurantIcon,
    shopping: ShoppingCartIcon,
    gas: GasStationIcon,
    flight: FlightIcon,
    hotel: HotelIcon,
    taxi: TaxiIcon,
    movies: MoviesIcon,
    medical: MedicalIcon,
    school: SchoolIcon,
    build: BuildIcon,
    category: CategoryIcon,
  };

  return iconMap[iconName] || CategoryIcon;
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    color: "#1976d2",
    icon: "category",
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      showSnackbar("Error loading categories", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleColorPickerOpen = (event: React.MouseEvent<HTMLElement>) => {
    setColorPickerAnchor(event.currentTarget);
  };

  const handleColorPickerClose = () => {
    setColorPickerAnchor(null);
  };

  const handleColorChange = (color: { hex: string }) => {
    setFormData({ ...formData, color: color.hex });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#1976d2",
      icon: "category",
    });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        color: category.color || "#1976d2",
        icon: category.icon || "category",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showSnackbar("Please enter a category name", "error");
      return;
    }

    // Check for duplicate names (case insensitive)
    const existingCategory = categories.find(
      (cat) =>
        cat.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        cat.id !== editingCategory?.id
    );

    if (existingCategory) {
      showSnackbar("A category with this name already exists", "error");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        showSnackbar("Category updated successfully");
      } else {
        await addCategory(formData);
        showSnackbar("Category added successfully");
      }

      handleCloseDialog();
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      showSnackbar("Error saving category", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${name}" category? This action cannot be undone.`
      )
    ) {
      try {
        await deleteCategory(id);
        showSnackbar("Category deleted successfully");
        loadCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        showSnackbar("Error deleting category", "error");
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Link href="/" passHref>
          <IconButton color="primary" sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        </Link>
        <Typography variant="h4" component="h1">
          Manage Categories
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create, edit, and delete expense categories for better organization.
      </Typography>

      {/* Categories List */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <CategoryIcon />
            Your Categories ({categories.length})
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {categories.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No categories found. Add your first category!
            </Typography>
          ) : (
            <List>
              {categories.map((category) => {
                const IconComponent = getIconComponent(category.icon || "category");
                return (
                  <ListItem
                    key={category.id}
                    sx={{
                      px: 0,
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                    onClick={() => handleOpenDialog(category)}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              backgroundColor: category.color || "#1976d2",
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
                            {category.name}
                          </Typography>
                          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
                            <IconComponent sx={{ fontSize: 20, color: "text.secondary" }} />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add Category FAB */}
      <Fab
        color="primary"
        aria-label="add category"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Category Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingCategory ? "Edit Category" : "Add Category"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Category Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
              autoFocus
              placeholder="e.g., Food & Dining, Transportation"
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body1" sx={{ minWidth: "fit-content" }}>
                Color:
              </Typography>
              <Button
                variant="outlined"
                onClick={handleColorPickerOpen}
                sx={{
                  minWidth: 120,
                  height: 40,
                  backgroundColor: formData.color || "#1976d2",
                  border: "2px solid",
                  borderColor: "divider",
                  "&:hover": {
                    backgroundColor: formData.color || "#1976d2",
                    borderColor: "primary.main",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: isLightColor(formData.color || "#1976d2") ? "black" : "white",
                    fontFamily: "monospace",
                  }}
                >
                  {(formData.color || "#1976d2").toUpperCase()}
                </Typography>
              </Button>
            </Box>
            <TextField
              label="Icon Name"
              value={formData.icon}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              fullWidth
              placeholder="category"
              helperText="Material-UI icon name (optional)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {editingCategory && (
            <Button
              onClick={() => {
                handleDelete(editingCategory.id, editingCategory.name);
                handleCloseDialog();
              }}
              color="error"
              variant="outlined"
              sx={{ mr: "auto" }}
            >
              Delete
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCategory ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 1 }}>
          <SketchPicker
            color={formData.color || "#1976d2"}
            onChange={handleColorChange}
            disableAlpha={true}
          />
        </Box>
      </Popover>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}