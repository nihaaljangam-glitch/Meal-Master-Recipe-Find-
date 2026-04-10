
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
let state = {
    favorites: JSON.parse(localStorage.getItem('mealMasterFavorites')) || [],
    shoppingList: JSON.parse(localStorage.getItem('mealMasterShopping')) || [],
    currentView: 'home',
    allMeals: [],
    theme: localStorage.getItem('mealMasterTheme') || 'light',
};


const elements = {
    nav: {
        home: document.getElementById('nav-home'),
        favorites: document.getElementById('nav-favorites'),
        shopping: document.getElementById('nav-shopping'),
        shoppingBadge: document.getElementById('shopping-badge'),
        themeToggle: document.getElementById('theme-toggle'),
    },
    views: {
        home: document.getElementById('view-home'),
        favorites: document.getElementById('view-favorites'),
        shopping: document.getElementById('view-shopping'),
    },
    search: {
        input: document.getElementById('search-input'),
        type: document.getElementById('search-type'),
        category: document.getElementById('diet-filter'),
        sort: document.getElementById('sort-filter'),
        btn: document.getElementById('search-btn'),
    },
    grids: {
        home: document.getElementById('recipe-grid'),
        favorites: document.getElementById('favorites-grid'),
    },
    shopping: {
        recipeList: document.getElementById('shopping-recipes-list'),
        ingredientList: document.getElementById('shopping-ingredients-list'),
        clearBtn: document.getElementById('clear-shopping-btn'),
        noShoppingMsg: document.getElementById('no-shopping-msg'),
    },
    modal: {
        overlay: document.getElementById('recipe-modal'),
        body: document.getElementById('modal-body'),
        closeBtn: document.getElementById('close-modal'),
    },
    utils: {
        loading: document.getElementById('loading-indicator'),
        noResultsMsg: document.getElementById('no-results-msg'),
        noFavoritesMsg: document.getElementById('no-favorites-msg'),
        toast: document.getElementById('toast'),
    }
};

async function init() {
    applyTheme(state.theme);
    bindEvents();
    updateBadges();
    await fetchCategories();
    renderFavorites();
    renderShoppingList();
    await fetchInitialDataset();
}

async function fetchInitialDataset() {
    showLoading();
    try {
        const letters = ['b', 'c', 'p', 's', 'm'];
        const results = await Promise.all(
            letters.map(l => fetch(`${API_BASE_URL}/search.php?s=${l}`).then(r => r.json()))
        );
        state.allMeals = results
            .reduce((acc, curr) => curr.meals ? acc.concat(curr.meals) : acc, [])
            .reduce((acc, meal) => {
                if (!acc.find(m => m.idMeal === meal.idMeal)) acc.push(meal);
                return acc;
            }, []);
        
        applyFilters();
    } catch (e) {
        showError();
    }
    hideLoading();
}


function bindEvents() {

    elements.nav.home.addEventListener('click', () => switchView('home'));
    elements.nav.favorites.addEventListener('click', () => switchView('favorites'));
    elements.nav.shopping.addEventListener('click', () => switchView('shopping'));

    elements.nav.themeToggle.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('mealMasterTheme', state.theme);
        applyTheme(state.theme);
    });

    elements.search.btn.addEventListener('click', () => {
        elements.search.input.value = '';
        elements.search.type.value = 'name';
        elements.search.category.value = '';
        elements.search.sort.value = 'default';
        applyFilters();
    });

    elements.search.input.addEventListener('input', debounce(applyFilters, 300));
    elements.search.type.addEventListener('change', applyFilters);
    elements.search.category.addEventListener('change', applyFilters);
    elements.search.sort.addEventListener('change', applyFilters);


    elements.modal.closeBtn.addEventListener('click', closeModal);
    elements.modal.overlay.addEventListener('click', (e) => {
        if (e.target === elements.modal.overlay) closeModal();
    });


    elements.shopping.clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your shopping list?')) {
            state.shoppingList = [];
            saveState();
            renderShoppingList();
            showToast('Shopping list cleared');
        }
    });

    // Event Delegation for Shopping List
    elements.shopping.recipeList.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-shopping-btn');
        if (!btn) return;

        const card = btn.parentElement;
        const mealId = btn.dataset.id;
        const meal = state.shoppingList.find(m => m.idMeal === mealId);

        if (meal) {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                toggleShoppingList(meal, null);
            }, 300);
        }
    });

    // Event Delegation for Grids
    [elements.grids.home, elements.grids.favorites].forEach(grid => {
        grid.addEventListener('click', async (e) => {
            const card = e.target.closest('.recipe-card');
            if (!card) return;

            const mealId = card.querySelector('.view-recipe-btn').dataset.id;
            const actionBtn = e.target.closest('button');
            
            if (!actionBtn) return;

            if (actionBtn.classList.contains('view-recipe-btn')) {
                fetchRecipeDetails(mealId);
            } else if (actionBtn.classList.contains('heart')) {
                const meal = state.allMeals.find(m => m.idMeal === mealId) || state.favorites.find(m => m.idMeal === mealId);
                const fullMeal = meal?.strInstructions ? meal : await getFullRecipe(mealId);
                toggleFavorite(fullMeal, actionBtn);
            } else if (actionBtn.classList.contains('list')) {
                const meal = state.allMeals.find(m => m.idMeal === mealId) || state.favorites.find(m => m.idMeal === mealId);
                const fullMeal = meal?.strInstructions ? meal : await getFullRecipe(mealId);
                toggleShoppingList(fullMeal, actionBtn);
            }
        });
    });
}


function switchView(viewName) {
    state.currentView = viewName;


    Object.keys(elements.nav).forEach(k => {
        if (elements.nav[k] && elements.nav[k].classList) {
            elements.nav[k].classList.remove('active');
        }
    });
    if (elements.nav[viewName]) elements.nav[viewName].classList.add('active');


    Object.keys(elements.views).forEach(k => {
        elements.views[k].classList.add('hidden');
        elements.views[k].classList.remove('active');
    });
    elements.views[viewName].classList.remove('hidden');
    elements.views[viewName].classList.add('active');

    if (viewName === 'favorites') renderFavorites();
    if (viewName === 'shopping') renderShoppingList();
}


async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/categories.php`);
        const data = await res.json();

        const fragment = document.createDocumentFragment();

        data.categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.strCategory;
            opt.textContent = cat.strCategory;
            fragment.appendChild(opt);
        });
        elements.search.category.appendChild(fragment);
    } catch (e) {
        console.error('Failed to fetch categories', e);
    }
}

function applyFilters() {
    if (state.currentView !== 'home') return;
    
    let filtered = state.allMeals;

    const query = elements.search.input.value.trim().toLowerCase();
    const type = elements.search.type.value;

    filtered = filtered.filter(meal => {
        if (!query) return true;
        if (type === 'name') {
            return meal.strMeal.toLowerCase().includes(query);
        } else if (type === 'ingredient') {
            const ings = getIngredientsList(meal);
            return ings.some(ing => ing.ingredient.toLowerCase().includes(query));
        }
        return true;
    });

    const category = elements.search.category.value;
    filtered = filtered.filter(meal => {
        if (!category) return true;
        return meal.strCategory === category;
    });

    const sortVal = elements.search.sort.value;
    filtered = filtered.map(m => m).sort((a, b) => {
        if (sortVal === 'name-asc') {
            return a.strMeal.localeCompare(b.strMeal);
        } else if (sortVal === 'name-desc') {
            return b.strMeal.localeCompare(a.strMeal);
        }
        return 0;
    });

    renderRecipeGrid(filtered, elements.grids.home);
}

async function fetchRecipeDetails(id) {
    showLoading();
    try {
        const res = await fetch(`${API_BASE_URL}/lookup.php?i=${id}`);
        const data = await res.json();
        if (data.meals && data.meals.length > 0) {
            renderModal(data.meals[0]);
        }
    } catch (e) {
        showToast('Failed to load recipe details');
    }
    hideLoading();
}


function renderRecipeGrid(meals, container) {
    container.innerHTML = '';
    elements.utils.noResultsMsg.classList.add('hidden');

    if (!meals || meals.length === 0) {
        if (container === elements.grids.home) {
            elements.utils.noResultsMsg.classList.remove('hidden');
        }
        return;
    }

    const html = meals.map((meal, index) => {
        const favActive = isFavorite(meal.idMeal);
        const shopActive = isShopping(meal.idMeal);
        const delay = (index % 12) * 0.05;
        
        return `
            <div class="recipe-card stagger-in" style="animation-delay: ${delay}s">
                <div class="recipe-img-container" style="overflow:hidden; height:240px;">
                    <img src="${meal.strMealThumb}/preview" alt="${meal.strMeal}" class="recipe-img" loading="lazy">
                </div>
                <div class="recipe-info">
                    ${meal.strCategory ? `<span class="recipe-category">${meal.strCategory}</span>` : ''}
                    <h3 class="recipe-title">${meal.strMeal}</h3>
                    <div class="recipe-actions">
                        <button class="secondary-btn view-recipe-btn" data-id="${meal.idMeal}">View Recipe</button>
                        <button class="icon-btn heart ${favActive ? 'active' : ''}" aria-label="Toggle Favorite">
                            <ion-icon name="${favActive ? 'heart' : 'heart-outline'}"></ion-icon>
                        </button>
                        <button class="icon-btn list ${shopActive ? 'active' : ''}" aria-label="Toggle Shopping List">
                            <ion-icon name="${shopActive ? 'list' : 'list-outline'}"></ion-icon>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}


async function getFullRecipe(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/lookup.php?i=${id}`);
        const data = await res.json();
        return data.meals[0];
    } catch {
        return null;
    }
}

function renderModal(meal) {
    const ingredients = getIngredientsList(meal);
    const favActive = isFavorite(meal.idMeal);
    const shopActive = isShopping(meal.idMeal);

    elements.modal.body.innerHTML = `
        <div class="modal-hero">
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        </div>
        <div class="modal-details">
            <div class="modal-header">
                <div>
                    <div class="recipe-category" style="margin-bottom:0.5rem">${meal.strCategory} | ${meal.strArea}</div>
                    <div class="modal-title">
                        <h2>${meal.strMeal}</h2>
                    </div>
                    ${meal.strTags ? `
                    <div class="modal-meta">
                        <span><ion-icon name="pricetags-outline"></ion-icon> ${meal.strTags.split(',').join(', ')}</span>
                        <span><ion-icon name="earth-outline"></ion-icon> ${meal.strArea}</span>
                    </div>` : `
                    <div class="modal-meta">
                        <span><ion-icon name="earth-outline"></ion-icon> ${meal.strArea}</span>
                    </div>`}
                </div>
                <div class="modal-actions">
                    <button class="icon-btn heart ${favActive ? 'active' : ''}" id="modal-fav-btn">
                        <ion-icon name="${favActive ? 'heart' : 'heart-outline'}"></ion-icon>
                    </button>
                    <button class="icon-btn list ${shopActive ? 'active' : ''}" id="modal-shop-btn">
                        <ion-icon name="${shopActive ? 'list' : 'list-outline'}"></ion-icon>
                    </button>
                </div>
            </div>

            <div class="recipe-body">
                <div class="ingredients">
                    <h3>Ingredients</h3>
                    <ul class="ingredients-list">
                        ${ingredients.map(ing => `
                            <li>
                                <span>${ing.ingredient}</span>
                                <span>${ing.measure}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="instructions">
                    <h3>Instructions</h3>
                    <p>${meal.strInstructions}</p>
                    ${meal.strYoutube ? `
                        <div style="margin-top:2rem;">
                            <a href="${meal.strYoutube}" target="_blank" class="primary-btn" style="text-decoration:none; display:inline-block;"><ion-icon name="logo-youtube"></ion-icon> Watch Video</a>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;


    document.getElementById('modal-fav-btn').addEventListener('click', (e) => {
        toggleFavorite(meal, e.currentTarget);
    });
    document.getElementById('modal-shop-btn').addEventListener('click', (e) => {
        toggleShoppingList(meal, e.currentTarget);
    });

    elements.modal.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.modal.overlay.classList.add('hidden');
    document.body.style.overflow = '';
}


function isFavorite(id) {
    return state.favorites.some(f => f.idMeal === id);
}

function isShopping(id) {
    return state.shoppingList.some(s => s.idMeal === id);
}

function toggleFavorite(meal, btnElement) {
    if (!meal) return;
    const idx = state.favorites.findIndex(f => f.idMeal === meal.idMeal);
    if (idx > -1) {
        state.favorites.splice(idx, 1);
        showToast('Removed from Favorites');
        setBtnState(btnElement, false, 'heart');
    } else {
        state.favorites.push(meal);
        showToast('Added to Favorites');
        setBtnState(btnElement, true, 'heart');
    }
    saveState();
    if (state.currentView === 'favorites') renderFavorites();
}

function toggleShoppingList(meal, btnElement) {
    if (!meal) return;
    const idx = state.shoppingList.findIndex(s => s.idMeal === meal.idMeal);
    if (idx > -1) {
        state.shoppingList.splice(idx, 1);
        showToast('Removed from Shopping List');
        setBtnState(btnElement, false, 'list');
    } else {
        if (state.shoppingList.length >= 3) {
            showToast('Shopping list limit reached (Max 3 Recipes)');
            return;
        }
        state.shoppingList.push(meal);
        showToast('Added to Shopping List');
        setBtnState(btnElement, true, 'list');
    }
    saveState();
    updateBadges();
    if (state.currentView === 'shopping') renderShoppingList();
}

function setBtnState(btn, active, iconName) {
    if (!btn) return;
    if (active) {
        btn.classList.add('active');
        btn.innerHTML = `<ion-icon name="${iconName}"></ion-icon>`;
    } else {
        btn.classList.remove('active');
        btn.innerHTML = `<ion-icon name="${iconName}-outline"></ion-icon>`;
    }
}

function saveState() {
    localStorage.setItem('mealMasterFavorites', JSON.stringify(state.favorites));
    localStorage.setItem('mealMasterShopping', JSON.stringify(state.shoppingList));
}

function updateBadges() {
    elements.nav.shoppingBadge.textContent = state.shoppingList.length;
}


function renderFavorites() {
    if (state.favorites.length === 0) {
        elements.grids.favorites.innerHTML = '';
        elements.utils.noFavoritesMsg.classList.remove('hidden');
    } else {
        elements.utils.noFavoritesMsg.classList.add('hidden');
        renderRecipeGrid(state.favorites, elements.grids.favorites);
    }
}

function renderShoppingList() {
    const listContainer = elements.shopping.recipeList;
    const ingContainer = elements.shopping.ingredientList;

    listContainer.innerHTML = '';
    ingContainer.innerHTML = '';

    if (state.shoppingList.length === 0) {
        elements.shopping.noShoppingMsg.classList.remove('hidden');
        document.querySelector('.shopping-content').classList.add('hidden');
        elements.shopping.clearBtn.classList.add('hidden');
        return;
    }

    elements.shopping.noShoppingMsg.classList.add('hidden');
    document.querySelector('.shopping-content').classList.remove('hidden');
    elements.shopping.clearBtn.classList.remove('hidden');


    state.shoppingList.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'shopping-recipe-card';
        card.innerHTML = `
            <img src="${meal.strMealThumb}/preview" alt="${meal.strMeal}">
            <h4>${meal.strMeal}</h4>
            <button class="remove-shopping-btn" data-id="${meal.idMeal}"><ion-icon name="trash-outline"></ion-icon></button>
        `;
        listContainer.appendChild(card);
    });


    const compiled = compileIngredients(state.shoppingList);


    const ingTitle = document.createElement('h3');
    ingTitle.textContent = 'Ingredients to Buy';
    ingContainer.appendChild(ingTitle);

    const ul = document.createElement('ul');
    ul.className = 'compiled-list';
    compiled.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="flex-grow:1">
                <div style="font-weight:600">${item.ingredient}</div>
                <div style="font-size:0.9rem; color:var(--muted)">${item.measures.map(m => m.trim()).filter(Boolean).join(', ')}</div>
            </div>
        `;
        ul.appendChild(li);
    });
    ingContainer.appendChild(ul);
}



function getIngredientsList(meal) {
    return Array.from({ length: 20 }, (_, i) => i + 1)
        .filter(i => meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== '')
        .map(i => ({
            ingredient: meal[`strIngredient${i}`].trim(),
            measure: meal[`strMeasure${i}`] ? meal[`strMeasure${i}`].trim() : ''
        }));
}

function compileIngredients(meals) {
    return meals
        .map(meal => getIngredientsList(meal))
        .reduce((acc, ings) => acc.concat(ings), [])
        .reduce((acc, ing) => {
            const key = ing.ingredient.toLowerCase();
            if (!key) return acc;

            const existing = acc.find(item => item.key === key);
            if (!existing) {
                acc.push({ key, ingredient: ing.ingredient, measures: [ing.measure].filter(Boolean) });
            } else if (ing.measure && !existing.measures.includes(ing.measure)) {
                existing.measures.push(ing.measure);
            }
            return acc;
        }, [])
        .sort((a, b) => a.ingredient.localeCompare(b.ingredient));
}

function showLoading() {
    elements.utils.loading.classList.remove('hidden');
    elements.grids.home.classList.add('hidden');
}

function hideLoading() {
    elements.utils.loading.classList.add('hidden');
    elements.grids.home.classList.remove('hidden');
}

function showError() {
    elements.grids.home.innerHTML = '';
    elements.utils.noResultsMsg.classList.remove('hidden');
    elements.utils.noResultsMsg.textContent = 'Something went wrong fetching recipes. Try again!';
}

let toastTimeout;
function showToast(message) {
    const toast = elements.utils.toast;
    toast.textContent = message;
    toast.classList.remove('hidden');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (elements.nav.themeToggle) {
            elements.nav.themeToggle.innerHTML = '<ion-icon name="sunny-outline"></ion-icon>';
        }
    } else {
        document.body.removeAttribute('data-theme');
        if (elements.nav.themeToggle) {
            elements.nav.themeToggle.innerHTML = '<ion-icon name="moon-outline"></ion-icon>';
        }
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
