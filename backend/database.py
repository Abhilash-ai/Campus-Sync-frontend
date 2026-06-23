import os
import json
import uuid
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from config import Config

class JSONCollection:
    def __init__(self, db_path, collection_name):
        self.db_path = db_path
        self.collection_name = collection_name

    def _read_data(self):
        if not os.path.exists(self.db_path):
            return {}
        try:
            with open(self.db_path, 'r') as f:
                data = json.load(f)
                return data.get(self.collection_name, {})
        except Exception:
            return {}

    def _write_data(self, collection_data):
        try:
            data = {}
            if os.path.exists(self.db_path):
                with open(self.db_path, 'r') as f:
                    try:
                        data = json.load(f)
                    except Exception:
                        data = {}
            data[self.collection_name] = collection_data
            with open(self.db_path, 'w') as f:
                json.dump(data, f, indent=4)
            return True
        except Exception as e:
            print(f"Error writing to JSON DB: {e}")
            return False

    def find_one(self, query):
        data = self._read_data()
        for doc_id, doc in data.items():
            match = True
            for k, v in query.items():
                # Allow matching nested fields or simple checks
                if k == '_id' and doc.get('_id') == str(v):
                    continue
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    def find(self, query=None):
        if query is None:
            query = {}
        data = self._read_data()
        results = []
        for doc_id, doc in data.items():
            match = True
            for k, v in query.items():
                if k == '_id' and doc.get('_id') == str(v):
                    continue
                # Handle simple list membership or operators if needed
                if isinstance(v, dict):
                    # Handle basic $gt, $lt, $in, $ne
                    doc_val = doc.get(k)
                    for op, op_val in v.items():
                        if op == '$in' and doc_val not in op_val:
                            match = False
                        elif op == '$gte' and (doc_val is None or doc_val < op_val):
                            match = False
                        elif op == '$lte' and (doc_val is None or doc_val > op_val):
                            match = False
                        elif op == '$ne' and doc_val == op_val:
                            match = False
                    if not match:
                        break
                elif doc.get(k) != v:
                    match = False
                    break
            if match:
                results.append(doc)
        return results

    def insert_one(self, doc):
        data = self._read_data()
        if '_id' not in doc:
            doc['_id'] = str(uuid.uuid4())
        else:
            doc['_id'] = str(doc['_id'])
        
        data[doc['_id']] = doc
        self._write_data(data)
        # Mock class matching pymongo result
        class InsertOneResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertOneResult(doc['_id'])

    def update_one(self, query, update_query, upsert=False):
        data = self._read_data()
        matched_id = None
        for doc_id, doc in data.items():
            match = True
            for k, v in query.items():
                if k == '_id' and doc.get('_id') == str(v):
                    continue
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                matched_id = doc_id
                break

        class UpdateResult:
            def __init__(self, matched_count, modified_count):
                self.matched_count = matched_count
                self.modified_count = modified_count

        if matched_id:
            doc = data[matched_id]
            if '$set' in update_query:
                for k, v in update_query['$set'].items():
                    doc[k] = v
            if '$push' in update_query:
                for k, v in update_query['$push'].items():
                    if k not in doc or not isinstance(doc[k], list):
                        doc[k] = []
                    doc[k].append(v)
            data[matched_id] = doc
            self._write_data(data)
            return UpdateResult(1, 1)
        elif upsert:
            new_doc = query.copy()
            if '$set' in update_query:
                for k, v in update_query['$set'].items():
                    new_doc[k] = v
            self.insert_one(new_doc)
            return UpdateResult(0, 1)
        
        return UpdateResult(0, 0)

    def delete_one(self, query):
        data = self._read_data()
        target_id = None
        for doc_id, doc in data.items():
            match = True
            for k, v in query.items():
                if k == '_id' and doc.get('_id') == str(v):
                    continue
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                target_id = doc_id
                break

        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count

        if target_id:
            del data[target_id]
            self._write_data(data)
            return DeleteResult(1)
        return DeleteResult(0)

    def count_documents(self, query=None):
        if query is None:
            query = {}
        return len(self.find(query))


class JSONDatabase:
    def __init__(self, db_path='database.json'):
        self.db_path = db_path
        self.collections = {}

    def __getattr__(self, name):
        if name not in self.collections:
            self.collections[name] = JSONCollection(self.db_path, name)
        return self.collections[name]

    def __getitem__(self, name):
        return getattr(self, name)


def get_db():
    if Config.MONGO_URI:
        try:
            client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=2000)
            client.admin.command('ping') # Trigger connection check
            print("Successfully connected to MongoDB Atlas!")
            return client['campussync']
        except (ConnectionFailure, Exception) as e:
            print(f"MongoDB connection failed: {e}. Falling back to local JSON database.")
            return JSONDatabase()
    else:
        print("No MONGO_URI specified. Using local JSON database.")
        return JSONDatabase()

db = get_db()
