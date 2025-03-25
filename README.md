# LDX - Logging Developer Experience
A lightweight tool to enhance your development workflow by processing command output with customizable transformations.

## Features

- **Custom static transformations**: Define string patterns in your command output and replace them with custom messages.

- **Custom dynamic transformations**: Supports function-based transformations

- **Easy Integration**: Works seamlessly with any command-line tool or script.

- **Developer-Friendly**: Improves readability and reduces noise in logs.

## Installation
To install LDX globally, run:

```bash
pnpm install -g ldx
```

Alternatively, you can install it locally in your project:

```bash
pnpm install --save-dev ldx
```

## Usage

### 1. Create a Configuration File
  
Create a `ldx.config.js` file in your project's root directory. This file defines the patterns and transformations for your command output.

Example:

```js
module.exports = {
  // Simple string replacement
  "Test match 1": "✅ Test match 1 processed",
  
  // Function-based processing
  "Function match": (line) => `Processed: ${line}`,
};
```

### 2. Run Commands with LDX

Use LDX to run your commands and transform their output:

```bash
ldx <your-command>
```

For example:

```bash
ldx pnpm run dev
```

## Configuration Options

### String Matching

```js
module.exports = {
  "String contained in output line": "Replacement text for the entire line"
}
```

### Function Processing

```js
module.exports = {
  "String contained in output line": (line) => {
    // Custom processing logic
    return `Formatted: ${line}`;
  }
}
```

## Error Handling

- Missing configuration files

- Invalid configuration types

- Function processing errors

## Testing

Run tests with:

```bash
pnpm test
```
## Usage examples

### Basic Usage

```bash
ldx echo "Testing LDX tool"
```

### With package manager scripts

```bash
ldx pnpm run dev
```

### With complex commands

```bash
ldx docker-compose up
```
## Development

1. Clone the repository

2. Install dependencies:
    ```bash
      pnpm i
    ```

3. Make changes

4. Run tests:
    ```bash
      pnpm test
    ```

## Contributing

Contributions are welcome! Please open issues or pull requests in this repo.