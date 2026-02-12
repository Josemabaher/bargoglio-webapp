import json
import os

raw_data = [
  { "id": "Z1-5-3", "tableId": "Z1-5", "tableNumber": 8, "status": "available", "x": 35.23, "y": 40.83, "label": "Area Azul", "price": 5000 },
  { "id": "Z1-5-4", "tableId": "Z1-5", "tableNumber": 6, "status": "available", "x": 22.9, "y": 28.02, "label": "Area Azul", "price": 5000 },
  { "id": "Z1-6-1", "tableId": "Z1-6", "tableNumber": 4, "status": "available", "x": 11.72, "y": 27.89, "label": "Area Roja", "price": 5000 },
  { "id": "Z1-6-2", "tableId": "Z1-6", "tableNumber": 7, "status": "available", "x": 29.11, "y": 34.74, "label": "Area Azul", "price": 5000 },
  { "id": "Z1-6-3", "tableId": "Z1-6", "tableNumber": 8, "status": "available", "x": 29.11, "y": 40.95, "label": "Area Azul", "price": 5000 },
  { "id": "Z1-7-1", "tableId": "Z1-7", "tableNumber": 6, "status": "available", "x": 22.9, "y": 36.9, "label": "Area Azul", "price": 5000 },
  { "id": "Z1-7-2", "tableId": "Z1-7", "tableNumber": 1, "status": "available", "x": 19.44, "y": 48.69, "label": "Area Roja", "price": 5000 },
  { "id": "Z2-1-1", "tableId": "Z2-1", "tableNumber": 1, "status": "available", "x": 15, "y": 42.22, "label": "Area Roja", "price": 4000 },
  { "id": "Z2-1-2", "tableId": "Z2-1", "tableNumber": 1, "status": "available", "x": 14.91, "y": 48.81, "label": "Area Roja", "price": 4000 },
  { "id": "Z2-2-1", "tableId": "Z2-2", "tableNumber": 19, "status": "available", "x": 45.53, "y": 72.78, "label": "Area Roja", "price": 4000 },
  { "id": "Z2-2-2", "tableId": "Z2-2", "tableNumber": 20, "status": "available", "x": 39.49, "y": 79.12, "label": "Area Roja", "price": 4000 },
  { "id": "Z2-3-1", "tableId": "Z2-3", "tableNumber": 23, "status": "available", "x": 52.01, "y": 35.37, "label": "Area Azul", "price": 4000 },
  { "id": "Z2-3-2", "tableId": "Z2-3", "tableNumber": 23, "status": "available", "x": 52.1, "y": 44.5, "label": "Area Azul", "price": 4000 },
  { "id": "Z2-4-1", "tableId": "Z2-4", "tableNumber": 16, "status": "available", "x": 45.62, "y": 40.7, "label": "Area Azul", "price": 4000 },
  { "id": "Z2-4-2", "tableId": "Z2-4", "tableNumber": 18, "status": "available", "x": 45.62, "y": 53.25, "label": "Area Azul", "price": 4000 },
  { "id": "Z2-5-1", "tableId": "Z2-5", "tableNumber": 20, "status": "available", "x": 45.62, "y": 79.12, "label": "Area Roja", "price": 4000 },
  { "id": "Z2-5-2", "tableId": "Z2-5", "tableNumber": 14, "status": "available", "x": 29.02, "y": 85.2, "label": "Area Amarilla", "price": 4000 },
  { "id": "Z2-6-1", "tableId": "Z2-6", "tableNumber": 22, "status": "available", "x": 45.62, "y": 91.54, "label": "Area Amarilla", "price": 4000 },
  { "id": "Z2-6-2", "tableId": "Z2-6", "tableNumber": 16, "status": "available", "x": 39.41, "y": 40.83, "label": "Area Azul", "price": 4000 },
  { "id": "Z2-6-3", "tableId": "Z2-6", "tableNumber": 18, "status": "available", "x": 39.49, "y": 53.38, "label": "Area Azul", "price": 4000 },
  { "id": "Z2-7-1", "tableId": "Z2-7", "tableNumber": 13, "status": "available", "x": 35.32, "y": 79.12, "label": "Area Roja", "price": 4000 },
  { "id": "Z2-7-2", "tableId": "Z2-7", "tableNumber": 13, "status": "available", "x": 29.02, "y": 78.99, "label": "Area Roja", "price": 4000 },
  { "id": "Z2-7-3", "tableId": "Z2-7", "tableNumber": 12, "status": "available", "x": 35.23, "y": 72.9, "label": "Area Roja", "price": 4000 },
  { "id": "Z2-7-4", "tableId": "Z2-7", "tableNumber": 12, "status": "available", "x": 29.11, "y": 72.78, "label": "Area Roja", "price": 4000 },
  { "id": "Z2-8-1", "tableId": "Z2-8", "tableNumber": 17, "status": "available", "x": 45.53, "y": 47.04, "label": "Area Azul", "price": 4000 },
  { "id": "Z2-8-2", "tableId": "Z2-8", "tableNumber": 17, "status": "available", "x": 39.41, "y": 46.91, "label": "Area Azul", "price": 4000 },
  { "id": "Z2-8-3", "tableId": "Z2-8", "tableNumber": 15, "status": "available", "x": 39.41, "y": 34.61, "label": "Area Azul", "price": 4000 },
  { "id": "Z2-9-1", "tableId": "Z2-9", "tableNumber": 21, "status": "available", "x": 39.49, "y": 85.2, "label": "Area Amarilla", "price": 4000 },
  { "id": "Z2-9-2", "tableId": "Z2-9", "tableNumber": 21, "status": "available", "x": 45.53, "y": 85.33, "label": "Area Amarilla", "price": 4000 },
  { "id": "Z2-9-3", "tableId": "Z2-9", "tableNumber": 15, "status": "available", "x": 45.62, "y": 34.49, "label": "Area Azul", "price": 4000 },
  { "id": "Z3-1-1", "tableId": "Z3-1", "tableNumber": 25, "status": "available", "x": 69.31, "y": 42.09, "label": "Area Roja", "price": 3000 },
  { "id": "Z3-1-2", "tableId": "Z3-1", "tableNumber": 25, "status": "available", "x": 69.31, "y": 50.84, "label": "Area Roja", "price": 3000 },
  { "id": "Z3-2-1", "tableId": "Z3-2", "tableNumber": 27, "status": "available", "x": 60.97, "y": 29.03, "label": "Area Azul", "price": 3000 },
  { "id": "Z3-2-2", "tableId": "Z3-2", "tableNumber": 29, "status": "available", "x": 71.89, "y": 20.03, "label": "Area Roja", "price": 3000 },
  { "id": "Z3-3-1", "tableId": "Z3-3", "tableNumber": 27, "status": "available", "x": 60.88, "y": 19.91, "label": "Area Azul", "price": 3000 },
  { "id": "Z3-3-2", "tableId": "Z3-3", "tableNumber": 29, "status": "available", "x": 72.24, "y": 29.54, "label": "Area Roja", "price": 3000 },
  { "id": "Z3-4-1", "tableId": "Z3-4", "tableNumber": 24, "status": "available", "x": 60.17, "y": 44.5, "label": "Area Roja", "price": 3000 },
  { "id": "Z3-4-2", "tableId": "Z3-4", "tableNumber": 24, "status": "available", "x": 60, "y": 35.5, "label": "Area Roja", "price": 3000 },
  { "id": "Z3-5-1", "tableId": "Z3-5", "tableNumber": 33, "status": "available", "x": 75.35, "y": 9.51, "label": "Area Amarilla", "price": 3000 },
  { "id": "Z3-5-2", "tableId": "Z3-5", "tableNumber": 31, "status": "available", "x": 82.98, "y": 20.03, "label": "Area Amarilla", "price": 3000 },
  { "id": "Z3-5-3", "tableId": "Z3-5", "tableNumber": 30, "status": "available", "x": 77.57, "y": 29.16, "label": "Area Amarilla", "price": 3000 },
  { "id": "Z3-5-4", "tableId": "Z3-5", "tableNumber": 30, "status": "available", "x": 77.48, "y": 20.03, "label": "Area Amarilla", "price": 3000 },
  { "id": "Z3-6-1", "tableId": "Z3-6", "tableNumber": 28, "status": "available", "x": 66.65, "y": 28.91, "label": "Area Roja", "price": 3000 },
  { "id": "Z3-6-2", "tableId": "Z3-6", "tableNumber": 32, "status": "available", "x": 88.4, "y": 20.03, "label": "Area Amarilla", "price": 3000 },
  { "id": "Z3-6-3", "tableId": "Z3-6", "tableNumber": 31, "status": "available", "x": 82.98, "y": 29.16, "label": "Area Amarilla", "price": 3000 },
  { "id": "Z3-7-1", "tableId": "Z3-7", "tableNumber": 28, "status": "available", "x": 66.39, "y": 20.03, "label": "Area Roja", "price": 3000 },
  { "id": "Z3-7-2", "tableId": "Z3-7", "tableNumber": 26, "status": "available", "x": 55.38, "y": 20.03, "label": "Area Azul", "price": 3000 },
  { "id": "Z3-7-3", "tableId": "Z3-7", "tableNumber": 26, "status": "available", "x": 55.56, "y": 29.16, "label": "Area Azul", "price": 3000 },
  { "id": "Z3-8-1", "tableId": "Z3-8", "tableNumber": 33, "status": "available", "x": 69.14, "y": 9.51, "label": "Area Amarilla", "price": 3000 },
  { "id": "Z3-8-2", "tableId": "Z3-8", "tableNumber": 32, "status": "available", "x": 88.57, "y": 29.03, "label": "Area Amarilla", "price": 3000 },
  { "id": "Z3-8-2", "tableId": "Z3-8", "tableNumber": 32, "status": "available", "x": 88.57, "y": 29.03, "label": "Area Amarilla", "price": 3000 },
  { "id": "NEW-1770926261557", "tableId": "NEW", "tableNumber": 2, "status": "available", "x": 3.99, "y": 45.14, "label": "Area Amarilla", "price": 5000 },
  { "id": "NEW-1770926277989", "tableId": "NEW", "tableNumber": 2, "status": "available", "x": 7.19, "y": 40.45, "label": "Area Amarilla", "price": 5000 },
  { "id": "NEW-1770926341783", "tableId": "NEW", "tableNumber": 3, "status": "available", "x": 5.59, "y": 27.89, "label": "Area Amarilla", "price": 5000 },
  { "id": "NEW-1770926350203", "tableId": "NEW", "tableNumber": 3, "status": "available", "x": 5.68, "y": 36.77, "label": "Area Amarilla", "price": 5000 },
  { "id": "NEW-1770926360109", "tableId": "NEW", "tableNumber": 4, "status": "available", "x": 11.72, "y": 36.77, "label": "Area Roja", "price": 5000 },
  { "id": "NEW-1770926374919", "tableId": "NEW", "tableNumber": 5, "status": "available", "x": 17.66, "y": 36.9, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926385712", "tableId": "NEW", "tableNumber": 5, "status": "available", "x": 17.66, "y": 28.02, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926424801", "tableId": "NEW", "tableNumber": 14, "status": "available", "x": 35.23, "y": 85.46, "label": "Area Amarilla", "price": 5000 },
  { "id": "NEW-1770926455401", "tableId": "NEW", "tableNumber": 22, "status": "available", "x": 39.49, "y": 91.54, "label": "Area Amarilla", "price": 5000 },
  { "id": "NEW-1770926475329", "tableId": "NEW", "tableNumber": 19, "status": "available", "x": 39.49, "y": 72.78, "label": "Area Roja", "price": 5000 },
  { "id": "NEW-1770926553041", "tableId": "NEW", "tableNumber": 24, "status": "available", "x": 63.01, "y": 39.94, "label": "Area Roja", "price": 5000 },
  { "id": "NEW-1770926562407", "tableId": "NEW", "tableNumber": 7, "status": "available", "x": 35.32, "y": 34.61, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926583588", "tableId": "NEW", "tableNumber": 9, "status": "available", "x": 35.32, "y": 47.17, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926592135", "tableId": "NEW", "tableNumber": 9, "status": "available", "x": 29.11, "y": 47.17, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926603279", "tableId": "NEW", "tableNumber": 10, "status": "available", "x": 35.32, "y": 53.25, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926610559", "tableId": "NEW", "tableNumber": 10, "status": "available", "x": 29.02, "y": 53.38, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926617565", "tableId": "NEW", "tableNumber": 11, "status": "available", "x": 35.32, "y": 60.22, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926623392", "tableId": "NEW", "tableNumber": 11, "status": "available", "x": 29.02, "y": 60.1, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926751869", "tableId": "NEW", "tableNumber": 23, "status": "available", "x": 55.03, "y": 39.68, "label": "Area Azul", "price": 5000 },
  { "id": "NEW-1770926832836", "tableId": "NEW", "tableNumber": 25, "status": "available", "x": 72.6, "y": 46.4, "label": "Area Roja", "price": 5000 }
]

def process_seats(seats):
    # Mapping
    zone_codes = {
        "Area Azul": "Z1",
        "Area Roja": "Z2",
        "Area Amarilla": "Z3"
    }
    
    zone_prices = {
        "Area Azul": 5000,
        "Area Roja": 4000,
        "Area Amarilla": 3000
    }
    
    # Bucket by table
    # Key: (label, tableNumber) -> list of seats
    tables = {}
    
    for s in seats:
        label = s.get("label", "Area Azul")
        table_num = s.get("tableNumber", 0)
        key = (label, table_num)
        
        if key not in tables:
            tables[key] = []
        tables[key].append(s)
        
    final_list = []
    
    # Sort groups
    # Order by Zone Code (Z1, Z2, Z3), then by Table Number
    sorted_keys = sorted(tables.keys(), key=lambda k: (zone_codes.get(k[0], "Z9"), k[1]))
    
    for key in sorted_keys:
        label, table_num = key
        group = tables[key]
        
        zone_code = zone_codes.get(label, "Z1")
        price = zone_prices.get(label, 5000)
        
        # Consistent table ID
        # e.g. Z1-2
        table_id = f"{zone_code}-{table_num}"
        
        # Sort seats within table? keeping simplistic ordering
        # Using x, y to sort roughly? or just keep index
        # Let's sort by Y then X
        group.sort(key=lambda x: (x['y'], x['x']))
        
        for idx, seat in enumerate(group):
            new_id = f"{table_id}-{idx + 1}"
            
            new_seat = {
                "id": new_id,
                "tableId": table_id,
                "tableNumber": table_num,
                "status": "available",
                "x": seat['x'],
                "y": seat['y'],
                "label": label,
                "price": price
            }
            final_list.append(new_seat)
            
    return final_list

processed = process_seats(raw_data)

# Write to file
ts_content = """import { Seat } from "@/src/types";

// Calibrated data from user (FINAL)
export const INITIAL_SEATS: Partial<Seat>[] = [
"""

for s in processed:
    # Format nicely
    line = f'    {{ id: "{s["id"]}", tableId: "{s["tableId"]}", tableNumber: {s["tableNumber"]}, status: "available", x: {s["x"]}, y: {s["y"]}, label: "{s["label"]}", price: {s["price"]} }},\n'
    ts_content += line

ts_content += "];\n\nexport const getSeatDefinition = (seatId: string) => {\n    return INITIAL_SEATS.find(s => s.id === seatId);\n};\n"

with open("d:/Jos/BARgoglio/Bargoglio WebApp/bargoglio-web/src/lib/data/seats.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("SUCCESS")
