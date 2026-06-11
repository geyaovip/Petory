#!/usr/bin/env python3
"""Remove background from an image using rembg. Requires: pip install rembg pillow"""
import sys
from pathlib import Path

def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: rembg_remove.py <input> <output>", file=sys.stderr)
        return 1

    try:
        from rembg import remove
    except ImportError:
        print(
            "rembg is not installed. Run: pip3 install rembg pillow onnxruntime",
            file=sys.stderr,
        )
        return 2

    inp = Path(sys.argv[1])
    out = Path(sys.argv[2])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(remove(inp.read_bytes()))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
