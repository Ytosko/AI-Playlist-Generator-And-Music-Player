# 🎧 Ytosko's Groove

**Ytosko's Groove**: Your personal AI DJ. Describe any mood, genre, or vibe, and let our AI generate the perfect custom playlist and album art for you. Discover and create music like never before.

🌐 **Live Demo**: [https://music.ytosko.ix.tc/](https://music.ytosko.ix.tc/)

---

## 🚀 Features

- 🎶 Generate AI-powered music playlists based on mood, genre, or vibe
- 🖼️ Automatically generate custom album art using AI
- 💾 Works offline using IndexedDB for data storage
- ⚡ Built with React 19 and Vite 6 for speed and simplicity
- 🔐 Gemini AI integration via secure API key

---

## 🧪 Tech Stack

- [React](https://reactjs.org/) 19  
- [Vite](https://vitejs.dev/) 6  
- [Gemini AI](https://aistudio.google.com/app/apikey) (`@google/genai`)  
- [idb](https://www.npmjs.com/package/idb) (IndexedDB wrapper)  
- [TypeScript](https://www.typescriptlang.org/)

---

## 📦 Getting Started

### 🔧 Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A [Gemini API key](https://aistudio.google.com/app/apikey)

---

## 💻 Run Locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/ytosko-groove.git
   cd ytosko-groove
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env.local` file and add your Gemini API key:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

   
   **📺 YouTube API Setup**

   To enhance functionality with YouTube data, you'll need a RapidAPI key for the **YouTube v3 Alternative API**. Follow these steps:

   1. **Sign up at RapidAPI:**  
      👉 [https://rapidapi.com/auth/sign-up](https://rapidapi.com/auth/sign-up)

   2. **Visit the API page:**  
      👉 [YouTube v3 Alternative API](https://rapidapi.com/ytdlfree/api/youtube-v3-alternative)

   3. **Subscribe to the API:**  
      Click the **Subscribe to Test** button (No credit card required).

   4. **Get your API key:**  
      On the API's endpoint page, look at the code examples on the right. Find the header named `x-rapidapi-key`.

   5. **Copy your key**  
      This is a long string next to `x-rapidapi-key`.

   6. **Add the key to your project:**  
      Open `/services/youtubeService.ts` and paste the API key where it's needed.

   ---


4. **Start the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔨 Build for Production

To generate a production-ready build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 🌐 Deployment

You can deploy this app to any static hosting provider such as:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [GitHub Pages](https://pages.github.com/)

After building, upload the `dist/` folder to your host.

**Live Version** is hosted at:  
🔗 [https://music.ytosko.ix.tc/](https://music.ytosko.ix.tc/)

---

## 📜 Metadata

```json
{
  "name": "Ytosko's Groove",
  "description": "Ytosko's Groove: Your personal AI DJ. Describe any mood, genre, or vibe, and let our AI generate the perfect custom playlist and album art for you. Discover and create music like never before.",
  "requestFramePermissions": []
}
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
---

