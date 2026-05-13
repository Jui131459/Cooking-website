# 🍴 Jui's Kitchen

A personal cooking recipe website with a soft purple aesthetic. Add your own recipes with photos, search and filter your collection, edit and print your favorites — all from a single, fast, static site.

## ✨ Features

- **Add, edit, and delete recipes** with photos, ingredients, step-by-step instructions, tags, prep/cook time, and personal notes
- **Photo uploads** — images are automatically compressed and stored with each recipe
- **Search** by name, ingredient, tag, or any text in the recipe
- **Filter by category** — Breakfast, Lunch, Dinner, Dessert, Snack, Drinks, Side
- **Print-friendly view** — a clean printable layout for each recipe
- **Export / import** your collection as a JSON file (so you can back it up or move it between devices)
- **Soft purple aesthetic** with Playfair Display serif headings and a calm, elegant palette
- **Fully responsive** — looks great on phone, tablet, and desktop
- **No backend required** — runs entirely in the browser using localStorage

## 🛠 Tech

Plain HTML, CSS, and vanilla JavaScript. Zero build step. Zero dependencies. Just open `index.html` and it works.

## 📂 Files

```
Cooking Website/
├── index.html      # Page structure & views
├── styles.css      # Soft purple styling
├── app.js          # All app logic (storage, render, forms)
├── README.md       # You are here
└── .gitignore
```

## 🚀 Deploy to GitHub Pages

The git repo is already initialized and committed. You just need to (1) create the GitHub repo, then (2) push.

### Step 1 — Create the repo on GitHub

1. Go to [github.com/new](https://github.com/new) (sign in as `Jui131459` if you aren't already)
2. Repository name: **`cooking-website`**
3. Make sure it's set to **Public** (required for free GitHub Pages)
4. **Leave** "Add a README" / .gitignore / license **unchecked** — this folder already has those
5. Click **Create repository**

### Step 2 — Push your folder

The remote is already configured. Open Terminal and run:

```bash
cd "/Users/jui/Documents/Cooking Website"
git push -u origin main
```

If this is your first time pushing to GitHub on this Mac, you'll be prompted to sign in. The easiest way is to use a Personal Access Token as the password:
- Go to [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (classic)
- Give it a name, check the **`repo`** scope, click Generate
- Copy the token and paste it when Terminal asks for your password

### Step 3 — Turn on GitHub Pages

1. Open your new repo: [github.com/Jui131459/cooking-website](https://github.com/Jui131459/cooking-website)
2. Click **Settings** (top tabs)
3. In the left sidebar, click **Pages**
4. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `main` / `(root)`
5. Click **Save**

Within ~30 seconds, your site will be live at:

```
https://jui131459.github.io/cooking-website/
```

GitHub Pages will show the URL at the top of the Pages settings once it's ready.

### Future updates

After making changes locally, push them with:

```bash
git add .
git commit -m "Describe what you changed"
git push
```

The live site updates within a minute or two.

## 💡 How recipes are stored

Recipes live in your browser's `localStorage`. This means:

- ✅ They're saved instantly and persist between visits
- ✅ No server, no costs, no accounts
- ⚠️ They are **per-device, per-browser**. Recipes you add on your laptop won't show up on your phone automatically.

**To move recipes between devices** (or back them up), use the menu (•••) in the header:

- **Export recipes (JSON)** — downloads a backup file
- **Import recipes** — load that file on another device

## 🎨 Customization

- **Site title** — edit the `<title>` and `.brand-title` in `index.html`
- **Colors** — change the CSS variables at the top of `styles.css` (look for `:root`)
- **Categories** — edit the `CATEGORIES` array near the top of `app.js`
- **Footer** — edit the `<footer>` in `index.html`

## ⌨️ Shortcuts

- `Cmd/Ctrl + K` — focus the search bar
- `Esc` — close modal or return to home

---

Made with care. Cook with love.
