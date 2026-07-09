from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.import_batch import ImportBatch
from app.schemas import (
    ImportPreviewRow, ImportPreviewResponse,
    ImportConfirmRequest, ImportBatchOut,
)
from app.utils import get_current_user
from app.services.csv_import import parse_csv, categorize_row

router = APIRouter(prefix="/api/imports", tags=["imports"])

MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_ROWS = 5000


@router.post("/upload", response_model=ImportPreviewResponse)
def upload_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=422, detail="Only CSV files are supported")

    content = file.file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=422, detail="File exceeds 5MB limit")

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=422, detail="Could not decode file as text")

    parsed = parse_csv(text)
    rows_raw = parsed["rows"]
    errors = parsed["errors"]

    if len(rows_raw) > MAX_ROWS:
        raise HTTPException(status_code=422, detail=f"File has {len(rows_raw)} rows; max is {MAX_ROWS}")

    existing_hashes = set()
    expense_hashes = db.query(Expense.dedupe_hash).filter(
        Expense.user_id == user.id,
        Expense.dedupe_hash != "",
    ).all()
    for (h,) in expense_hashes:
        existing_hashes.add(h)

    preview_rows = []
    dup_count = 0
    for r in rows_raw:
        is_dup = r["dedupe_hash"] in existing_hashes
        if is_dup:
            dup_count += 1
        category = categorize_row(r["description"])
        preview_rows.append(ImportPreviewRow(
            date=r["date"],
            description=r["description"],
            amount=r["amount"],
            direction=r["direction"],
            category_guess=category,
            is_duplicate=is_dup,
            dedupe_hash=r["dedupe_hash"],
            include=not is_dup,
        ))

    if errors:
        pass

    return ImportPreviewResponse(
        bank_name=parsed["bank_name"],
        rows=preview_rows,
        duplicate_count=dup_count,
        total_count=len(preview_rows),
    )


@router.post("/confirm", response_model=ImportBatchOut)
def confirm_import(
    data: ImportConfirmRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    to_import = [r for r in data.rows if r.include]
    if not to_import:
        raise HTTPException(status_code=422, detail="No rows selected for import")

    existing_hashes = set()
    expense_hashes = db.query(Expense.dedupe_hash).filter(
        Expense.user_id == user.id,
        Expense.dedupe_hash != "",
    ).all()
    for (h,) in expense_hashes:
        existing_hashes.add(h)

    batch = ImportBatch(
        user_id=user.id,
        filename="",
        bank_name="",
        row_count=len(to_import),
        status="confirmed",
    )
    db.add(batch)
    db.flush()

    created = 0
    for row in to_import:
        if row.dedupe_hash in existing_hashes:
            continue
        expense = Expense(
            user_id=user.id,
            amount=row.amount,
            category=row.category_guess,
            description=row.description,
            merchant="",
            date=row.date,
            source="import",
            import_batch_id=batch.id,
            dedupe_hash=row.dedupe_hash,
        )
        db.add(expense)
        existing_hashes.add(row.dedupe_hash)
        created += 1

    batch.row_count = created
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/history", response_model=List[ImportBatchOut])
def import_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    batches = (
        db.query(ImportBatch)
        .filter(ImportBatch.user_id == user.id)
        .order_by(ImportBatch.created_at.desc())
        .all()
    )
    return batches


@router.delete("/{batch_id}", status_code=204)
def delete_import_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    batch = (
        db.query(ImportBatch)
        .filter(ImportBatch.id == batch_id, ImportBatch.user_id == user.id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="Import batch not found")

    db.query(Expense).filter(
        Expense.import_batch_id == batch_id,
        Expense.user_id == user.id,
    ).delete(synchronize_session="fetch")
    batch.status = "reverted"
    db.commit()
