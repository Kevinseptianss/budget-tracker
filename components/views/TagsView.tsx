"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Card,
  CardContent,
  Box,
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
  Divider,
  Popover,
} from "@mui/material";
import { SketchPicker } from "react-color";
import {
  Add as AddIcon,
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

const isLightColor = (color: string): boolean => {
  if (!color) return true;
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
};

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

export default function TagsView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [colorPickerAnchor, setColorPickerAnchor] = useState<HTMLElement | null>(
    null
  );
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    color: "#0a84ff",
    icon: "category",
  });

  const showSnackbar = useCallback(
    (message: string, severity: "success" | "error" = "success") => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories:", error);
      showSnackbar("Error loading categories", "error");
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
    setFormData({ name: "", color: "#0a84ff", icon: "category" });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        color: category.color || "#0a84ff",
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

  return (
    <Box sx={{ maxWidth: 700, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#1c1c1e",
          }}
        >
          <CategoryIcon sx={{ color: "#0a84ff" }} />
          Categories
        </Typography>
        <Typography variant="body2" sx={{ color: "#8e8e93", mt: 0.5 }}>
          Create, edit, and delete expense categories.
        </Typography>
      </Box>

      <Card className="lg-glass-card" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CategoryIcon sx={{ color: "#0a84ff", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1c1c1e" }}>
              Your Categories ({categories.length})
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {categories.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <CategoryIcon
                sx={{ fontSize: 48, color: "#8e8e93", opacity: 0.4, mb: 1 }}
              />
              <Typography variant="body2" sx={{ color: "#8e8e93" }}>
                No categories found. Tap + to add one.
              </Typography>
            </Box>
          ) : (
            <List>
              {categories.map((category, index) => {
                const IconComponent = getIconComponent(
                  category.icon || "category"
                );
                return (
                  <ListItem
                    key={category.id}
                    className={`lg-anim-fade-up lg-stagger-${Math.min(index + 1, 6)}`}
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      mb: 0.75,
                      borderRadius: 3,
                      cursor: "pointer",
                      background: "rgba(255,255,255,0.4)",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        background: "rgba(255,255,255,0.7)",
                        transform: "translateX(2px)",
                      },
                    }}
                    onClick={() => handleOpenDialog(category)}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 3,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: `${category.color || "#0a84ff"}18`,
                              flexShrink: 0,
                            }}
                          >
                            <IconComponent
                              sx={{
                                fontSize: 20,
                                color: category.color || "#0a84ff",
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600, flex: 1, color: "#1c1c1e" }}
                          >
                            {category.name}
                          </Typography>
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              backgroundColor: category.color || "#0a84ff",
                            }}
                          />
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

      <Fab
        color="primary"
        aria-label="add category"
        className="lg-anim-scale-in"
        sx={{ position: "fixed", bottom: 84, right: 20, zIndex: 999 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

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
          <Box
            sx={{
              pt: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
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
              <Typography
                variant="body2"
                sx={{ minWidth: "fit-content", color: "#8e8e93" }}
              >
                Color:
              </Typography>
              <Button
                variant="outlined"
                onClick={handleColorPickerOpen}
                sx={{
                  minWidth: 120,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: formData.color || "#0a84ff",
                  borderColor: "rgba(0,0,0,0.1)",
                  "&:hover": {
                    backgroundColor: formData.color || "#0a84ff",
                    borderColor: "rgba(0,0,0,0.2)",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: isLightColor(formData.color || "#0a84ff")
                      ? "black"
                      : "white",
                    fontFamily: "monospace",
                    fontWeight: 700,
                  }}
                >
                  {(formData.color || "#0a84ff").toUpperCase()}
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
        <DialogActions sx={{ p: 2.5 }}>
          {editingCategory && (
            <Button
              onClick={() => {
                handleDelete(editingCategory.id, editingCategory.name);
                handleCloseDialog();
              }}
              color="error"
              variant="outlined"
              sx={{ mr: "auto", borderRadius: 14 }}
            >
              Delete
            </Button>
          )}
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 14 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ borderRadius: 14 }}
          >
            {editingCategory ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 1 }}>
          <SketchPicker
            color={formData.color || "#0a84ff"}
            onChange={handleColorChange}
            disableAlpha={true}
          />
        </Box>
      </Popover>

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
    </Box>
  );
}
