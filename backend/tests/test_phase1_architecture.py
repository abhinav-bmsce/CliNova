import unittest
import json
import os
from pathlib import Path

# Add project root to sys.path
import sys
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import create_app
from backend.core.config import settings
from backend.database.session import check_db_health, init_db

class Phase1ArchitectureTestCase(unittest.TestCase):
    """Test suite validating Phase 1: Project initialization and architecture."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_settings_and_identity(self):
        """Verify project identity parameters match specifications."""
        self.assertEqual(settings.PROJECT_NAME, "CLINOVA")
        self.assertIn("Clinical Knowledge Discovery", settings.PROJECT_FULL_NAME)
        self.assertEqual(settings.TAGLINE, "Discover Beyond Data.")
        self.assertTrue(settings.STORAGE_DIR.exists())
        self.assertTrue(settings.RAW_DATASETS_DIR.exists())
        self.assertTrue(settings.PROCESSED_DATASETS_DIR.exists())
        self.assertTrue(settings.REPORTS_DIR.exists())

    def test_directory_structure_compliance(self):
        """Ensure all required folders from Section 22 exist."""
        required_frontend_dirs = [
            "components", "layouts", "pages", "services", "hooks", "types", "utils"
        ]
        for d in required_frontend_dirs:
            self.assertTrue(
                (PROJECT_ROOT / "frontend" / d).is_dir(),
                f"Missing frontend directory: frontend/{d}"
            )
            self.assertTrue(
                (PROJECT_ROOT / "src" / d).is_dir(),
                f"Missing src directory: src/{d}"
            )

        required_backend_dirs = [
            "api", "core", "database", "models", "schemas", "services", "kdd", "ai", "tests"
        ]
        for d in required_backend_dirs:
            self.assertTrue(
                (PROJECT_ROOT / "backend" / d).is_dir(),
                f"Missing backend directory: backend/{d}"
            )

        self.assertTrue((PROJECT_ROOT / "docs").is_dir(), "Missing docs directory")
        self.assertTrue((PROJECT_ROOT / "storage").is_dir(), "Missing storage directory")
        self.assertTrue((PROJECT_ROOT / "package.json").is_file(), "Missing package.json")
        self.assertTrue((PROJECT_ROOT / "requirements.txt").is_file(), "Missing requirements.txt")
        self.assertTrue((PROJECT_ROOT / ".env.example").is_file(), "Missing .env.example")
        self.assertTrue((PROJECT_ROOT / "README.md").is_file(), "Missing README.md")

    def test_database_initialization_and_health(self):
        """Verify relational database initializes and health check passes."""
        init_db()
        self.assertTrue(check_db_health(), "Database health check failed")

    def test_health_endpoint(self):
        """Verify GET /api/health returns operational status."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["database"], "connected")
        self.assertEqual(data["storage"], "accessible")
        self.assertEqual(data["engine"], "active")
        self.assertEqual(data["version"], "1.0.0")

    def test_system_info_endpoint(self):
        """Verify GET /api/info returns algorithm descriptors."""
        response = self.client.get("/api/info")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data["name"], "CLINOVA")
        self.assertIn("algorithms", data)
        algorithm_ids = [a["id"] for a in data["algorithms"]]
        self.assertIn("apriori", algorithm_ids)
        self.assertIn("fp_growth", algorithm_ids)
        self.assertIn("kmeans", algorithm_ids)
        self.assertIn("decision_tree", algorithm_ids)
        self.assertIn(".csv", data["supported_formats"])
        self.assertIn(".xlsx", data["supported_formats"])

if __name__ == "__main__":
    unittest.main()

