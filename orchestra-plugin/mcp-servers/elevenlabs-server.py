#!/usr/bin/env python3
"""
ElevenLabs Text-to-Speech MCP Server
Provides voice synthesis for agent notifications using ElevenLabs API.
"""

import os
import json
import sys
import base64
from typing import Any, Dict, Optional
import requests
from pathlib import Path


class ElevenLabsMCPServer:
    """MCP Server for ElevenLabs TTS integration"""

    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.voice_enabled = os.getenv("VOICE_ENABLED", "false").lower() == "true"

        if not self.api_key and self.voice_enabled:
            raise ValueError("ELEVENLABS_API_KEY environment variable is required when VOICE_ENABLED=true")

        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        } if self.api_key else {}

        # Load voice configuration
        self.voice_config = self._load_voice_config()

    def _load_voice_config(self) -> Dict:
        """Load voice configuration for agents"""
        config_path = Path(__file__).parent.parent / "agents" / "voice-config.json"

        if not config_path.exists():
            return {"agents": {}, "voice_enabled": False}

        with open(config_path, "r") as f:
            config = json.load(f)

        # Replace environment variable placeholders
        voice_enabled = os.getenv("VOICE_ENABLED", "false").lower() == "true"
        config["voice_enabled"] = voice_enabled

        return config

    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make a request to ElevenLabs API"""
        if not self.voice_enabled:
            return {"error": "Voice is disabled. Set VOICE_ENABLED=true to enable."}

        if not self.api_key:
            return {"error": "ELEVENLABS_API_KEY not configured"}

        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        try:
            if method == "GET":
                response = requests.get(url, headers=self.headers, timeout=30)
            else:
                response = requests.post(url, headers=self.headers, json=data, timeout=30)

            response.raise_for_status()

            # For audio responses, return raw bytes
            if response.headers.get("Content-Type", "").startswith("audio/"):
                return {
                    "audio": base64.b64encode(response.content).decode("utf-8"),
                    "content_type": response.headers.get("Content-Type")
                }

            return response.json() if response.text else {}

        except requests.exceptions.RequestException as e:
            return {"error": str(e), "status_code": getattr(e.response, "status_code", None)}

    def get_voices(self) -> Dict:
        """Get available voices"""
        result = self._request("GET", "voices")

        if "error" in result:
            return result

        voices = result.get("voices", [])
        return {
            "voices": [{
                "voice_id": v["voice_id"],
                "name": v["name"],
                "category": v.get("category"),
                "labels": v.get("labels", {}),
                "preview_url": v.get("preview_url")
            } for v in voices]
        }

    def text_to_speech(
        self,
        text: str,
        voice_id: str,
        model_id: str = "eleven_monolingual_v1",
        stability: float = 0.75,
        similarity_boost: float = 0.75,
        style: float = 0.5
    ) -> Dict:
        """Convert text to speech"""
        endpoint = f"text-to-speech/{voice_id}"

        data = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": stability,
                "similarity_boost": similarity_boost,
                "style": style
            }
        }

        result = self._request("POST", endpoint, data)

        if "error" in result:
            return result

        return {
            "success": True,
            "audio_base64": result.get("audio"),
            "content_type": result.get("content_type")
        }

    def speak_as_agent(
        self,
        agent_name: str,
        message: str,
        save_to_file: Optional[str] = None
    ) -> Dict:
        """Generate speech for a specific agent using their configured voice"""
        if not self.voice_enabled:
            return {
                "success": False,
                "error": "Voice is disabled",
                "message": "Set VOICE_ENABLED=true in .env to enable voice notifications"
            }

        agent_name_lower = agent_name.lower()
        agent_config = self.voice_config.get("agents", {}).get(agent_name_lower)

        if not agent_config:
            return {
                "success": False,
                "error": f"Agent '{agent_name}' not found in voice configuration"
            }

        # Get voice settings
        voice_id = agent_config["voice_id"]
        voice_settings = agent_config.get("voice_settings", {})

        # Apply speaking style to message (add personality)
        speaking_style = agent_config.get("speaking_style", {})
        tone_hint = speaking_style.get("tone", "")

        # Generate speech
        result = self.text_to_speech(
            text=message,
            voice_id=voice_id,
            stability=voice_settings.get("stability", 0.75),
            similarity_boost=voice_settings.get("similarity_boost", 0.75),
            style=voice_settings.get("style", 0.5)
        )

        if "error" in result:
            return result

        # Optionally save to file
        if save_to_file and result.get("audio_base64"):
            audio_bytes = base64.b64decode(result["audio_base64"])
            with open(save_to_file, "wb") as f:
                f.write(audio_bytes)

            result["saved_to"] = save_to_file

        result["agent"] = agent_name
        result["voice_name"] = agent_config.get("voice_name")

        return result

    def announce_task_complete(
        self,
        agent_name: str,
        task_description: str,
        play_audio: bool = True
    ) -> Dict:
        """Announce task completion with agent's voice"""
        import random

        # Get agent config
        agent_config = self.voice_config.get("agents", {}).get(agent_name.lower(), {})

        # Use short phrases to minimize token usage (2-6 words)
        short_phrases = self.voice_config.get("short_phrases", {}).get(agent_name.lower(), [])

        if short_phrases:
            # Pick a random short phrase for variety
            voice_message = random.choice(short_phrases)
        else:
            # Fallback to generic completion message
            voice_message = "Task complete."

        # Text message is more detailed (shown in console)
        text_message = f"{agent_config.get('speaking_style', {}).get('phrases', [''])[0]} {task_description} is complete."

        # Generate voice with short message
        result = self.speak_as_agent(agent_name, voice_message)

        # Add both messages to result
        result["voice_message"] = voice_message
        result["text_message"] = text_message

        return result

    def announce_handoff(
        self,
        from_agent: str,
        to_agent: str,
        task_description: str
    ) -> Dict:
        """Announce task handoff"""
        template = self.voice_config.get("notification_settings", {}).get("handoff", {}).get("template")

        if not template:
            template = "🔄 {from_agent} → {to_agent}: Handing off {task_description}."

        message = template.format(
            from_agent=from_agent,
            to_agent=to_agent,
            task_description=task_description
        )

        result = self.speak_as_agent(from_agent, message)
        result["text_message"] = message

        return result

    def get_agent_personality(self, agent_name: str) -> Dict:
        """Get personality and speaking style for an agent"""
        agent_config = self.voice_config.get("agents", {}).get(agent_name.lower())

        if not agent_config:
            return {"error": f"Agent '{agent_name}' not found"}

        return {
            "name": agent_config.get("name"),
            "personality": agent_config.get("personality"),
            "voice_name": agent_config.get("voice_name"),
            "speaking_style": agent_config.get("speaking_style"),
            "voice_enabled": self.voice_enabled
        }


def handle_command(server: ElevenLabsMCPServer, command: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle MCP commands"""

    if command == "get_voices":
        return {
            "success": True,
            "data": server.get_voices()
        }

    elif command == "text_to_speech":
        return {
            "success": True,
            "data": server.text_to_speech(
                params["text"],
                params["voice_id"],
                params.get("model_id", "eleven_monolingual_v1"),
                params.get("stability", 0.75),
                params.get("similarity_boost", 0.75),
                params.get("style", 0.5)
            )
        }

    elif command == "speak_as_agent":
        return {
            "success": True,
            "data": server.speak_as_agent(
                params["agent_name"],
                params["message"],
                params.get("save_to_file")
            )
        }

    elif command == "announce_task_complete":
        return {
            "success": True,
            "data": server.announce_task_complete(
                params["agent_name"],
                params["task_description"],
                params.get("play_audio", True)
            )
        }

    elif command == "announce_handoff":
        return {
            "success": True,
            "data": server.announce_handoff(
                params["from_agent"],
                params["to_agent"],
                params["task_description"]
            )
        }

    elif command == "get_agent_personality":
        return {
            "success": True,
            "data": server.get_agent_personality(params["agent_name"])
        }

    else:
        return {
            "success": False,
            "error": f"Unknown command: {command}"
        }


def main():
    """Main entry point for MCP server"""
    try:
        server = ElevenLabsMCPServer()

        # Read command from stdin
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            input_data = json.loads(sys.stdin.read())

        command = input_data.get("command")
        params = input_data.get("params", {})

        result = handle_command(server, command, params)
        print(json.dumps(result, indent=2))

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
