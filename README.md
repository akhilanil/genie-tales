# Genie: AI-Powered Children's Story Generator

Genie is a command-line tool that generates custom children's stories using AI. It creates both story text and illustrations based on parameters like age range, theme, and character details.

## Features

- **Custom Story Generation**: Create unique stories tailored to specific age groups
- **Automatic Illustrations**: Generate matching illustrations for each page
- **Flexible Output**: Generate stories of different lengths and themes
- **Interactive Mode**: Guided input collection for story parameters
- **Video Export**: Combine text and illustrations into video with narration

## Installation

### Prerequisites

- Node.js 18 or higher
- pnpm package manager
- ffmpeg to create the video

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/genie-story-generator.git
   cd genie-story-generator
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file with your API keys (see [Configuration](#configuration))

4. Build the project:
   ```bash
   pnpm build
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# Model Provider API KEYS
OPENAI_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key_if_using_audio

# LLM PROVIDERS
STORY_LLM_PROVIDER=OPENAI|ANTHROPIC
ILLUSTRATION_LLM_PROVIDER=OPENAI

# Models to be used
STORY_LLM_MODEL_NAME=gpt-4o-2024-08-06
ILLUSTRATION_LLM_MODEL_NAME=dall-e-3

# Logging configs
LOG_TO_FILE=true
LOG_LEVEL=info
```

## Usage

### Basic Usage

Generate a story with the command:

```bash
pnpm start generate --age preschool --theme adventure --length medium --character "Luna"
```

### Interactive Mode

For a guided experience with prompts for all parameters:

```bash
pnpm start generate --interactive
```

## Examples

Generate a short fantasy story for preschoolers:

```bash
pnpm start generate --age preschool --theme fantasy --length short --character "Max"
```

Create a complete illustrated story:

```bash
pnpm start generate --interactive
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for GPT and DALL-E models
- Vercel for their AI SDK
- Elevenlabs for TTS