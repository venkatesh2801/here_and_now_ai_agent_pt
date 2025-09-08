from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os
from prompt import system_prompt

# ------------------------------
# Load environment variables
# ------------------------------
load_dotenv()
google_api_key = os.getenv("GEMINI_API_KEY")

if not google_api_key:
    raise ValueError("GEMINI_API_KEY not found. Check your .env file!")

model = "gemini-2.5-flash-lite"

# ------------------------------
# Initialize LLM
# ------------------------------
try:
    llm = ChatGoogleGenerativeAI(model=model, google_api_key=google_api_key)
    print(f"LLM initialized with model: {model}")
except Exception as e:
    print("Error initializing LLM:", e)
    raise e

# ------------------------------
# Initialize Flask app
# ------------------------------
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from frontend

# Conversation memory
conversation_history = [{"role": "system", "content": system_prompt}]

# ------------------------------
# Chat endpoint
# ------------------------------
@app.route("/chat", methods=["POST"])
def chat():
    global conversation_history
    data = request.json
    user_input = data.get("message", "").strip()
    print("Received user_input:", user_input)

    if not user_input:
        return jsonify({"reply": "Please type a message."})

    if user_input.lower() == "reset":
        conversation_history = [{"role": "system", "content": system_prompt}]
        print("Conversation reset")
        return jsonify({"reply": "Chat reset! Let's start fresh."})

    # Append user message
    conversation_history.append({"role": "user", "content": user_input})

    # Convert conversation_history to a single string prompt
    prompt_lines = []
    for msg in conversation_history:
        role = msg["role"].capitalize()
        content = msg["content"]
        prompt_lines.append(f"{role}: {content}")
    prompt = "\n".join(prompt_lines) + "\nBot:"

    # Call LLM with input=
    try:
        print("Sending to LLM...")
        response = llm.invoke(input=prompt)
        bot_reply = response.content
        print("LLM response received:", bot_reply)
    except Exception as e:
        bot_reply = f"Oops! Something went wrong.\n\nError: {str(e)}"
        print("LLM Error:", e)

    # Append encouragement
    full_reply = f"{bot_reply}\n\n👍 Keep going! You're asking great questions!"
    conversation_history.append({"role": "assistant", "content": full_reply})

    return jsonify({"reply": full_reply})

# ------------------------------
# Run Flask
# ------------------------------
if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(host="127.0.0.1", port=5000, debug=True)
