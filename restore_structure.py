import os
import shutil

ROOT = os.path.abspath(os.path.dirname(__file__))


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def move_file(src_name: str, dest_rel: str) -> None:
    src_path = os.path.join(ROOT, src_name)
    dest_path = os.path.join(ROOT, dest_rel)

    if not os.path.exists(src_path):
        return

    ensure_dir(os.path.dirname(dest_path))

    if os.path.exists(dest_path) and os.path.isfile(dest_path):
        os.remove(dest_path)

    shutil.move(src_path, dest_path)
    print(f"Moved {src_name} -> {dest_rel}")


def restore_structure():
    dirs = [
        "docs",
        "data",
        "archive",
        "archive/KotaPal simple",
        "archive/KotaPal simple/images",
        "archive/KotaPal simple/GitLab SSH Key",
        "archive/KotaPal simple/kotapal-20",
        "frontend",
        "frontend/src",
        "frontend/public",
        "src",
    ]
    for path in dirs:
        ensure_dir(os.path.join(ROOT, path))

    doc_files = [
        "AI_ASSISTANT_ADDED.md",
        "AI_ASSISTANT_SETUP.md",
        "AI_INTEGRATION_SUMMARY.md",
        "CODE_FIXED.md",
        "DATABASE_COMPARISON.md",
        "DATABASE_QUICK_START.md",
        "DEBUG_INSTRUCTIONS.md",
        "DEBUG_LOGIN_ISSUE.md",
        "DOWNLOAD_FIREBASE_KEY.md",
        "FINAL_INSTRUCTIONS.md",
        "FINAL_LOGIN_FIX.md",
        "FINAL_WORKING_SOLUTION.md",
        "FIREBASE_CLIENT_SETUP.md",
        "FIREBASE_CONFIGURED.md",
        "FIREBASE_INTEGRATION_COMPLETE.md",
        "FIREBASE_NOW_WORKING.md",
        "FIREBASE_SETUP.md",
        "FIREBASE_STEP_BY_STEP_GUIDE.md",
        "FIX_FIREBASE_KEY.md",
        "FIX_LOGIN_ERROR.md",
        "FIXED_API_CONNECTION.md",
        "GOOGLE_AUTH_SETUP.md",
        "HOW_TO_LOGIN.md",
        "LOGIN_CREDENTIALS_FIX.md",
        "LOGIN_FIX.md",
        "LOGIN_FIXED.md",
        "NETLIFY_DEPLOYMENT.md",
        "OPEN_HTML_FILE.md",
        "PROJECT_SUMMARY.md",
        "QUICK_START.md",
        "README.md",
        "README_GOOGLE_LOGIN.md",
        "START_HERE.md",
        "START_WITH_FIREBASE.md",
        "STORAGE_EXPLANATION.md",
        "SUPABASE_SETUP.md",
        "TEST_AUTH.md",
        "TEST_BACKEND.md",
        "TEST_DATABASE.md",
        "TEST_LOGIN_NOW.md",
        "TROUBLESHOOTING.md",
        "WORKING_SOLUTION.md",
    ]
    for name in doc_files:
        move_file(name, f"docs/{name}")

    move_file("data.json", "data/data.json")

    archive_files = [
        "CHECK_FIREBASE_SETUP.bat",
        "FINAL_START.bat",
        "LAUNCH_FRONTEND.bat",
        "OPEN_LANDING_PAGE.bat",
        "RUN_APP.bat",
        "RUN_EVERYTHING.bat",
        "run-backend.bat",
        "run-frontend.bat",
        "SERVER_STATUS.bat",
        "SIMPLE_START.bat",
        "start-backend.bat",
        "start-both.bat",
        "start-frontend.bat",
        "start-server.bat",
        "start.bat",
        "START_BACKEND.bat",
        "START_BOTH.bat",
        "START_FRONTEND.bat",
        "START_NOW.bat",
        "START_SERVER.bat",
        "START_SERVERS.bat",
        "test-login-signup-verification.html",
    ]
    for name in archive_files:
        move_file(name, f"archive/{name}")

    backend_files = [
        "affiliate-apis.js",
        "ai-service.js",
        "analytics.js",
        "auth-service.js",
        "db.js",
        "embed-generator.js",
        "firebase-config.js",
        "store.js",
        "supabase-config.js",
    ]
    for name in backend_files:
        move_file(name, f"src/{name}")

    move_file("IMG_4258.JPG", "archive/KotaPal simple/images/IMG_4258.JPG")
    move_file("IMG_4258.png", "archive/KotaPal simple/images/IMG_4258.png")
    move_file("SSH_KEY.txt", "archive/KotaPal simple/GitLab SSH Key/SSH.txt")
    move_file("kotapal-20.txt", "archive/KotaPal simple/kotapal-20/kotapal-20.txt")

    move_file("_redirects", "frontend/public/_redirects")
    move_file("FRONTEND_package.json", "frontend/package.json")
    move_file("postcss.config.js", "frontend/postcss.config.js")
    move_file("tailwind.config.js", "frontend/tailwind.config.js")
    move_file("FRONTEND_PUBLIC_index.html", "frontend/public/index.html")

    for name in os.listdir(ROOT):
        if name.startswith("KOTAPAL_"):
            move_file(name, f"archive/KotaPal simple/{name[len('KOTAPAL_'):]}")

    for name in os.listdir(ROOT):
        if not name.startswith("FRONTEND_SRC_"):
            continue
        relative = name[len("FRONTEND_SRC_"):]
        parts = relative.split("_")
        target_rel = os.path.join(*parts)
        move_file(name, f"frontend/src/{target_rel}")

    if os.path.exists(os.path.join(ROOT, "react-app-index.html")):
        move_file("index.html", "KOTAPAL_index.html.original")
        move_file("react-app-index.html", "index.html")
        move_file("KOTAPAL_index.html.original", "KOTAPAL_index.html")

    print("Restoration complete.")


if __name__ == "__main__":
    restore_structure()


