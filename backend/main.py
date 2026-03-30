from flask import Flask
from flask_cors import CORS
from api.chat import chat_bp

app = Flask(__name__)

CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

app.register_blueprint(chat_bp, url_prefix="/api")


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
