#
# Copyright (c) 2024, Rohith
# Copyright (c) 2024, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

from dataclasses import dataclass
import aiohttp
import os
import argparse
import subprocess

from dotenv import load_dotenv
load_dotenv(override=True)

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from pipecat.transports.services.helpers.daily_rest import DailyRESTHelper, DailyRoomParams

MAX_CONCURRENT_CALLS = 5

@dataclass
class CallData:
    room_url: str
    room_token: str
    location: tuple[float, float] 
    bot_proc: subprocess.Popen

# Bot sub-process dict for status reporting and concurrency control
current_calls: dict[str, CallData] = {}
daily_helpers = {}


def cleanup():
    # Clean up function, just to be extra safe
    for call in current_calls.values():
        proc = call.bot_proc
        proc.terminate()
        proc.wait()


@asynccontextmanager
async def lifespan(app: FastAPI):
    daily_helpers["rest"] = DailyRESTHelper(
        daily_api_key=os.getenv("DAILY_API_KEY", ""),
        daily_api_url=os.getenv("DAILY_API_URL", 'https://api.daily.co/v1'),
    )
    yield
    cleanup()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/start_call")
async def start_agent(request: Request):
    lat = request.query_params.get("lat")
    lng = request.query_params.get("lng")

    if not lat or not lng:
        raise HTTPException(
            status_code=400, detail="Missing lat/lon query parameters")
    
    room = daily_helpers["rest"].create_room(DailyRoomParams())
    room_url = room.url
    if not room_url:
        raise HTTPException(
            status_code=500, detail="Failed to create room")

    # room_url = os.getenv("DAILY_SAMPLE_ROOM_URL", "")

    # remove ended calls
    num_active_calls = 0
    for call in list(current_calls.values()):
        if call.bot_proc.poll() is not None:
            # TODO: delete room
            del current_calls[call.room_url]
        else:
            num_active_calls += 1

    if num_active_calls >= MAX_CONCURRENT_CALLS:
        raise HTTPException(
            status_code=500, detail=f"Max bot limited reach for room: {room_url}")

    # Get the token for the room
    token = daily_helpers["rest"].get_token(room_url)

    if not token:
        raise HTTPException(
            status_code=500, detail=f"Failed to get token for room: {room_url}")

    # Spawn a new agent, and join the user session
    # Note: this is mostly for demonstration purposes (refer to 'deployment' in README)
    try:
        proc = subprocess.Popen(
            [
                f"python3 -m bot -u {room_url} -t {token} -l {lat},{lng}"
            ],
            shell=True,
            bufsize=1,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )

        current_calls[room_url] = CallData(
            room_url=room_url,
            room_token=token,
            location=(float(lat), float(lng)),
            bot_proc=proc
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to start subprocess: {e}")

    return JSONResponse({"bot_id": proc.pid, "room_url": room_url, "token": token}) 


@app.get("/status/{pid}")
def get_status(pid: int):
    # Look up the subprocess
    proc = [call.bot_proc for call in current_calls.values() if call.bot_proc.pid == pid]

    # If the subprocess doesn't exist, return an error
    if not len(proc):
        raise HTTPException(
            status_code=404, detail=f"Bot with process id: {pid} not found")

    proc = proc[0]

    # Check the status of the subprocess
    if proc.poll() is None:
        status = "running"
    else:
        status = "finished"

    return JSONResponse({"bot_id": pid, "status": status})


if __name__ == "__main__":
    import uvicorn

    default_host = os.getenv("HOST", "0.0.0.0")
    default_port = int(os.getenv("FAST_API_PORT", "7860"))

    parser = argparse.ArgumentParser(
        description="Disaster response agent server")
    parser.add_argument("--host", type=str,
                        default=default_host, help="Host address")
    parser.add_argument("--port", type=int,
                        default=default_port, help="Port number")
    parser.add_argument("--reload", action="store_true",
                        help="Reload code on change")

    config = parser.parse_args()

    uvicorn.run(
        "server:app",
        host=config.host,
        port=config.port,
        reload=config.reload,
    )
