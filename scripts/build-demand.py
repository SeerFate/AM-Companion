"""Build public/demands.bin.gz from the published AM4 route table.

The gzip payload is a little-endian sequence of uint16 economy, business, and
first demand for every undirected airport pair. Pair order matches
routePairIndex in lib/am4.ts, and airport order matches data/airports.json.
"""

import gzip
import json
import sys
from pathlib import Path

import duckdb
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
AIRPORTS = ROOT / "data" / "airports.json"
OUT = ROOT / "public" / "demands.bin.gz"


def sql_string(path: str) -> str:
    return Path(path).resolve().as_posix().replace("'", "''")


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: build-demand.py airports.parquet routes.parquet")
    airport_parquet, route_parquet = sys.argv[1:]
    local = json.loads(AIRPORTS.read_text(encoding="utf-8"))
    published = duckdb.sql(
        f"select icao from read_parquet('{sql_string(airport_parquet)}')"
    ).fetchall()
    local_icao = [row["icao"] for row in local]
    published_icao = [row[0] for row in published]
    if local_icao != published_icao:
        raise SystemExit("airport order does not match the published list")
    n = len(local_icao)
    pairs = n * (n - 1) // 2
    columns = duckdb.sql(
        f"""
        select yd, jd, fd
        from read_parquet('{sql_string(route_parquet)}')
        """
    ).fetchnumpy()
    if len(columns["yd"]) != pairs:
        raise SystemExit(f"expected {pairs} routes, got {len(columns['yd'])}")
    packed = np.ascontiguousarray(
        np.stack((columns["yd"], columns["jd"], columns["fd"]), axis=1).astype("<u2")
    )
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_bytes(gzip.compress(packed.tobytes(), compresslevel=9))
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes, {pairs} pairs)")


if __name__ == "__main__":
    main()
