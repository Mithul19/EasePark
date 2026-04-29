# Smart Parking System - Python Backend

Production-ready parking slot allocation and path navigation with Random Forest ML, efficient filtering, and Dijkstra pathfinding.

## Architecture

```
parking_system/
├── models/
│   └── random_forest_model.py    # RandomForestClassifier, 300 estimators
├── algorithms/
│   ├── slot_allocator.py         # Filter + ML allocation
│   └── path_finder.py            # Dijkstra shortest path
├── data/
│   └── dataset_generator.py      # Synthetic training data
└── services/
    └── parking_service.py        # Orchestration, caching, single model load
```

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Train model (run once)
python train_model.py

# Start API server
python run.py
```

API runs at `http://localhost:8000`. Endpoints:

- `POST /allocate` - Allocate best parking slot
- `POST /navigate` - Get path to slot
- `POST /allocate-and-navigate` - Combined flow
- `POST /blob/upload` - Upload base64 data to Azure Blob
- `GET /blob/download/{blob_name}` - Download blob as base64
- `GET /blob/list` - List blobs in container
- `DELETE /blob/{blob_name}` - Delete blob
- `GET /health` - Health check

## Azure Blob Storage Setup

Set the following environment variables before starting the API:

```bash
AZURE_STORAGE_CONNECTION_STRING=<your-storage-connection-string>
AZURE_STORAGE_CONTAINER=parking-assets
```

Install dependencies and run:

```bash
pip install -r requirements.txt
python run.py
```

Example upload request:

```bash
curl -X POST http://localhost:8000/blob/upload \
   -H "Content-Type: application/json" \
   -d '{"blob_name":"demo.txt","content_base64":"SGVsbG8gQXp1cmUgQmxvYiE=","content_type":"text/plain"}'
```

## Features

1. **Random Forest Slot Allocation**
   - 300 estimators, tuned max_depth
   - 80/20 train/test split, 5-fold cross-validation
   - Feature engineering: vehicle_size_category, slot_size_category, distance_score, traffic_score
   - Target accuracy >90%

2. **Efficient Slot Filtering**
   - Vehicle dimension compatibility
   - Slot availability
   - Floor selection
   - Reduces ML inference to valid candidates only

3. **Dijkstra Path Navigation**
   - Graph: lanes, intersections, slots, entry
   - Adjacency list representation
   - Returns path nodes, positions, total distance, navigation steps

4. **Real-Time Optimization**
   - Model loaded once at startup
   - Cached slot catalog (dictionary)
   - Efficient data structures

## API Examples

```bash
# Allocate slot
curl -X POST http://localhost:8000/allocate \
  -H "Content-Type: application/json" \
  -d '{"vehicle_type":"Sedan","vehicle_length":4.5,"vehicle_width":1.8,"floor_number":1,"occupied_slot_ids":[],"lane_traffic_level":5}'

# Navigate
curl -X POST http://localhost:8000/navigate \
  -H "Content-Type: application/json" \
  -d '{"floor_number":1,"target_slot_id":"F1-A1","occupied_slot_ids":[]}'
```

## Python Usage

```python
from parking_system.services.parking_service import ParkingService

svc = ParkingService()
svc.initialize()

result = svc.allocate_and_navigate(
    vehicle_type="Sedan",
    vehicle_length=4.5,
    vehicle_width=1.8,
    floor_number=1,
    occupied_slot_ids=set(),
    lane_traffic_level=5,
)
# result: {"slot_id": "F1-A3", "confidence": 0.92, "path": {...}}
```

## Logging

Configure logging for model predictions, path calculation, and slot assignment:

```python
import logging
logging.getLogger("parking_system").setLevel(logging.DEBUG)
```
