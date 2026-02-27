from fastapi import FastAPI, HTTPException, Body, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from models import ProductRequirements, CostBreakdown
from calculations import CostCalculator
from database import db
from ai_service import analyze_image_colors
from typing import Dict, List, Optional
from pydantic import BaseModel

app = FastAPI(title="Packaging Job Analyzer", version="2.0.0")

# Models for API
class QuotationCreate(BaseModel):
    client_name: str
    requirements: ProductRequirements
    breakdown: CostBreakdown

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Packaging Job Analyzer API v2.0 is running"}

@app.post("/api/calculate-cost", response_model=CostBreakdown)
def calculate_cost(requirements: ProductRequirements):
    try:
        result = CostCalculator.calculate_cost(requirements, margin_percent=requirements.margin_percent)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/rates")
def get_rates():
    return db.get_rates()

@app.post("/api/rates")
def update_rates(rates: Dict[str, float]):
    return db.update_rates(rates)

@app.get("/api/config")
def get_config():
    return db.get_config()

@app.post("/api/config")
def update_config(config: Dict[str, float]):
    return db.update_config(config)

@app.get("/api/quotations")
def get_quotations():
    return db.get_quotations()

@app.post("/api/quotations")
def save_quotation(quotation: QuotationCreate):
    req_dict = quotation.requirements.model_dump()
    breakdown_dict = quotation.breakdown.model_dump()
    return db.save_quotation(req_dict, breakdown_dict, quotation.client_name)

@app.delete("/api/quotations/{quotation_id}")
def delete_quotation(quotation_id: int):
    success = db.delete_quotation(quotation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return {"message": "Quotation deleted", "id": quotation_id}

@app.get("/api/quotations/search")
def search_quotations(q: str = Query("", description="Search query")):
    return db.search_quotations(q)

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    return db.get_stats()

@app.get("/api/presets")
def get_presets():
    return [
        {
            "id": "snacks",
            "name": "Snacks & Chips",
            "description": "Namkeen, chips, kurkure — nitrogen-flushed MET barrier pouches",
            "icon": "🍿",
            "config": {
                "pouch_type": "CENTER_SEAL",
                "width_mm": 160,
                "height_mm": 240,
                "gusset_mm": 50,
                "number_of_colors": 8,
                "printing_method": "ROTOGRAVURE",
                "cylinder_cost_per_unit": 5000,
                "quantity_pieces": 200000,
                "margin_percent": 20,
                "film_structure": {
                    "layers": [
                        {"material": "BOPP", "thickness_micron": 20},
                        {"material": "MET_BOPP", "thickness_micron": 20},
                        {"material": "LDPE", "thickness_micron": 50}
                    ]
                }
            }
        },
        {
            "id": "pharma",
            "name": "Pharma & Healthcare",
            "description": "Tablets, sachets, ORS — high-barrier AL foil laminates",
            "icon": "💊",
            "config": {
                "pouch_type": "THREE_SIDE_SEAL",
                "width_mm": 80,
                "height_mm": 120,
                "gusset_mm": 0,
                "number_of_colors": 4,
                "printing_method": "ROTOGRAVURE",
                "cylinder_cost_per_unit": 4500,
                "quantity_pieces": 500000,
                "margin_percent": 30,
                "film_structure": {
                    "layers": [
                        {"material": "PET", "thickness_micron": 12},
                        {"material": "AL_FOIL", "thickness_micron": 9},
                        {"material": "LDPE", "thickness_micron": 37.5}
                    ]
                }
            }
        },
        {
            "id": "sweets",
            "name": "Sweets & Mithai",
            "description": "Laddu, barfi, bakery — premium printed trays & pillow packs",
            "icon": "🍬",
            "config": {
                "pouch_type": "CENTER_SEAL",
                "width_mm": 200,
                "height_mm": 150,
                "gusset_mm": 0,
                "number_of_colors": 7,
                "printing_method": "ROTOGRAVURE",
                "cylinder_cost_per_unit": 5500,
                "quantity_pieces": 100000,
                "margin_percent": 25,
                "film_structure": {
                    "layers": [
                        {"material": "BOPP", "thickness_micron": 20},
                        {"material": "MET_BOPP", "thickness_micron": 20},
                        {"material": "CPP", "thickness_micron": 30}
                    ]
                }
            }
        },
        {
            "id": "mop_detergent",
            "name": "MOP & Detergents",
            "description": "Surf, shampoo sachets, phenyl — heavy-duty liquid-resistant pouches",
            "icon": "🧴",
            "config": {
                "pouch_type": "THREE_SIDE_SEAL",
                "width_mm": 120,
                "height_mm": 175,
                "gusset_mm": 0,
                "number_of_colors": 5,
                "printing_method": "ROTOGRAVURE",
                "cylinder_cost_per_unit": 4000,
                "quantity_pieces": 300000,
                "margin_percent": 18,
                "film_structure": {
                    "layers": [
                        {"material": "PET", "thickness_micron": 12},
                        {"material": "NYLON", "thickness_micron": 15},
                        {"material": "LDPE", "thickness_micron": 80}
                    ]
                }
            }
        },
        {
            "id": "dairy",
            "name": "Dairy & Beverages",
            "description": "Milk, lassi, juice — liquid-fill stand-up & pillow pouches",
            "icon": "🥛",
            "config": {
                "pouch_type": "STAND_UP_POUCH",
                "width_mm": 140,
                "height_mm": 220,
                "gusset_mm": 60,
                "number_of_colors": 6,
                "printing_method": "ROTOGRAVURE",
                "cylinder_cost_per_unit": 5000,
                "quantity_pieces": 200000,
                "margin_percent": 22,
                "film_structure": {
                    "layers": [
                        {"material": "PET", "thickness_micron": 12},
                        {"material": "AL_FOIL", "thickness_micron": 7},
                        {"material": "LDPE", "thickness_micron": 75}
                    ]
                }
            }
        },
        {
            "id": "agro",
            "name": "Agro & Fertilizers",
            "description": "Seeds, fertilizers, pesticides — heavy-gauge multi-layer sacks",
            "icon": "🌾",
            "config": {
                "pouch_type": "STAND_UP_POUCH",
                "width_mm": 250,
                "height_mm": 350,
                "gusset_mm": 80,
                "number_of_colors": 3,
                "printing_method": "FLEXO",
                "cylinder_cost_per_unit": 3000,
                "quantity_pieces": 50000,
                "margin_percent": 15,
                "film_structure": {
                    "layers": [
                        {"material": "BOPP", "thickness_micron": 25},
                        {"material": "LDPE", "thickness_micron": 100}
                    ]
                }
            }
        }
    ]

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = analyze_image_colors(contents)
        if "error" in result:
             raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
