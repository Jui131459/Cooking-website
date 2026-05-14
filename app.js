/* ============================================
   Jui's Kitchen — App Logic
   Stores recipes in localStorage.
   Photos are compressed and stored as base64.
   ============================================ */

const STORAGE_KEY = 'juis-kitchen-recipes-v1';
const WALLPAPER_STORAGE_KEY = 'juis-kitchen-wallpaper-v1';
const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Drinks', 'Side'];
const WALLPAPER_PRESETS = [
  { id: 'lavender', label: 'Lavender Bloom', file: 'wallpapers/lavender.svg' },
  { id: 'roses',    label: 'Wild Roses',     file: 'wallpapers/roses.svg' },
  { id: 'sage',     label: 'Sage Garden',    file: 'wallpapers/sage.svg' },
  { id: 'lineart',  label: 'Line Art',       file: 'wallpapers/lineart.svg' },
];

const App = {
  recipes: [],
  activeFilter: 'All',
  editingId: null,
  pendingPhoto: null,
  wallpaperState: { id: 'lavender', custom: null },

  // ============ INIT ============
  init() {
    this.recipes = this.loadRecipes();
    this.initWallpaper();
    this.renderChips();
    this.render();
    this.attachKeyboard();
    document.getElementById('recipeCount').textContent = this.recipes.length;
  },

  // ============ STORAGE ============
  loadRecipes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load recipes:', e);
      return [];
    }
  },

  saveRecipes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.recipes));
      document.getElementById('recipeCount').textContent = this.recipes.length;
    } catch (e) {
      console.error('Failed to save:', e);
      this.toast('⚠️ Storage full — try removing a photo or clearing some recipes', 4000);
    }
  },

  // ============ RENDER ============
  renderChips() {
    const container = document.getElementById('filterChips');
    container.innerHTML = CATEGORIES.map(cat => `
      <button class="chip ${cat === this.activeFilter ? 'active' : ''}" onclick="App.setFilter('${cat}')">${cat}</button>
    `).join('');
  },

  setFilter(cat) {
    this.activeFilter = cat;
    this.renderChips();
    this.render();
  },

  render() {
    const grid = document.getElementById('recipeGrid');
    const emptyState = document.getElementById('emptyState');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    document.getElementById('clearSearch').classList.toggle('hidden', !search);

    // No recipes at all
    if (this.recipes.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      noResults.classList.add('hidden');
      resultsCount.textContent = '';
      return;
    }
    emptyState.classList.add('hidden');

    // Filter
    let filtered = this.recipes;
    if (this.activeFilter !== 'All') {
      filtered = filtered.filter(r => r.category === this.activeFilter);
    }
    if (search) {
      filtered = filtered.filter(r => {
        const haystack = [
          r.title, r.description, r.category, r.notes || '',
          ...(r.tags || []), ...(r.ingredients || [])
        ].join(' ').toLowerCase();
        return haystack.includes(search);
      });
    }

    // Sort: newest first
    filtered = [...filtered].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    resultsCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'recipe' : 'recipes'}`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      noResults.classList.remove('hidden');
      return;
    }
    noResults.classList.add('hidden');

    grid.innerHTML = filtered.map(r => this.cardHTML(r)).join('');
  },

  cardHTML(r) {
    const img = r.photo
      ? `<img src="${r.photo}" alt="${this.esc(r.title)}" loading="lazy" />`
      : `<div class="card-image-placeholder">${this.categoryEmoji(r.category)}</div>`;
    const totalTime = this.totalTime(r);
    return `
      <article class="recipe-card" onclick="App.viewRecipe('${r.id}')">
        <div class="card-image">
          ${img}
          <span class="card-category">${this.esc(r.category)}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${this.esc(r.title)}</h3>
          ${r.description ? `<p class="card-description">${this.esc(r.description)}</p>` : '<p class="card-description"> </p>'}
          <div class="card-meta">
            ${totalTime ? `<span class="card-meta-item">⏱ ${this.esc(totalTime)}</span>` : ''}
            ${r.servings ? `<span class="card-meta-item">🍽 ${this.esc(r.servings)}</span>` : ''}
            ${r.tags && r.tags.length ? `<span class="card-meta-item">🏷 ${r.tags.length}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  },

  totalTime(r) {
    if (r.prepTime && r.cookTime) return `${r.prepTime} + ${r.cookTime}`;
    return r.prepTime || r.cookTime || '';
  },

  categoryEmoji(cat) {
    const map = {
      Breakfast: '🥞', Lunch: '🥗', Dinner: '🍽️', Dessert: '🍰',
      Snack: '🍿', Drinks: '🥤', Side: '🥖'
    };
    return map[cat] || '🍴';
  },

  // ============ DETAIL VIEW ============
  viewRecipe(id) {
    const r = this.recipes.find(x => x.id === id);
    if (!r) return;
    const detail = document.getElementById('recipeDetail');

    const heroImg = r.photo
      ? `<img src="${r.photo}" alt="${this.esc(r.title)}" />`
      : `<div class="detail-hero-placeholder">${this.categoryEmoji(r.category)}</div>`;

    detail.innerHTML = `
      <div class="detail-hero">${heroImg}</div>
      <div class="detail-body">
        <span class="detail-category">${this.esc(r.category)}</span>
        <h1 class="detail-title">${this.esc(r.title)}</h1>
        ${r.description ? `<p class="detail-description">${this.esc(r.description)}</p>` : ''}

        <div class="detail-actions no-print">
          <button class="btn btn-ghost" onclick="window.print()">🖨️ Print</button>
          <button class="btn btn-ghost" onclick="App.editRecipe('${r.id}')">✎ Edit</button>
          <button class="btn btn-danger" onclick="App.deleteRecipe('${r.id}')">🗑 Delete</button>
        </div>

        ${(r.prepTime || r.cookTime || r.servings) ? `
          <div class="detail-stats">
            ${r.prepTime ? `<div class="stat"><div class="stat-label">Prep</div><div class="stat-value">${this.esc(r.prepTime)}</div></div>` : ''}
            ${r.cookTime ? `<div class="stat"><div class="stat-label">Cook</div><div class="stat-value">${this.esc(r.cookTime)}</div></div>` : ''}
            ${r.servings ? `<div class="stat"><div class="stat-label">Servings</div><div class="stat-value">${this.esc(r.servings)}</div></div>` : ''}
          </div>
        ` : ''}

        ${r.tags && r.tags.length ? `
          <div class="detail-tags">
            ${r.tags.map(t => `<span class="tag">${this.esc(t)}</span>`).join('')}
          </div>
        ` : ''}

        <div class="detail-section">
          <h3>Ingredients</h3>
          <ul class="ingredients-list">
            ${(r.ingredients || []).map(i => `<li>${this.esc(i)}</li>`).join('')}
          </ul>
        </div>

        <div class="detail-section">
          <h3>Instructions</h3>
          <ol class="steps-list">
            ${(r.steps || []).map(s => `<li>${this.esc(s)}</li>`).join('')}
          </ol>
        </div>

        ${r.notes ? `
          <div class="detail-section">
            <h3>Notes</h3>
            <div class="detail-notes">${this.esc(r.notes)}</div>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('detailView').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  goHome() {
    document.getElementById('detailView').classList.add('hidden');
    document.getElementById('homeView').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ============ MODAL / FORM ============
  openModal(recipe = null) {
    const form = document.getElementById('recipeForm');
    form.reset();
    this.pendingPhoto = null;
    this.editingId = null;
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('photoLabel').style.display = '';

    if (recipe) {
      this.editingId = recipe.id;
      document.getElementById('modalTitle').textContent = 'Edit recipe';
      document.getElementById('recipeId').value = recipe.id;
      document.getElementById('title').value = recipe.title || '';
      document.getElementById('description').value = recipe.description || '';
      document.getElementById('category').value = recipe.category || 'Dinner';
      document.getElementById('servings').value = recipe.servings || '';
      document.getElementById('prepTime').value = recipe.prepTime || '';
      document.getElementById('cookTime').value = recipe.cookTime || '';
      document.getElementById('tags').value = (recipe.tags || []).join(', ');
      document.getElementById('ingredients').value = (recipe.ingredients || []).join('\n');
      document.getElementById('steps').value = (recipe.steps || []).join('\n');
      document.getElementById('notes').value = recipe.notes || '';
      if (recipe.photo) {
        this.pendingPhoto = recipe.photo;
        document.getElementById('previewImg').src = recipe.photo;
        document.getElementById('photoPreview').classList.remove('hidden');
        document.getElementById('photoLabel').style.display = 'none';
      }
    } else {
      document.getElementById('modalTitle').textContent = 'Add a new recipe';
    }
    document.getElementById('modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('title').focus(), 100);
  },

  closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.body.style.overflow = '';
    this.pendingPhoto = null;
    this.editingId = null;
  },

  handleBackdrop(e) {
    if (e.target.id === 'modal') this.closeModal();
  },

  editRecipe(id) {
    const r = this.recipes.find(x => x.id === id);
    if (r) this.openModal(r);
  },

  deleteRecipe(id) {
    const r = this.recipes.find(x => x.id === id);
    if (!r) return;
    if (!confirm(`Delete "${r.title}"? This can't be undone.`)) return;
    this.recipes = this.recipes.filter(x => x.id !== id);
    this.saveRecipes();
    this.toast('Recipe deleted');
    this.goHome();
    this.render();
  },

  saveRecipe(e) {
    e.preventDefault();
    const ingredients = document.getElementById('ingredients').value
      .split('\n').map(s => s.trim()).filter(Boolean);
    const steps = document.getElementById('steps').value
      .split('\n').map(s => s.trim()).filter(Boolean);
    const tags = document.getElementById('tags').value
      .split(',').map(s => s.trim()).filter(Boolean);

    const recipe = {
      id: this.editingId || this.generateId(),
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      category: document.getElementById('category').value,
      servings: document.getElementById('servings').value.trim(),
      prepTime: document.getElementById('prepTime').value.trim(),
      cookTime: document.getElementById('cookTime').value.trim(),
      tags,
      ingredients,
      steps,
      notes: document.getElementById('notes').value.trim(),
      photo: this.pendingPhoto,
      createdAt: this.editingId
        ? this.recipes.find(x => x.id === this.editingId).createdAt
        : Date.now(),
      updatedAt: Date.now()
    };

    if (this.editingId) {
      this.recipes = this.recipes.map(x => x.id === this.editingId ? recipe : x);
      this.toast('Recipe updated');
    } else {
      this.recipes.push(recipe);
      this.toast('Recipe added');
    }
    this.saveRecipes();
    this.closeModal();
    this.render();
    if (this.editingId) this.viewRecipe(recipe.id);
  },

  // ============ PHOTO HANDLING ============
  async handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast('Please upload an image file');
      return;
    }
    try {
      const compressed = await this.compressImage(file);
      this.pendingPhoto = compressed;
      document.getElementById('previewImg').src = compressed;
      document.getElementById('photoPreview').classList.remove('hidden');
      document.getElementById('photoLabel').style.display = 'none';
    } catch (err) {
      console.error(err);
      this.toast('Could not process image');
    }
  },

  removePhoto() {
    this.pendingPhoto = null;
    document.getElementById('photo').value = '';
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('photoLabel').style.display = '';
  },

  compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // ============ EXPORT / IMPORT ============
  exportRecipes() {
    this.closeDropdown();
    if (this.recipes.length === 0) {
      this.toast('Nothing to export yet');
      return;
    }
    const data = JSON.stringify(this.recipes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `juis-kitchen-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast('Recipes exported');
  },

  importRecipes(e) {
    this.closeDropdown();
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error('Invalid format');
        const merge = confirm(`Import ${data.length} recipes?\n\nOK = merge with existing\nCancel = replace all`);
        if (merge) {
          // Merge by id (replace duplicates)
          const ids = new Set(this.recipes.map(r => r.id));
          data.forEach(r => {
            if (ids.has(r.id)) {
              this.recipes = this.recipes.map(x => x.id === r.id ? r : x);
            } else {
              this.recipes.push(r);
            }
          });
        } else {
          this.recipes = data;
        }
        this.saveRecipes();
        this.render();
        this.toast(`Imported ${data.length} recipes`);
      } catch (err) {
        console.error(err);
        this.toast('Could not read that file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  },

  clearAll() {
    this.closeDropdown();
    if (this.recipes.length === 0) {
      this.toast('Already empty');
      return;
    }
    if (!confirm(`Delete all ${this.recipes.length} recipes? Consider exporting first.`)) return;
    this.recipes = [];
    this.saveRecipes();
    this.render();
    this.toast('All recipes cleared');
  },

  loadStarter() {
    this.closeDropdown();
    if (this.recipes.length > 0) {
      if (!confirm('Add 3 sample recipes to your collection?')) return;
    }
    const now = Date.now();
    const samples = [
      {
        id: this.generateId(),
        title: 'Lavender Honey Cake',
        description: 'A delicate, fragrant cake with floral notes and golden honey — perfect with afternoon tea.',
        category: 'Dessert',
        servings: '8',
        prepTime: '20 min',
        cookTime: '40 min',
        tags: ['vegetarian', 'baking', 'tea-time'],
        ingredients: [
          '2 cups all-purpose flour',
          '1 tsp baking powder',
          '½ tsp baking soda',
          '¼ tsp salt',
          '1 tbsp dried culinary lavender',
          '¾ cup honey',
          '½ cup unsalted butter, softened',
          '½ cup sugar',
          '3 large eggs',
          '½ cup whole milk',
          '1 tsp vanilla extract'
        ],
        steps: [
          'Preheat oven to 350°F (175°C). Grease and flour a 9-inch round pan.',
          'In a small bowl, gently warm the honey and steep the lavender in it for 10 minutes.',
          'Whisk flour, baking powder, baking soda, and salt in a bowl.',
          'Cream butter and sugar until light and fluffy, about 3 minutes.',
          'Beat in eggs one at a time, then the strained honey and vanilla.',
          'Alternate folding in dry ingredients and milk, starting and ending with dry.',
          'Pour into pan and bake 35–40 minutes, until a toothpick comes out clean.',
          'Cool in pan for 10 minutes, then turn out onto a wire rack.'
        ],
        notes: 'Dust with powdered sugar or drizzle with extra honey. Lavender should be culinary grade — too much will taste soapy.',
        photo: null,
        createdAt: now - 30000,
        updatedAt: now - 30000
      },
      {
        id: this.generateId(),
        title: 'Creamy Mushroom Risotto',
        description: 'Slow-stirred arborio rice with woodsy mushrooms, white wine, and aged parmesan.',
        category: 'Dinner',
        servings: '4',
        prepTime: '10 min',
        cookTime: '35 min',
        tags: ['vegetarian', 'comfort food', 'italian'],
        ingredients: [
          '1½ cups arborio rice',
          '4 cups warm vegetable stock',
          '8 oz mixed mushrooms, sliced',
          '1 medium shallot, minced',
          '3 garlic cloves, minced',
          '½ cup dry white wine',
          '3 tbsp butter, divided',
          '2 tbsp olive oil',
          '½ cup grated parmesan',
          '2 tbsp fresh parsley, chopped',
          'Salt and black pepper to taste'
        ],
        steps: [
          'Heat olive oil and 1 tbsp butter in a wide pan. Sauté mushrooms until golden. Remove and set aside.',
          'Add remaining butter and sauté shallot until translucent, about 3 minutes.',
          'Add garlic and rice; stir to coat for 2 minutes until rice is glossy.',
          'Pour in wine and stir until absorbed.',
          'Add warm stock one ladle at a time, stirring frequently, waiting for absorption between additions.',
          'After about 18–20 minutes, when rice is creamy and al dente, fold in mushrooms and parmesan.',
          'Season with salt and pepper, top with parsley, and serve immediately.'
        ],
        notes: 'Keep the stock warm on the side — cold liquid stops the cooking. A splash of cream at the end makes it extra luxurious.',
        photo: null,
        createdAt: now - 20000,
        updatedAt: now - 20000
      },
      {
        id: this.generateId(),
        title: 'Morning Berry Smoothie Bowl',
        description: 'Thick, frosty, and topped with crunchy granola — the prettiest way to start the day.',
        category: 'Breakfast',
        servings: '2',
        prepTime: '5 min',
        cookTime: '',
        tags: ['healthy', 'quick', 'no-cook', 'vegan-friendly'],
        ingredients: [
          '2 frozen bananas',
          '1 cup frozen mixed berries',
          '½ cup Greek yogurt (or coconut yogurt)',
          '¼ cup milk of choice',
          '1 tbsp honey or maple syrup',
          'Toppings: granola, fresh berries, chia seeds, coconut flakes'
        ],
        steps: [
          'Add bananas, berries, yogurt, milk, and sweetener to a blender.',
          'Blend until thick and creamy, scraping down the sides as needed. Add more milk only if it won\'t blend.',
          'Pour into chilled bowls.',
          'Arrange toppings in pretty rows and serve immediately with a spoon.'
        ],
        notes: 'The trick to thickness is using frozen fruit and minimal liquid. Chill the bowls in the freezer 5 minutes before serving.',
        photo: null,
        createdAt: now - 10000,
        updatedAt: now - 10000
      }
    ];
    this.recipes.push(...samples);
    this.saveRecipes();
    this.render();
    this.toast('Sample recipes added');
  },

  // ============ WALLPAPER ============
  initWallpaper() {
    try {
      const raw = localStorage.getItem(WALLPAPER_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          this.wallpaperState = {
            id: saved.id || 'lavender',
            custom: saved.custom || null
          };
        }
      }
    } catch (e) {
      console.error('Failed to load wallpaper:', e);
    }
    this.applyWallpaper();
  },

  saveWallpaperState() {
    try {
      localStorage.setItem(WALLPAPER_STORAGE_KEY, JSON.stringify(this.wallpaperState));
    } catch (e) {
      console.error('Failed to save wallpaper:', e);
      this.toast('⚠️ Wallpaper too large to save — try a smaller image');
    }
  },

  applyWallpaper() {
    const root = document.documentElement;
    const { id, custom } = this.wallpaperState;
    let url, size = '240px 240px', repeat = 'repeat', attach = 'scroll', opacity = '0.55';

    if (id === 'none') {
      url = 'none';
    } else if (id === 'custom' && custom) {
      url = `url("${custom}")`;
      size = 'cover';
      repeat = 'no-repeat';
      attach = 'fixed';
      opacity = '0.42';
    } else {
      const preset = WALLPAPER_PRESETS.find(p => p.id === id) || WALLPAPER_PRESETS[0];
      url = `url('${preset.file}')`;
    }

    root.style.setProperty('--home-wallpaper', url);
    root.style.setProperty('--home-wallpaper-size', size);
    root.style.setProperty('--home-wallpaper-repeat', repeat);
    root.style.setProperty('--home-wallpaper-attach', attach);
    root.style.setProperty('--home-wallpaper-opacity', opacity);
  },

  openWallpaperPicker() {
    this.closeDropdown();
    this.renderWallpaperGrid();
    document.getElementById('wallpaperModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeWallpaperPicker() {
    document.getElementById('wallpaperModal').classList.add('hidden');
    document.body.style.overflow = '';
  },

  handleWallpaperBackdrop(e) {
    if (e.target.id === 'wallpaperModal') this.closeWallpaperPicker();
  },

  renderWallpaperGrid() {
    const grid = document.getElementById('wallpaperGrid');
    const cur = this.wallpaperState.id;

    const presetCards = WALLPAPER_PRESETS.map(p => `
      <button type="button" class="wallpaper-option ${cur === p.id ? 'active' : ''}" onclick="App.applyWallpaperById('${p.id}')">
        <div class="wallpaper-preview" style="background-image: url('${p.file}'); background-size: 120px 120px; background-repeat: repeat;"></div>
        <div class="wallpaper-label">${this.esc(p.label)}</div>
      </button>
    `).join('');

    const customCard = this.wallpaperState.custom ? `
      <button type="button" class="wallpaper-option ${cur === 'custom' ? 'active' : ''}" onclick="App.applyWallpaperById('custom')">
        <img class="wallpaper-preview-img" src="${this.wallpaperState.custom}" alt="Your wallpaper" />
        <div class="wallpaper-label">My image</div>
        <button type="button" class="wallpaper-remove-custom" onclick="event.stopPropagation(); App.removeCustomWallpaper()" aria-label="Remove uploaded image">×</button>
      </button>
    ` : '';

    const uploadCard = `
      <button type="button" class="wallpaper-option wallpaper-option-upload" onclick="document.getElementById('wallpaperFile').click()">
        <div class="wallpaper-preview-empty">＋</div>
        <div class="wallpaper-label">Upload image</div>
      </button>
    `;

    const noneCard = `
      <button type="button" class="wallpaper-option ${cur === 'none' ? 'active' : ''}" onclick="App.applyWallpaperById('none')">
        <div class="wallpaper-preview-empty">∅</div>
        <div class="wallpaper-label">No wallpaper</div>
      </button>
    `;

    grid.innerHTML = presetCards + customCard + uploadCard + noneCard;
  },

  applyWallpaperById(id) {
    if (id === 'custom' && !this.wallpaperState.custom) return;
    this.wallpaperState.id = id;
    this.saveWallpaperState();
    this.applyWallpaper();
    this.renderWallpaperGrid();
  },

  async handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast('Please upload an image file');
      return;
    }
    try {
      const compressed = await this.compressImage(file);
      this.wallpaperState.custom = compressed;
      this.wallpaperState.id = 'custom';
      this.saveWallpaperState();
      this.applyWallpaper();
      this.renderWallpaperGrid();
      this.toast('Wallpaper updated');
    } catch (err) {
      console.error(err);
      this.toast('Could not load that image');
    }
    e.target.value = '';
  },

  removeCustomWallpaper() {
    if (!confirm('Remove your uploaded wallpaper?')) return;
    this.wallpaperState.custom = null;
    if (this.wallpaperState.id === 'custom') {
      this.wallpaperState.id = 'lavender';
    }
    this.saveWallpaperState();
    this.applyWallpaper();
    this.renderWallpaperGrid();
    this.toast('Custom wallpaper removed');
  },

  // ============ DROPDOWN ============
  toggleMenu(e) {
    e.stopPropagation();
    const dd = document.getElementById('dropdown');
    dd.classList.toggle('hidden');
    if (!dd.classList.contains('hidden')) {
      setTimeout(() => {
        document.addEventListener('click', this.closeDropdownOnce, { once: true });
      }, 0);
    }
  },

  closeDropdownOnce() {
    document.getElementById('dropdown').classList.add('hidden');
  },

  closeDropdown() {
    document.getElementById('dropdown').classList.add('hidden');
  },

  clearSearch() {
    document.getElementById('searchInput').value = '';
    this.render();
  },

  // ============ KEYBOARD ============
  attachKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!document.getElementById('modal').classList.contains('hidden')) {
          this.closeModal();
        } else if (!document.getElementById('wallpaperModal').classList.contains('hidden')) {
          this.closeWallpaperPicker();
        } else if (!document.getElementById('detailView').classList.contains('hidden')) {
          this.goHome();
        }
      }
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!document.getElementById('homeView').classList.contains('hidden')) {
          document.getElementById('searchInput').focus();
        }
      }
    });
  },

  // ============ TOAST ============
  toast(msg, duration = 2400) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.classList.add('hidden'), 300);
    }, duration);
  },

  // ============ UTILS ============
  generateId() {
    return 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
