import os
import hashlib

def find_duplicate_files(directory):
    hashes = {}
    duplicates = []
    for dirpath, _, filenames in os.walk(directory):
        for filename in filenames:
            path = os.path.join(dirpath, filename)
            try:
                with open(path, 'rb') as f:
                    file_hash = hashlib.sha256(f.read()).hexdigest()
                if file_hash in hashes:
                    duplicates.append((hashes[file_hash], path))
                else:
                    hashes[file_hash] = path
            except IOError as e:
                print(f"Could not read file {path}: {e}")
    return duplicates

duplicates = find_duplicate_files(r'c:\Users\Manish\hh_foundation\src\components\dashboard')

if not duplicates:
    print("No duplicate files found.")
else:
    print("| Original File | Duplicate File(s) |")
    print("|---|---|")
    for original, duplicate in duplicates:
        print(f"| {original} | {duplicate} |")
