import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_includes=["*.py"],
        reload_excludes=["*.db", "*.db-journal", "*.log", "*.sqlite", "__pycache__"]
    )
