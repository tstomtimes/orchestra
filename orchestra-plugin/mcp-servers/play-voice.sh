#!/usr/bin/env bash
# Voice notification helper script
# Plays agent voice notifications using ElevenLabs TTS

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if voice is enabled
if [ "${VOICE_ENABLED:-false}" != "true" ]; then
    exit 0  # Silently exit if voice is disabled
fi

# Check required tools
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found. Voice playback skipped." >&2
    exit 0
fi

# Usage check
if [ $# -lt 2 ]; then
    echo "Usage: $0 <agent_name> <task_description>" >&2
    echo "" >&2
    echo "Examples:" >&2
    echo "  $0 alex 'code review'" >&2
    echo "  $0 eden 'QA tests'" >&2
    echo "  $0 theo 'deployment'" >&2
    exit 1
fi

AGENT_NAME="$1"
TASK_DESCRIPTION="$2"

# Generate voice notification
RESPONSE=$(echo "{\"command\":\"announce_task_complete\",\"params\":{\"agent_name\":\"$AGENT_NAME\",\"task_description\":\"$TASK_DESCRIPTION\"}}" | "$SCRIPT_DIR/run-mcp.sh" elevenlabs-server.py 2>/dev/null)

# Check if request was successful
if ! echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "⚠️  Voice notification failed" >&2
    exit 0
fi

# Extract audio data
AUDIO_BASE64=$(echo "$RESPONSE" | jq -r '.data.audio_base64 // empty')
TEXT_MESSAGE=$(echo "$RESPONSE" | jq -r '.data.text_message // empty')

# Display text message
if [ -n "$TEXT_MESSAGE" ]; then
    echo "$TEXT_MESSAGE"
fi

# Play audio if available
if [ -n "$AUDIO_BASE64" ]; then
    # Create temporary file
    TEMP_AUDIO="/tmp/orchestra-voice-$AGENT_NAME-$$.mp3"

    # Decode and save audio
    echo "$AUDIO_BASE64" | base64 --decode > "$TEMP_AUDIO" 2>/dev/null

    # Play audio based on platform
    if command -v afplay &> /dev/null; then
        # macOS
        afplay "$TEMP_AUDIO" &
    elif command -v mpg123 &> /dev/null; then
        # Linux with mpg123
        mpg123 -q "$TEMP_AUDIO" &
    elif command -v ffplay &> /dev/null; then
        # Linux with ffplay
        ffplay -nodisp -autoexit -loglevel quiet "$TEMP_AUDIO" &
    fi

    # Clean up after playback (wait briefly then remove)
    (sleep 5 && rm -f "$TEMP_AUDIO" 2>/dev/null) &
fi

exit 0
