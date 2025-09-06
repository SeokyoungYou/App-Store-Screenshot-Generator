# App Store Screenshot Generator
![Sep-05-2025 23-00-25](https://github.com/user-attachments/assets/936ecf44-21ad-41bd-b2b6-28b7c1b986ba)



This web application leverages Google's Gemini AI to generate professional-grade App Store screenshots. Users can upload their app UI screenshots, describe key features, and let the AI create marketing images complete with premium gradient backgrounds and compelling text overlays. The final output is designed to be compliant with App Store policies.

## Key Features

-   **AI-Powered Design**: Uses Gemini to generate stunning, high-resolution promotional images.
-   **AI Text Generation**: Automatically creates compelling headlines and sub-headlines from feature descriptions.
-   **Customization**: Allows users to specify output resolution and background colors.
-   **Policy Compliant**: Designed to create screenshots that adhere to App Store guidelines.
-   **User-Friendly Interface**: A simple, step-by-step process of uploading, describing, customizing, and generating.
-   **Device Presets**: Easy-to-use presets for common iPhone and iPad sizes, plus standard aspect ratios.
-   **Drag & Drop**: Supports drag-and-drop for easy image uploading.

## How It Works

1.  **Upload Screenshot**: Upload or drag-and-drop an existing app screenshot (PNG, JPG, etc.).
2.  **Describe the Feature**: Write a brief description of the feature shown in the screenshot.
3.  **Generate Text (Optional)**: Click "Generate Text" to have the AI create a headline and sub-headline, or write your own.
4.  **Customize Background (Optional)**: Set a specific solid color to theme the gradient. If left blank, the AI will choose an optimal color based on your UI.
5.  **Select Size**: Choose a preset device size or enter a custom resolution.
6.  **Generate**: Click "Generate Screenshot" and wait for the AI to create the image.
7.  **Download**: Download the finished PNG image.

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **AI Model**: Google Gemini API (`gemini-2.5-flash-image-preview` and `gemini-2.5-flash`)

## Running Locally

This application runs directly in the browser and requires no build step.

1.  **Download Files**: Download all project files to a single folder on your computer.
2.  **Set API Key**: This project requires access to a Google Gemini API key via the `process.env.API_KEY` environment variable. You must ensure this variable is set in your execution environment.
3.  **Run a Local Server**: From the project directory, run a simple HTTP server. If you have Python installed, you can use:
    ```bash
    python -m http.server
    ```
    Or if you have Node.js, you can use `serve`:
    ```bash
    npx serve
    ```
4.  **Open in Browser**: Open your browser and navigate to the local server address (e.g., `http://localhost:8000`) to see the application.

## File Structure

```
.
├── index.html              # The main HTML entry point for the application
├── index.tsx               # The main TypeScript file that renders the React application
├── App.tsx                 # The root React component, defines the layout
├── metadata.json           # App metadata
├── components/             # All reusable React components
│   ├── Button.tsx
│   ├── ColorInput.tsx
│   ├── GeneratedImage.tsx
│   ├── ImageInput.tsx
│   ├── ScreenshotGenerator.tsx # Core UI and state management logic
│   ├── SelectInput.tsx
│   ├── Spinner.tsx
│   ├── TextAreaInput.tsx
│   └── TextInput.tsx
├── services/               # Logic for communicating with external services
│   ├── geminiService.ts    # Functions for interacting with the Google Gemini API
│   └── storeService.ts     # Mock service for scraping app store data
└── utils/                  # Utility and helper functions
    └── imageUtils.ts       # Image-related helpers (e.g., URL to base64)
```
