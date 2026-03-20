import pytest
import pandas as pd
import os
from core.parsers import process_file

def test_per_file_message_limit():
    # Create a large dummy file (50,001 messages)
    large_file_path = "large_test_chat.txt"
    with open(large_file_path, "w") as f:
        for i in range(50001):
            f.write(f"01/01/2023, 12:{i%60:02d} - Rahul: message {i}\n")

    try:
        with pytest.raises(ValueError) as excinfo:
            process_file(large_file_path, "Rahul", "Priya")
        assert "Maximum 50,000 allowed per file" in str(excinfo.value)
    finally:
        if os.path.exists(large_file_path):
            os.remove(large_file_path)

def test_normal_file_passes_limit():
    # Create a normal dummy file (10 messages)
    normal_file_path = "normal_test_chat.txt"
    with open(normal_file_path, "w") as f:
        for i in range(10):
            f.write(f"01/01/2023, 12:{i:02d} - Rahul: message {i}\n")
            f.write(f"01/01/2023, 12:{i:02d} - Priya: reply {i}\n")

    try:
        df = process_file(normal_file_path, "Rahul", "Priya")
        assert not df.empty
        assert len(df) == 20
    finally:
        if os.path.exists(normal_file_path):
            os.remove(normal_file_path)
