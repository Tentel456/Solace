
import argparse
import json
import sys
from pathlib import Path

from faster_whisper import WhisperModel


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Locally transcribe audio chunks with faster-whisper."
    )
    parser.add_argument(
        "files",
        nargs="+",
        help="Audio chunk paths in chronological order.",
    )
    parser.add_argument(
        "--chunk-seconds",
        type=int,
        default=600,
        help="Duration of each chunk in seconds.",
    )
    parser.add_argument(
        "--model",
        default="small",
        choices=["tiny", "base", "small", "medium"],
        help="Whisper model size.",
    )
    parser.add_argument(
        "--language",
        default=None,
        help="Optional language code, e.g. ru or en.",
    )
    return parser.parse_args()


def transcribe_files(args):
    model = WhisperModel(
        args.model,
        device="cpu",
        compute_type="int8",
    )

    results = []
    position = 0

    for index, file_name in enumerate(args.files):
        file_path = Path(file_name)

        if not file_path.is_file():
            raise FileNotFoundError(
                f"Audio file does not exist: {file_path}"
            )

        offset_ms = index * args.chunk_seconds * 1000

        print(
            f"Transcribing {index + 1}/{len(args.files)}: {file_path.name}",
            file=sys.stderr,
            flush=True,
        )

        segments, _ = model.transcribe(
            str(file_path),
            language=args.language,
            beam_size=3,
            vad_filter=True,
        )

        for segment in segments:
            text = segment.text.strip()

            if not text:
                continue

            start_ms = offset_ms + round(segment.start * 1000)
            end_ms = max(
                start_ms + 1,
                offset_ms + round(segment.end * 1000),
            )

            results.append(
                {
                    "position": position,
                    "startMs": start_ms,
                    "endMs": end_ms,
                    "text": text,
                }
            )
            position += 1

    return results


def main():
    args = parse_arguments()

    if args.chunk_seconds <= 0:
        raise ValueError("--chunk-seconds must be positive.")

    transcript = transcribe_files(args)

    print(json.dumps(transcript, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Transcription failed: {error}", file=sys.stderr)
        sys.exit(1)
