import os
import json
import uuid
import time
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    from dotenv import load_dotenv
    # Load backend/.env or root .env
    backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if os.path.exists(backend_env):
        load_dotenv(backend_env)
    elif os.path.exists(root_env):
        load_dotenv(root_env)
    else:
        load_dotenv()
except Exception:
    pass

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

_file_locks: Dict[str, threading.Lock] = {}
_global_lock = threading.Lock()

def _get_lock(collection_name: str) -> threading.Lock:
    with _global_lock:
        if collection_name not in _file_locks:
            _file_locks[collection_name] = threading.Lock()
        return _file_locks[collection_name]

class JSONCollection:
    """A resilient, thread-safe JSON-backed collection that mimics PyMongo collection methods."""
    def __init__(self, name: str):
        self.name = name
        self.file_path = os.path.join(DATA_DIR, f"{name}.json")
        self.lock = _get_lock(name)
        if not os.path.exists(self.file_path):
            with self.lock:
                with open(self.file_path, "w", encoding="utf-8") as f:
                    json.dump([], f, indent=2)

    def _read(self) -> List[Dict[str, Any]]:
        with self.lock:
            try:
                if not os.path.exists(self.file_path):
                    return []
                with open(self.file_path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if not content:
                        return []
                    return json.loads(content)
            except Exception as e:
                print(f"Error reading {self.name}.json: {e}")
                return []

    def _write(self, docs: List[Dict[str, Any]]) -> None:
        with self.lock:
            temp_path = f"{self.file_path}.tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(docs, f, indent=2, default=str)
            if os.path.exists(self.file_path):
                os.replace(temp_path, self.file_path)
            else:
                os.rename(temp_path, self.file_path)

    def _match(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for key, val in query.items():
            if key == "$or" and isinstance(val, list):
                if not any(self._match(doc, subq) for subq in val):
                    return False
                continue
            if key == "$and" and isinstance(val, list):
                if not all(self._match(doc, subq) for subq in val):
                    return False
                continue
            
            if "." in key:
                parts = key.split(".")
                curr = doc
                for p in parts:
                    if isinstance(curr, dict):
                        curr = curr.get(p)
                    else:
                        curr = None
                        break
                doc_val = curr
            else:
                doc_val = doc.get(key)
            if isinstance(val, dict):
                # Operators like $in, $gte, $lte, $regex, $ne
                if "$in" in val and doc_val not in val["$in"]:
                    return False
                if "$nin" in val and doc_val in val["$nin"]:
                    return False
                if "$ne" in val and doc_val == val["$ne"]:
                    return False
                if "$gte" in val and (doc_val is None or doc_val < val["$gte"]):
                    return False
                if "$lte" in val and (doc_val is None or doc_val > val["$lte"]):
                    return False
                if "$gt" in val and (doc_val is None or doc_val <= val["$gt"]):
                    return False
                if "$lt" in val and (doc_val is None or doc_val >= val["$lt"]):
                    return False
                if "$regex" in val:
                    import re
                    pattern = val["$regex"]
                    options = val.get("$options", "")
                    flags = re.IGNORECASE if "i" in options else 0
                    if not re.search(pattern, str(doc_val or ""), flags):
                        return False
            else:
                if doc_val != val:
                    return False
        return True

    def find_one(self, query: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        docs = self._read()
        for doc in docs:
            if self._match(doc, query):
                return dict(doc)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None, sort: Optional[List[tuple]] = None, limit: int = 0) -> List[Dict[str, Any]]:
        query = query or {}
        docs = self._read()
        matched = [dict(d) for d in docs if self._match(d, query)]

        if sort:
            for key, direction in reversed(sort):
                matched.sort(key=lambda x: (x.get(key) is None, x.get(key)), reverse=(direction == -1))

        if limit > 0:
            matched = matched[:limit]
        return matched

    def insert_one(self, document: Dict[str, Any]) -> str:
        doc = dict(document)
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        if "created_at" not in doc:
            doc["created_at"] = datetime.utcnow().isoformat()
        if "updated_at" not in doc:
            doc["updated_at"] = datetime.utcnow().isoformat()

        docs = self._read()
        docs.append(doc)
        self._write(docs)
        return doc["_id"]

    def insert_many(self, documents: List[Dict[str, Any]]) -> List[str]:
        ids = []
        now = datetime.utcnow().isoformat()
        docs = self._read()
        for d in documents:
            doc = dict(d)
            if "_id" not in doc:
                doc["_id"] = str(uuid.uuid4())
            if "created_at" not in doc:
                doc["created_at"] = now
            if "updated_at" not in doc:
                doc["updated_at"] = now
            docs.append(doc)
            ids.append(doc["_id"])
        self._write(docs)
        return ids

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> bool:
        docs = self._read()
        matched_idx = -1
        for idx, doc in enumerate(docs):
            if self._match(doc, query):
                matched_idx = idx
                break

        now = datetime.utcnow().isoformat()
        if matched_idx >= 0:
            doc = docs[matched_idx]
            if "$set" in update:
                doc.update(update["$set"])
            if "$inc" in update:
                for k, v in update["$inc"].items():
                    doc[k] = doc.get(k, 0) + v
            if "$unset" in update:
                for k in update["$unset"]:
                    doc.pop(k, None)
            doc["updated_at"] = now
            docs[matched_idx] = doc
            self._write(docs)
            return True
        elif upsert:
            new_doc = dict(query)
            if "$set" in update:
                new_doc.update(update["$set"])
            new_doc["_id"] = str(uuid.uuid4())
            new_doc["created_at"] = now
            new_doc["updated_at"] = now
            docs.append(new_doc)
            self._write(docs)
            return True
        return False

    def delete_one(self, query: Dict[str, Any]) -> bool:
        docs = self._read()
        for idx, doc in enumerate(docs):
            if self._match(doc, query):
                docs.pop(idx)
                self._write(docs)
                return True
        return False

    def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        return len(self.find(query))


class MongoCollectionWrapper:
    """Wraps PyMongo collection so find() returns a list, handles sorting, and count_documents defaults safely."""
    def __init__(self, raw_collection):
        self.raw = raw_collection
        self.name = raw_collection.name

    def find(self, query: Optional[Dict[str, Any]] = None, sort: Optional[List[tuple]] = None) -> List[Dict[str, Any]]:
        query = query or {}
        cursor = self.raw.find(query)
        if sort:
            cursor = cursor.sort(sort)
        docs = list(cursor)
        for d in docs:
            if "_id" in d and hasattr(d["_id"], "__str__") and not isinstance(d["_id"], str):
                d["_id"] = str(d["_id"])
        return docs

    def find_one(self, query: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        d = self.raw.find_one(query)
        if d and "_id" in d and hasattr(d["_id"], "__str__") and not isinstance(d["_id"], str):
            d["_id"] = str(d["_id"])
        return d

    def insert_one(self, doc: Dict[str, Any]) -> str:
        d = dict(doc)
        if "_id" not in d:
            d["_id"] = str(uuid.uuid4())
        res = self.raw.insert_one(d)
        doc["_id"] = str(res.inserted_id)
        return doc["_id"]

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        return self.raw.update_one(query, update, upsert=upsert)

    def delete_one(self, query: Dict[str, Any]):
        return self.raw.delete_one(query)

    def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        return self.raw.count_documents(query or {})


class DatabaseManager:
    """Manages collection access with transparent fallback between MongoDB and JSON persistence."""
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.is_mongo = False
        self._collections: Dict[str, Any] = {}
        self._init_connection()

    def _init_connection(self):
        mongo_uri = os.environ.get("MONGO_URI")
        if mongo_uri:
            try:
                import pymongo
                client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=8000)
                client.server_info()  # trigger connection check
                self.mongo_client = client
                db_name = os.environ.get("MONGO_DB_NAME", "godavari_traders")
                self.db = client[db_name]
                self.is_mongo = True
                print(f"[Database] Connected successfully to MongoDB: {db_name}")
                return
            except Exception as e:
                print(f"[Database] MongoDB connection failed ({e}). Falling back to JSON document store.")

        print(f"[Database] Using robust persistent JSON document store at: {DATA_DIR}")
        self.is_mongo = False

    def get_collection(self, name: str):
        if self.is_mongo and self.db is not None:
            if name not in self._collections:
                self._collections[name] = MongoCollectionWrapper(self.db[name])
            return self._collections[name]
        if name not in self._collections:
            self._collections[name] = JSONCollection(name)
        return self._collections[name]

# Global DB manager singleton
db_manager = DatabaseManager()

def get_db():
    return db_manager
