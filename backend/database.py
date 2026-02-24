import os
from typing import Dict, List, Any
from pymongo import MongoClient
import certifi
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        # Default to local MongoDB if MONGODB_URI is not set in environment
        mongo_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
        
        # Use certifi for secure TLS connection to MongoDB Atlas
        tls_ca_file = certifi.where() if "mongodb+srv" in mongo_uri else None
        
        self.client = MongoClient(mongo_uri, tlsCAFile=tls_ca_file)
        self.db = self.client.nexus_packaging
        
        # Initialize default rates if empty
        if self.db.rates.count_documents({}) == 0:
            default_rates = {
                "PET": 110,
                "BOPP": 130,
                "MET_PET": 120,
                "MET_BOPP": 140,
                "LDPE": 105,
                "CPP": 115,
                "AL_FOIL": 400,
                "NYLON": 250,
                "PAPER": 80,
            }
            self.db.rates.insert_one({"_id": "current", "rates": default_rates})

    def get_rates(self) -> Dict[str, float]:
        doc = self.db.rates.find_one({"_id": "current"})
        return doc.get("rates", {}) if doc else {}

    def update_rates(self, rates: Dict[str, float]):
        current_rates = self.get_rates()
        current_rates.update(rates)
        self.db.rates.update_one({"_id": "current"}, {"$set": {"rates": current_rates}}, upsert=True)
        return current_rates

    def save_quotation(self, requirements: dict, breakdown: dict, client_name: str = "Unknown"):
        # Generate ID based on current max
        last_quote = self.db.quotations.find_one(sort=[("id", -1)])
        max_id = last_quote["id"] if last_quote and "id" in last_quote else 0
        
        new_quote = {
            "id": max_id + 1,
            "date": datetime.now().isoformat(),
            "client_name": client_name,
            "requirements": requirements,
            "breakdown": breakdown
        }
        
        self.db.quotations.insert_one(new_quote)
        new_quote.pop("_id", None)  # Remove MongoDB ObjectId before returning
        
        return new_quote

    def get_quotations(self):
        # Fetch all quotations and omit _id
        return [q for q in self.db.quotations.find({}, {"_id": 0})]

    def delete_quotation(self, quotation_id: int) -> bool:
        result = self.db.quotations.delete_one({"id": quotation_id})
        return result.deleted_count > 0

    def search_quotations(self, query: str) -> List[dict]:
        quotations = self.get_quotations()
        if not query:
            return quotations
        query_lower = query.lower()
        return [
            q for q in quotations
            if query_lower in q.get("client_name", "").lower()
            or query_lower in q.get("requirements", {}).get("pouch_type", "").lower()
        ]

    def get_stats(self) -> dict:
        quotations = self.get_quotations()
        total = len(quotations)
        
        if total == 0:
            return {
                "total_quotations": 0,
                "avg_margin": 0,
                "total_revenue": 0,
                "avg_cost_per_kg": 0,
                "popular_pouch_type": "N/A",
                "popular_material": "N/A",
                "material_usage": {},
                "pouch_type_usage": {},
                "recent_quotations": [],
                "cost_distribution": {
                    "material": 0, "ink": 0, "printing": 0,
                    "lamination": 0, "pouching": 0, "overhead": 0, "cylinder": 0
                }
            }
        
        margins = []
        revenues = []
        costs_per_kg = []
        material_counts: Dict[str, int] = {}
        pouch_counts: Dict[str, int] = {}
        
        cost_components = {
            "material": 0.0, "ink": 0.0, "printing": 0.0,
            "lamination": 0.0, "pouching": 0.0, "overhead": 0.0, "cylinder": 0.0
        }
        
        for q in quotations:
            bd = q.get("breakdown", {})
            req = q.get("requirements", {})
            
            margins.append(bd.get("margin_percent", 0))
            revenues.append(bd.get("selling_price_per_1000", 0))
            costs_per_kg.append(bd.get("total_cost_per_kg", 0))
            
            # Pouch type tracking
            pt = req.get("pouch_type", "UNKNOWN")
            pouch_counts[pt] = pouch_counts.get(pt, 0) + 1
            
            # Material tracking
            layers = req.get("film_structure", {}).get("layers", [])
            for layer in layers:
                mat = layer.get("material", "UNKNOWN")
                material_counts[mat] = material_counts.get(mat, 0) + 1
            
            # Cost component accumulation
            cost_components["material"] += bd.get("material_cost_per_kg", 0)
            cost_components["ink"] += bd.get("ink_cost_per_kg", 0)
            cost_components["printing"] += bd.get("printing_cost_per_kg", 0)
            cost_components["lamination"] += bd.get("lamination_cost_per_kg", 0)
            cost_components["pouching"] += bd.get("pouching_cost_per_kg", 0)
            cost_components["overhead"] += bd.get("overhead_cost_per_kg", 0)
            cost_components["cylinder"] += bd.get("cylinder_cost_amortized_per_kg", 0)
        
        # Average cost components
        avg_cost_dist = {k: round(v / total, 2) for k, v in cost_components.items()}
        
        popular_pouch = max(pouch_counts, key=pouch_counts.get) if pouch_counts else "N/A"
        popular_material = max(material_counts, key=material_counts.get) if material_counts else "N/A"
        
        # Recent quotations (last 5)
        recent = sorted(quotations, key=lambda x: x.get("date", ""), reverse=True)[:5]
        
        return {
            "total_quotations": total,
            "avg_margin": round(sum(margins) / total, 1),
            "total_revenue": round(sum(revenues), 2),
            "avg_cost_per_kg": round(sum(costs_per_kg) / total, 2),
            "popular_pouch_type": popular_pouch.replace("_", " "),
            "popular_material": popular_material,
            "material_usage": material_counts,
            "pouch_type_usage": pouch_counts,
            "recent_quotations": recent,
            "cost_distribution": avg_cost_dist
        }

db = Database()
