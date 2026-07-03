import os
import sys
import subprocess

def run_cmd(cmd, cwd=None):
    print(f"Executing: {cmd} (Cwd={cwd or '.'})")
    # shell=True is required on Windows to access commands like npm and pip in scripts
    result = subprocess.run(cmd, cwd=cwd, shell=True)
    if result.returncode != 0:
        print(f"Error: Command failed with code {result.returncode} -> {cmd}")
        sys.exit(result.returncode)

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    print("\n==================================================================")
    print("   InsightFlow: Customer Insight & Survey Intelligence Platform   ")
    print("==================================================================\n")

    # Step 1: Install Python Libraries
    print("[1/4] Checking Python backend dependencies...")
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        import pypdf
        import google.generativeai
        print("-> Python dependencies are satisfied.")
    except ImportError:
        print("-> Missing dependencies. Installing FastAPI, SQLAlchemy, PyPDF, and Gemini SDK...")
        run_cmd(f'"{sys.executable}" -m pip install fastapi uvicorn sqlalchemy pypdf google-generativeai')

    # Step 2: Install Node.js Frontend Dependencies
    print("\n[2/4] Checking Node.js frontend dependencies...")
    node_modules_dir = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules_dir):
        print("-> node_modules not found. Installing frontend npm packages...")
        run_cmd("npm install", cwd=frontend_dir)
    else:
        print("-> Frontend npm packages are already installed.")

    # Step 3: Compile React Build
    print("\n[3/4] Compiling React production build (Vite)...")
    run_cmd("npm run build", cwd=frontend_dir)

    # Step 4: Boot Uvicorn Server
    print("\n[4/4] Starting backend web server on Port 8000...")
    print("\n==================================================================")
    print(" SUCCESS: InsightFlow is starting!")
    print(" Access the application in your browser at: http://127.0.0.1:8000")
    print(" Press Ctrl+C in this terminal to shut down the server.")
    print("==================================================================\n")
    
    # Run uvicorn inside the backend folder to ensure absolute paths resolve locally
    run_cmd("uvicorn main:app --host 127.0.0.1 --port 8000", cwd=backend_dir)

if __name__ == "__main__":
    main()
