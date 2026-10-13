import hashlib
import json
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as package:
    entries = [i for i in package.infolist() if not i.is_dir()]
    names = [i.filename for i in entries]
    if len(names) != len(set(names)) or any(n.startswith('/') or '..' in n.split('/') for n in names):
        raise ValueError('UNSAFE_ZIP')
    if sum(i.file_size for i in entries) > 256 * 1024 * 1024:
        raise ValueError('ZIP_SIZE_BOUND_EXCEEDED')
    print(json.dumps({i.filename: hashlib.sha256(package.read(i)).hexdigest() for i in entries}, separators=(',', ':')))
