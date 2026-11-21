#!/usr/bin/env python3
"""Respalda Brota desde Supabase sin modificar la base remota.

Pide la URI de PostgreSQL de forma oculta y genera artefactos de estructura
y datos, igual que el exportador usado para preparar el demo local de SIHS.
Los archivos generados contienen datos sensibles y se guardan en backups/,
directorio excluido de Git.
"""

import datetime as dt
import getpass
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / "backend" / ".env"


def project_ref() -> str:
    """Obtiene el ref desde la URL ya configurada para el backend local."""
    if not ENV_FILE.is_file():
        sys.exit(f"No existe {ENV_FILE}. Configura primero backend/.env.")

    match = re.search(
        r"^SUPABASE_URL=https://([^.]+)\.supabase\.co\s*$",
        ENV_FILE.read_text(encoding="utf-8"),
        flags=re.MULTILINE,
    )
    if not match:
        sys.exit("No encontré SUPABASE_URL válida en backend/.env.")
    return match.group(1)


def run_dump(command: list[str], env: dict[str, str], output: Path) -> dict[str, int | str]:
    print(f"\nExportando {output.name} ...", flush=True)
    with output.open("wb") as file:
        result = subprocess.run(command, stdout=file, stderr=subprocess.PIPE, env=env)
    if result.returncode:
        output.unlink(missing_ok=True)
        details = result.stderr.decode("utf-8", errors="replace")[-3500:]
        raise RuntimeError(f"Falló {output.name}:\n{details}")
    size = output.stat().st_size
    print(f"  OK: {size:,} bytes")
    return {"file": output.name, "bytes": size}


def main() -> None:
    if not shutil.which("pg_dump") or not shutil.which("pg_restore"):
        sys.exit("Instala PostgreSQL 17+ y asegúrate de que pg_dump y pg_restore estén en PATH.")

    version = subprocess.run(
        ["pg_dump", "--version"], capture_output=True, text=True, check=True
    ).stdout.strip()
    ref = project_ref()

    print(f"Respaldo de Brota, proyecto {ref}")
    print(f"Cliente: {version}")
    print("La base remota no se modifica. No subas backups/ al repositorio.")
    print("En Supabase: Connect > Session pooler > URI.")

    source_url = getpass.getpass("Pega la URI completa de PostgreSQL (oculta): ").strip()
    if not source_url.startswith(("postgresql://", "postgres://")):
        sys.exit("La URI debe empezar por postgresql:// o postgres://")

    directory = ROOT / "backups" / ("brota_" + dt.datetime.now().strftime("%Y%m%d_%H%M%S"))
    directory.mkdir(parents=True)
    env = os.environ.copy()
    env["PGCONNECT_TIMEOUT"] = "20"
    env["PGSSLMODE"] = "require"
    base = ["pg_dump", "--dbname", source_url, "--no-owner", "--no-acl", "--verbose"]
    jobs = [
        ("base_completa.dump", base + ["--format=custom", "--blobs"]),
        ("base_completa.sql", base + ["--format=plain", "--blobs"]),
        ("solo_estructura.sql", base + ["--schema-only", "--format=plain"]),
        ("solo_datos.sql", base + ["--data-only", "--format=plain"]),
        ("aplicacion_public.dump", base + ["--schema=public", "--format=custom"]),
        ("aplicacion_public.sql", base + ["--schema=public", "--format=plain"]),
    ]

    completed: list[dict[str, int | str]] = []
    try:
        for name, command in jobs:
            completed.append(run_dump(command, env, directory / name))
    finally:
        source_url = ""
        env.pop("PGPASSWORD", None)

    (directory / "inventario.json").write_text(
        json.dumps(
            {
                "project_ref": ref,
                "exported_at_local": dt.datetime.now().isoformat(),
                "pg_dump_version": version,
                "files": completed,
                "warning": "Puede contener datos personales y hashes de autenticación; almacenar solo de forma privada.",
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"\nLISTO. Respaldos guardados en: {directory}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCancelado.")
        sys.exit(130)
    except Exception as error:
        sys.exit(str(error))
