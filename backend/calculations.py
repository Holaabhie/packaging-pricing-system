from models import ProductRequirements, PouchType, MaterialType, CostBreakdown, Layer
from database import db

class CostCalculator:
    # Admin configurable rates
    @property
    def MATERIAL_RATES_INR_PER_KG(self):
        return db.get_rates()
    
    ADHESIVE_GSM = 2.5 # Dry lamination gsm per layer interface
    ADHESIVE_RATE = 250 # INR/kg
    
    # Ink assumptions
    INK_GSM_PER_COLOR = 0.5 # Average per color
    INK_RATE = 300 # INR/kg
    WHITE_INK_GSM = 1.5 # If used, usually covers full area
    
    # Operational Costs
    PRINTING_COST_PER_KG_BASE = 15 # Base cost
    PRINTING_COST_PER_KG_PER_COLOR = 2 # Additional cost per color
    
    LAMINATION_COST_PER_KG_BASE = 12
    LAMINATION_COST_PER_LAYER = 5 # Cost adds up for multi-pass
    
    POUCHING_COST_PER_KG = 20
    SLITTING_COST_PER_KG = 5
    OVERHEADS_PER_KG = 12
    
    @staticmethod
    def calculate_pouch_open_size(req: ProductRequirements) -> dict:
        """
        Calculate the open web width and cut length based on pouch type.
        Returns {'open_width_mm': float, 'cut_length_mm': float}
        """
        width = req.width_mm
        height = req.height_mm
        gusset = req.gusset_mm
        
        # Standard Allowances (can be made configurable)
        CENTER_SEAL_OVERLAP = 20 # mm
        SEAL_WIDTH = 10 # mm for side/top/bottom
        
        if req.pouch_type == PouchType.CENTER_SEAL:
            # Back seam bag
            # Width is flat width. Open width = 2*Width + Gusset + Overlap
            # Actually Center Seal with Gusset: The gusset is tucked in.
            # Open Width = (Face Width * 2) + (Gusset Width * 2) + Overlap
            # Simplified for Center Seal (Pillow): 2 * Width + Overlap
            # With Gusset: 2 * Width + 2 * Gusset + Overlap
            open_width = (2 * width) + (2 * gusset) + CENTER_SEAL_OVERLAP
            cut_length = height + (2 * SEAL_WIDTH) # Top and bottom seal allowance
            
        elif req.pouch_type == PouchType.THREE_SIDE_SEAL:
            # Usually made from one web folded or two webs. Assuming one web folded.
            # Open Width = 2 * Width
            open_width = 2 * width
            cut_length = height + (2 * SEAL_WIDTH)
            
        elif req.pouch_type == PouchType.STAND_UP_POUCH:
            # Complex. Usually Bottom Gusset is separate or folded.
            # Doypack style.
            # Approx: (2 * Width) + (Bottom Gusset Open) + Seals
            open_width = (2 * width) + (gusset * 2) + 60 # Heuristic allowance for bottom fold
            cut_length = height + 20
        else:
            # Default fallback
            open_width = 2 * width
            cut_length = height
            
        return {"open_width_mm": open_width, "cut_length_mm": cut_length}

    @classmethod
    def calculate_cost(cls, req: ProductRequirements, margin_percent: float = 20.0) -> CostBreakdown:
        # 1. Calculate Physical Dimensions
        dims = cls.calculate_pouch_open_size(req)
        open_width_mm = dims['open_width_mm']
        cut_length_mm = dims['cut_length_mm']
        
        area_per_pouch_sqm = (open_width_mm * cut_length_mm) / 1_000_000
        
        # 2. Calculate Film Structure GSM and Cost
        total_film_gsm = 0
        total_material_cost_per_sqm = 0
        
        layers = req.film_structure.layers
        num_layers = len(layers)
        
        # Get dynamic rates
        rates = db.get_rates()

        for i, layer in enumerate(layers):
            # GSM = Thickness * Density
            layer_gsm = layer.thickness_micron * layer.density
            total_film_gsm += layer_gsm
            
            # Material Cost
            rate = rates.get(layer.material, 100)
            # Cost per sqm = (GSM / 1000) * Rate
            layer_cost_sqm = (layer_gsm / 1000) * rate
            total_material_cost_per_sqm += layer_cost_sqm
            
            # Add Adhesive if not last layer
            if i < num_layers - 1:
                total_film_gsm += cls.ADHESIVE_GSM
                total_material_cost_per_sqm += (cls.ADHESIVE_GSM / 1000) * cls.ADHESIVE_RATE
        
        # Add Ink Cost based on colors
        # Assumption: 1 White + (N-1) Colors or just N colors.
        # Simple Logic: N * GSM_PER_COLOR
        # If N > 0
        ink_gsm = 0
        ink_cost_per_sqm = 0
        if req.number_of_colors > 0:
            ink_gsm = req.number_of_colors * cls.INK_GSM_PER_COLOR
            # Add base white if likely needed (e.g., printing on PET/BOPP reverse)
            # For simplicity, let's assume one color is always White or heavy coverage if N >= 1
            if req.number_of_colors >= 1:
                 ink_gsm += 1.0 # Extra for white base
            
            total_film_gsm += ink_gsm
            ink_cost_per_sqm = (ink_gsm / 1000) * cls.INK_RATE
            total_material_cost_per_sqm += ink_cost_per_sqm
        
        # 3. Calculate Weights
        # Weight of 1 pouch in grams
        weight_per_pouch_g = area_per_pouch_sqm * total_film_gsm
        weight_per_1000_pouches_kg = (weight_per_pouch_g * 1000) / 1000
        
        # 4. Total Raw Material Cost per kg
        if total_film_gsm > 0:
            raw_material_cost_per_kg = total_material_cost_per_sqm / (total_film_gsm / 1000)
            ink_cost_per_kg = ink_cost_per_sqm / (total_film_gsm / 1000)
        else:
            raw_material_cost_per_kg = 0
            ink_cost_per_kg = 0
            
        # 5. Conversion & Operational Costs
        # Printing Cost: allow explicit override, else Base + Cost per color
        if getattr(req, "printing_cost_per_kg_override", None) is not None:
            printing_cost = req.printing_cost_per_kg_override or 0
        else:
            printing_cost = cls.PRINTING_COST_PER_KG_BASE + (req.number_of_colors * cls.PRINTING_COST_PER_KG_PER_COLOR)
        
        # Lamination Cost: allow explicit override, else Base + (Layers - 1) * Cost per pass
        lamination_passes = max(0, num_layers - 1)
        if getattr(req, "lamination_cost_per_kg_override", None) is not None:
            lamination_cost = req.lamination_cost_per_kg_override or 0
        else:
            lamination_cost = cls.LAMINATION_COST_PER_KG_BASE + (lamination_passes * cls.LAMINATION_COST_PER_LAYER)
        
        # Total Conversion
        conversion_cost = (
            printing_cost +
            lamination_cost +
            cls.POUCHING_COST_PER_KG +
            cls.SLITTING_COST_PER_KG +
            cls.OVERHEADS_PER_KG
        )
        
        # 6. Cylinder / Plate Costs
        # Amortize over quantity if provided, else return total
        cylinder_cost_total = req.number_of_colors * req.cylinder_cost_per_unit
        
        cylinder_cost_amortized_per_kg = 0
        if req.quantity_kg and req.quantity_kg > 0:
            cylinder_cost_amortized_per_kg = cylinder_cost_total / req.quantity_kg
        elif req.quantity_pieces and req.quantity_pieces > 0:
            total_job_weight_kg = (req.quantity_pieces * weight_per_pouch_g) / 1000
            if total_job_weight_kg > 0:
                cylinder_cost_amortized_per_kg = cylinder_cost_total / total_job_weight_kg
        
        # 7. Final Costs
        total_cost_per_kg = raw_material_cost_per_kg + conversion_cost + cylinder_cost_amortized_per_kg
        
        cost_per_1000_pouches = total_cost_per_kg * weight_per_1000_pouches_kg
        
        # 8. Pricing
        selling_price = cost_per_1000_pouches * (1 + (margin_percent / 100))
        
        # Per-pouch economics (useful for targets like ₹0.80/pouch)
        cost_per_pouch = cost_per_1000_pouches / 1000 if cost_per_1000_pouches else 0
        selling_price_per_pouch = selling_price / 1000 if selling_price else 0
        
        return CostBreakdown(
            total_gsm=round(total_film_gsm, 2),
            total_thickness=req.film_structure.total_thickness,
            weight_per_1000_pouches_kg=round(weight_per_1000_pouches_kg, 2),
            
            material_cost_per_kg=round(raw_material_cost_per_kg - ink_cost_per_kg, 2), # Subtract ink to show pure film cost
            ink_cost_per_kg=round(ink_cost_per_kg, 2),
            printing_cost_per_kg=round(printing_cost, 2),
            lamination_cost_per_kg=round(lamination_cost, 2),
            pouching_cost_per_kg=round(cls.POUCHING_COST_PER_KG, 2),
            overhead_cost_per_kg=round(cls.OVERHEADS_PER_KG + cls.SLITTING_COST_PER_KG, 2),
            
            cylinder_cost_total=round(cylinder_cost_total, 2),
            cylinder_cost_amortized_per_kg=round(cylinder_cost_amortized_per_kg, 2),
            
            conversion_cost_per_kg=round(conversion_cost, 2),
            total_cost_per_kg=round(total_cost_per_kg, 2),
            
            cost_per_1000_pouches=round(cost_per_1000_pouches, 2),
            selling_price_per_1000=round(selling_price, 2),
            cost_per_pouch=round(cost_per_pouch, 4),
            selling_price_per_pouch=round(selling_price_per_pouch, 4),
            margin_percent=margin_percent
        )
