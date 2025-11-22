# ClearView AI - Watermark Remover

A professional AI-powered tool to remove watermarks from photos and reconstruct clean videos using Gemini and Veo models.

## Features

- **Photo Cleaning**: Batch processing of images to remove watermarks, text, and logos using Gemini 2.5 Flash.
- **Video Reconstruction**: Generate clean, high-resolution video reconstructions from reference frames using Veo 3.1.
- **Comparison View**: Interactive before/after slider with zoom controls.
- **Secure**: API Keys are handled via the Google AI Studio environment or local .env configuration.

## Local Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_google_genai_api_key
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    ```bash
    npm run build
    ```

## Technologies

- React 18
- Vite
- Tailwind CSS
- Google GenAI SDK (@google/genai)
- Lucide React Icons
