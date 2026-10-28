import os
import zipfile

def make_clean_zip(source_dir, output_zip_path):
    exclude_dirs = {
        'node_modules',
        '.next',
        '__pycache__',
        '.pytest_cache',
        '.git',
        '.venv',
        'venv',
        '.turbo'
    }
    exclude_files = {
        '.DS_Store',
        'Thumbs.db'
    }
    
    print(f"Creating clean zip archive at: {output_zip_path}...")
    file_count = 0
    total_uncompressed_bytes = 0
    
    with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(source_dir):
            # prune excluded dirs
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.next')]
            
            for f in files:
                if f in exclude_files or f.endswith('.pyc') or f.endswith('.pyo'):
                    continue
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, os.path.dirname(source_dir))
                
                zf.write(full_path, rel_path)
                file_count += 1
                total_uncompressed_bytes += os.path.getsize(full_path)
                
    zip_size = os.path.getsize(output_zip_path)
    print(f"Successfully packaged {file_count} files.")
    print(f"Compressed size: {zip_size / (1024*1024):.2f} MB (Uncompressed: {total_uncompressed_bytes / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    src = r"C:\Users\abhin\Downloads\namade-kadda"
    out1 = r"C:\Users\abhin\Downloads\NAMADE-KADDA.zip"
    out2 = r"C:\Users\abhin\.gemini\antigravity\scratch\NAMADE-KADDA.zip"
    
    make_clean_zip(src, out1)
    
    # Also write to scratch dir
    os.makedirs(os.path.dirname(out2), exist_ok=True)
    import shutil
    shutil.copyfile(out1, out2)
    print(f"Also copied to: {out2}")
