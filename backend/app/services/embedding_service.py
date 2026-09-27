import os
import math
import logging
from typing import List, Optional

logger = logging.getLogger("acadrium.embedding_service")

# Global singleton model cache
_model_instance = None

def get_model():
    """Lazy load the sentence-transformers model instance once."""
    global _model_instance
    if _model_instance is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence-transformers/all-MiniLM-L6-v2 model into memory...")
            _model_instance = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            logger.info("sentence-transformers/all-MiniLM-L6-v2 model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load sentence-transformers model: {e}")
            _model_instance = None
    return _model_instance

def generate_fallback_embedding(text: str, dim: int = 384) -> List[float]:
    """Generate a deterministic 384d normalized vector based on character/word hash distributions."""
    if not text:
        return [0.0] * dim
    
    vec = [0.0] * dim
    words = text.lower().split()
    for w in words:
        h = abs(hash(w))
        idx = h % dim
        vec[idx] += 1.0
        # Second hash pass for smoothing
        idx2 = (h // dim) % dim
        vec[idx2] += 0.5

    # Compute Euclidean norm
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [round(x / norm, 6) for x in vec]
    else:
        vec = [0.0] * dim
    return vec

def generate_embedding(text: str) -> Optional[List[float]]:
    """Generate a 384-dimensional vector embedding for document text."""
    if not text or not text.strip():
        return None

    # Clean & limit text size for optimal embedding performance
    clean_text = text.strip()[:2000]

    try:
        model = get_model()
        if model is not None:
            raw_vec = model.encode(clean_text)
            if hasattr(raw_vec, "tolist"):
                vec_list = raw_vec.tolist()
            else:
                vec_list = list(raw_vec)
            
            # Normalize vector to unit length
            norm = math.sqrt(sum(x * x for x in vec_list))
            if norm > 0:
                return [round(float(x / norm), 6) for x in vec_list]
            return [float(x) for x in vec_list]
        else:
            logger.warning("Using fallback deterministic embedding generator.")
            return generate_fallback_embedding(clean_text, 384)
    except Exception as e:
        logger.error(f"Error generating sentence-transformers embedding: {e}")
        return generate_fallback_embedding(clean_text, 384)

def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two 384-dimensional vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    similarity = dot_product / (norm_a * norm_b)
    return max(0.0, min(1.0, round(float(similarity), 4)))

def semantic_search_resources(db, query: str, current_user, limit: int = 10) -> List[dict]:
    """Perform vector cosine similarity search over accessible classroom resources."""
    from app.models.classroom import Classroom, ClassroomMember
    from app.models.resource import Resource

    if not query or not query.strip():
        return []

    query_emb = generate_embedding(query)

    # Filter by user classroom access permissions
    if current_user.role == "faculty":
        faculty_classroom_ids = [c.id for c in db.query(Classroom.id).filter(Classroom.faculty_id == current_user.id).all()]
        if not faculty_classroom_ids:
            return []
        query_set = db.query(Resource).filter(Resource.classroom_id.in_(faculty_classroom_ids)).all()
    else:
        enrolled_classroom_ids = [m.classroom_id for m in db.query(ClassroomMember.classroom_id).filter(ClassroomMember.student_id == current_user.id).all()]
        if not enrolled_classroom_ids:
            return []
        query_set = db.query(Resource).filter(Resource.classroom_id.in_(enrolled_classroom_ids)).all()

    scored_items = []
    for res in query_set:
        sim = 0.0
        # If embedding missing but text extracted, compute on demand
        if res.embedding is None and res.extracted_text:
            emb = generate_embedding(res.extracted_text)
            if emb:
                res.embedding = emb
                db.commit()

        if res.embedding and query_emb:
            sim = compute_cosine_similarity(query_emb, res.embedding)
        else:
            # Keyword fallback
            q_low = query.strip().lower()
            if q_low in (res.title or "").lower() or (res.extracted_text and q_low in res.extracted_text.lower()):
                sim = 0.50

        if sim > 0.05 or query.strip().lower() in (res.title or "").lower():
            res_dict = res.to_dict()
            res_dict["similarity"] = round(float(sim), 4)
            scored_items.append((sim, res_dict))

    scored_items.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_items[:limit]]

def semantic_search_workspace_files(db, query: str, current_user, limit: int = 10) -> List[dict]:
    """Perform vector cosine similarity search over user's workspace files."""
    from app.models.workspace_resource import WorkspaceResource

    if not query or not query.strip():
        return []

    query_emb = generate_embedding(query)
    query_set = db.query(WorkspaceResource).filter(WorkspaceResource.owner_id == current_user.id).all()

    scored_items = []
    for res in query_set:
        sim = 0.0
        if res.embedding is None and res.extracted_text:
            emb = generate_embedding(res.extracted_text)
            if emb:
                res.embedding = emb
                db.commit()

        if res.embedding and query_emb:
            sim = compute_cosine_similarity(query_emb, res.embedding)
        else:
            q_low = query.strip().lower()
            if q_low in (res.title or "").lower() or (res.extracted_text and q_low in res.extracted_text.lower()):
                sim = 0.50

        if sim > 0.05 or query.strip().lower() in (res.title or "").lower():
            res_dict = res.to_dict()
            res_dict["similarity"] = round(float(sim), 4)
            scored_items.append((sim, res_dict))

    scored_items.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored_items[:limit]]

