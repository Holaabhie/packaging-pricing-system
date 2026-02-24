from enum import Enum
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class MaterialType(str, Enum):
    PET = "PET"
    BOPP = "BOPP"
    MET_PET = "MET_PET"
    MET_BOPP = "MET_BOPP"
    LDPE = "LDPE"
    CPP = "CPP"
    AL_FOIL = "AL_FOIL"
    NYLON = "NYLON"
    PAPER = "PAPER"

class PouchType(str, Enum):
    CENTER_SEAL = "CENTER_SEAL"
    THREE_SIDE_SEAL = "THREE_SIDE_SEAL"
    STAND_UP_POUCH = "STAND_UP_POUCH"
    STAND_UP_ZIPPER = "STAND_UP_ZIPPER"
    SIDE_GUSSET = "SIDE_GUSSET"

class PrintingMethod(str, Enum):
    ROTOGRAVURE = "ROTOGRAVURE"
    FLEXO = "FLEXO"

class Layer(BaseModel):
    material: str  # Accepts both MaterialType enum values and custom material names
    thickness_micron: float = Field(..., gt=0, description="Thickness in microns")
    
    @property
    def density(self) -> float:
        # Standard densities (g/cm3)
        densities = {
            MaterialType.PET: 1.4,
            MaterialType.BOPP: 0.905,
            MaterialType.MET_PET: 1.4,
            MaterialType.MET_BOPP: 0.905,
            MaterialType.LDPE: 0.92,
            MaterialType.CPP: 0.90,
            MaterialType.AL_FOIL: 2.7,
            MaterialType.NYLON: 1.15,
            MaterialType.PAPER: 0.8 
        }
        return densities.get(self.material, 1.0)

class FilmStructure(BaseModel):
    layers: List[Layer]
    
    @property
    def total_thickness(self) -> float:
        return sum(l.thickness_micron for l in self.layers)

class ProductRequirements(BaseModel):
    pouch_type: PouchType
    width_mm: float = Field(..., gt=0)
    height_mm: float = Field(..., gt=0)
    gusset_mm: float = Field(0, ge=0)
    quantity_kg: Optional[float] = None
    quantity_pieces: Optional[int] = None
    film_structure: FilmStructure
    
    # New Fields for detailed costing
    number_of_colors: int = Field(0, ge=0, le=10)
    printing_method: PrintingMethod = PrintingMethod.ROTOGRAVURE
    cylinder_cost_per_unit: float = Field(3500, ge=0) # Avg cylinder cost
    margin_percent: float = Field(20.0, ge=0, le=100) # Profit margin percentage
    
    # Optional overrides (per-job) for operational rates (INR/kg)
    printing_cost_per_kg_override: Optional[float] = Field(None, ge=0)
    lamination_cost_per_kg_override: Optional[float] = Field(None, ge=0)

class CostBreakdown(BaseModel):
    total_gsm: float
    total_thickness: float
    weight_per_1000_pouches_kg: float
    
    # Cost Components
    material_cost_per_kg: float
    ink_cost_per_kg: float
    printing_cost_per_kg: float
    lamination_cost_per_kg: float
    pouching_cost_per_kg: float
    overhead_cost_per_kg: float
    cylinder_cost_total: float
    cylinder_cost_amortized_per_kg: float
    
    # Totals
    conversion_cost_per_kg: float
    total_cost_per_kg: float
    
    cost_per_1000_pouches: float
    selling_price_per_1000: float
    cost_per_pouch: float
    selling_price_per_pouch: float
    margin_percent: float
