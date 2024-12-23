from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "hello world again"}


@app.get("/api")
def api():
    return {"message": "That's the API route"} 