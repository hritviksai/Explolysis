from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from services.ai_analyst import stream_insights
import asyncio
import json

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/insights/{session_id}")
async def get_insights(session_id: str):
    async def event_generator():
        try:
            async for chunk in stream_insights(session_id):
                data = json.dumps({"text": chunk})
                yield f"data: {data}\n\n"
                await asyncio.sleep(0)  # yield control to event loop
        except FileNotFoundError:
            yield f"data: {json.dumps({'error': 'Session not found'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )
