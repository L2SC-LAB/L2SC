"""
Forward execution requests từ L2SC sang L2S node đang live.
L2SC không chạy workflow engine — chỉ là registry + proxy.
"""
import asyncio
import logging
from datetime import datetime
from typing import Optional
import httpx
from sqlalchemy.orm import Session
from backend import db_models

logger = logging.getLogger(__name__)

# Timeout cho mỗi forward request (giây)
FORWARD_TIMEOUT = 120


async def forward_execute(
    run: db_models.WorkflowRun,
    workflow: db_models.PublicWorkflow,
    db: Session,
) -> None:
    """
    Gửi execute request đến L2S node, cập nhật run status theo kết quả.
    Chạy trong background task.
    """
    node = workflow.node
    if not node or not node.is_active:
        _fail(run, "L2S node không khả dụng hoặc chưa được đăng ký", db)
        return

    url = f"{node.base_url.rstrip('/')}/api/workflows/execute"
    headers = {"Authorization": f"Bearer {node.node_api_key}"}
    body = {
        "workflow_id": workflow.l2s_workflow_id,
        "initial_payload": run.payload,
        "run_source": "l2sc",
        "l2sc_run_id": run.id,
    }

    try:
        async with httpx.AsyncClient(timeout=FORWARD_TIMEOUT) as client:
            resp = await client.post(url, json=body, headers=headers)

        if resp.status_code == 200:
            data = resp.json()
            run.remote_run_id = data.get("run_id")
            run.status = data.get("status", "running")
            run.result = data.get("result")
            if run.status in ("success", "failed"):
                run.finished_at = datetime.utcnow()
            db.commit()
            # Update node last_seen
            node.last_seen_at = datetime.utcnow()
            workflow.call_count = (workflow.call_count or 0) + 1
            db.commit()
        else:
            _fail(run, f"Node trả lỗi HTTP {resp.status_code}: {resp.text[:200]}", db)

    except httpx.TimeoutException:
        _fail(run, f"Timeout sau {FORWARD_TIMEOUT}s khi gọi node {node.base_url}", db)
    except Exception as e:
        _fail(run, str(e), db)


async def poll_run_status(
    run: db_models.WorkflowRun,
    db: Session,
    max_polls: int = 30,
    interval: float = 2.0,
) -> None:
    """
    Poll trạng thái run từ L2S node cho đến khi xong (hoặc timeout).
    """
    if not run.remote_run_id:
        return

    workflow = run.workflow
    node = workflow.node if workflow else None
    if not node:
        return

    url = f"{node.base_url.rstrip('/')}/api/workflows/runs/{run.remote_run_id}"
    headers = {"Authorization": f"Bearer {node.node_api_key}"}

    for _ in range(max_polls):
        await asyncio.sleep(interval)
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                status = data.get("status", run.status)
                run.status = status
                run.result = data.get("result") or data.get("node_results")
                run.error = data.get("error")
                if status in ("success", "failed"):
                    run.finished_at = datetime.utcnow()
                    db.commit()
                    return
                db.commit()
        except Exception as e:
            logger.warning(f"Poll run {run.id} error: {e}")

    # Vẫn chưa xong sau max_polls → giữ trạng thái hiện tại
    db.commit()


def _fail(run: db_models.WorkflowRun, error: str, db: Session):
    run.status = "failed"
    run.error = error
    run.finished_at = datetime.utcnow()
    db.commit()
    logger.error(f"Run {run.id} failed: {error}")
