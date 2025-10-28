# C Lenga Language Extension

A Visual Studio Code extension that provides Lenga support for the C programming language, offering advanced code visualization, transpilation capabilities, and an interactive development environment.

## Getting Started

You will need to have the [Lenga Server](https://github.com/lengalabs/lenga) installed to proceed.

### Prerequisites

- Visual Studio Code 1.101.0 or higher
- Lenga transpiler and lenga-server

## Features

### 🔄 **Bi-directional Transpilation**

- Convert C files to Lenga format (`.c` → `.c.lenga`) and back (`.lenga` → `.c`).

### 📊 **c.lenga File Editor With Dual View Modes**

- **Structured View**: Familiar-looking code editor with hierarchical structure representation
- **Graph View**: Function call graph visualization
- Smart toggle between views with contextual button display
- Keyboard shortcuts for quick view switching

- Dedicated custom editor for `.lenga` files
- Interactive node editing capabilities
- Real-time syntax validation and error reporting
- Debug mode with detailed execution information

## Release Notes

### 0.0.1

Initial release of C Lenga Language Extension

- Bi-directional transpilation between C and Lenga formats
- Dual view modes (structured and graph visualization)
- Custom editor for interactive Lenga file editing
- Language server integration for code analysis
- Keyboard shortcuts and toolbar integration

## Attributions

### Icon

Image was cropped from a [photograph](https://commons.wikimedia.org/wiki/File:Nothofagus_pumilio-general_view_01.JPG) published by [Gagea](https://commons.wikimedia.org/wiki/User:Gagea) under [Creative Commons](https://en.wikipedia.org/wiki/en:Creative_Commons) Attribution-Share Alike [3.0 Unported](https://creativecommons.org/licenses/by-sa/3.0/deed.en), [2.5 Generic](https://creativecommons.org/licenses/by-sa/2.5/deed.en), [2.0 Generic](https://creativecommons.org/licenses/by-sa/2.0/deed.en) and [1.0 Generic](https://creativecommons.org/licenses/by-sa/1.0/deed.en) license.

## License

This project is licensed under the MIT License, excluding:

- images/icon.png

See the [LICENSE](LICENSE) file for details.
