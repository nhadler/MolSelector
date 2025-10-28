# MolSelector

MolSelector is a lightweight web app for triaging molecular structures (`.xyz`, `.mol`, `.mol2`). Point the app at a folder of files, explore each molecule in an interactive 3D viewer powered by [3Dmol.js](https://3dmol.csb.pitt.edu/), and rapidly tag it as **accept** or **decline**. Decisions are written to `selection_results.csv` in the chosen folder so they can be versioned or analyzed later.

## Features

- Fast folder loading with support for `.xyz`, `.mol`, and `.mol2` files (non-recursive)
- Interactive 3D visualization using sticks and spheres with customizable styling
- Accept, decline, and back actions with mouse or keyboard shortcuts
- Native folder picker on macOS (AppleScript) and Tk-based picker on other platforms
- Automatic CSV logging with timestamps so you can stop and resume reviews anytime

## Requirements

- Python 3.12+
- A modern browser with WebGL support (Chrome, Firefox, Safari, Edge)

## Installation

Clone the repository and install the package in editable mode:

```bash
git clone https://github.com/your-account/molselector.git
cd molselector
python -m venv .venv
source .venv/bin/activate  # On Windows use .venv\Scripts\activate
pip install -e .
```

If you use [uv](https://github.com/astral-sh/uv):

```bash
uv sync
```

## Running the app

Start a local development server with the built-in CLI:

```bash
molselector launch --reload
```

Open your browser to `http://127.0.0.1:8000` and MolSelector will be ready. The CLI exposes options such as `--host`, `--port`, and `--log-level`; use `molselector launch --help` to view them. You can still start the app manually with `uvicorn molselector.app:app` if you prefer.

To preload a folder of molecules (skipping the manual selection step), supply the `--xyz-folder` option:

```bash
molselector launch --xyz-folder /path/to/molecules
```

The browser will automatically load that folder when the UI opens.

## Usage

1. Enter an absolute path to a folder containing `.xyz`, `.mol`, or `.mol2` files, or click **Browse…** to pick a folder using the native dialog.
2. MolSelector lists every supported file in the folder and loads the first unreviewed molecule in the embedded 3D viewer.
3. Inspect the structure, then use **Accept**, **Decline**, or **Back** to record your judgment. Decisions are saved instantly to `selection_results.csv` in the same folder.
4. Reloading the same folder restores previous decisions so you can resume where you left off.

### Keyboard shortcuts

- `Enter`, `A`, or `→`: accept the current molecule
- `D` or `←`: decline the current molecule
- `Backspace`, `B`, or `↑`: go back to the previous molecule

### Output format

The CSV file (`selection_results.csv`) contains three columns:

| column | description |
| --- | --- |
| `file` | Relative path to the molecule inside the selected folder |
| `decision` | Either `accept` or `decline` |
| `timestamp` | UTC timestamp recorded at the decision moment |

## Native folder picker notes

- **macOS**: Uses AppleScript (`osascript`). Ensure AppleScript is available (installed by default). If the picker fails, you can still paste a folder path manually.
- **Linux / Windows**: Falls back to Python's Tkinter dialog. If Tk is missing, install the `python3-tk` package (Linux) or add Tk during Python installation (Windows).

## Development

Install the dev tooling and run static checks:

```bash
pip install -e .
pip install ruff
ruff check .
```

When contributing code, consider adding tests or manual verification steps that cover your changes (e.g., folder loading edge cases, CSV persistence, keyboard shortcuts).

## Contributing

Contributions are welcome! If you have ideas for improvements—batch actions, recursive search, alternate viewers—open an issue or submit a pull request describing the change.

## License

MIT License

Copyright (c) 2025 Nicholas Hadler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
