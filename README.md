# Understand AI

> **See it. Understand it. Text it.**

Understand AI is an AI-powered text recognition application that converts **handwritten text from images into clear digital text** using Google Gemini AI.

Users can upload an image from their gallery or capture an image using their camera. The application analyzes the image and extracts the handwritten content into editable digital text.

---

## Features

### Image Input

* Capture an image using the device camera
* Upload an image from the gallery
* Process handwritten text from images

### Text Recognition

* Convert handwritten text into digital text
* AI-powered handwriting recognition using Google Gemini
* Generate clear and editable text from images

### Translation

The extracted text can be displayed in:

* Original language
* Hindi
* Telugu

### Text Customization

* Adjust font size
* Apply bold formatting
* Copy the extracted text

### Responsive Design

* Mobile-friendly interface
* Simple and easy-to-use design
* Works across different screen sizes

---

## Technology Stack

* **Frontend:** React
* **Build Tool:** Vite
* **Language:** JavaScript
* **Styling:** CSS
* **AI:** Google Gemini API
* **Deployment:** Vercel

---

## How It Works

```text id="8j2k9p"
Upload Image / Capture Image
            |
            v
       Understand AI
            |
            v
       Google Gemini
            |
            v
   Handwritten Text Recognition
            |
            v
      Digital Text Output
            |
            v
   Translate / Copy / Customize
```

---

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

### 1. Clone the Repository

```bash id="5b7q3m"
git clone <your-repository-url>
```

### 2. Navigate to the Project

```bash id="m2h9k4"
cd understand-ai
```

### 3. Install Dependencies

```bash id="j4q8wp"
npm install
```

### 4. Configure the Gemini API

Create a `.env` file in the project root and add your Gemini API key.

```env id="n8k3ds"
VITE_GEMINI_API_KEY=your_api_key
```

Do not upload your API key or `.env` file to GitHub.

### 5. Run the Development Server

```bash id="x7m2qa"
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

## Purpose

Understand AI is designed to make handwritten content easier to **read, digitize, translate, and reuse** with the help of artificial intelligence.

The application can be useful for students, handwritten notes, documents, and other text-based images.

---

## Future Improvements

Planned improvements include:

* Improved handwriting recognition
* Support for additional languages
* PDF support
* Download extracted text
* Improved image processing
* Additional text customization options

---

## License

This project is developed for educational and demonstration purposes.

---

## Understand AI

**See it. Understand it. Text it.**
