import argparse

from .http_api import serve


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the networkmatt local simulation UI")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("--port must be between 1024 and 65535")
    serve(args.port)


if __name__ == "__main__":
    main()
