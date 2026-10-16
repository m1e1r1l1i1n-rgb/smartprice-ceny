const categories = [
  { id: 'grocery', name: 'Бакалея', icon: '<img src="images/categories/bakaleya.png" alt="Бакалея" class="cat-ico">' },
  { id: 'chem', name: 'Бытовая химия', icon: '<img src="images/categories/bytovaya-himiya.png" alt="Бытовая химия" class="cat-ico">' },
  { id: 'other', name: 'Другое', icon: '<img src="images/categories/drugoe.png" alt="Другое" class="cat-ico">' },
  { id: 'frozen', name: 'Заморозка', icon: '<img src="images/categories/zamorozka.png" alt="Заморозка" class="cat-ico">' },
  { id: 'sausage', name: 'Колбасные изделия', icon: '<img src="images/categories/kolbasnye-izdeliya.png" alt="Колбасные изделия" class="cat-ico">' },
  { id: 'canned', name: 'Консервы', icon: '<img src="images/categories/konservy.png" alt="Консервы" class="cat-ico">' },
  { id: 'milk', name: 'Молочные продукты', icon: '<img src="images/categories/molochnye-produkty.png" alt="Молочные продукты" class="cat-ico">' },
  { id: 'meat', name: 'Мясо и рыба', icon: '<img src="images/categories/myaso-i-ryba.png" alt="Мясо и рыба" class="cat-ico">' },
  { id: 'drinks', name: 'Напитки', icon: '<img src="images/categories/napitki.png" alt="Напитки" class="cat-ico">' },
  { id: 'veg', name: 'Овощи и фрукты', icon: '<img src="images/categories/ovoschi-i-frukty.png" alt="Овощи и фрукты" class="cat-ico">' },
  { id: 'snacks', name: 'Снеки', icon: '<img src="images/categories/sneki.png" alt="Снеки" class="cat-ico">' },
  { id: 'bread', name: 'Хлеб и выпечка', icon: '<img src="images/categories/hleb-i-vypechka.png" alt="Хлеб и выпечка" class="cat-ico">' },
  { id: 'household', name: 'Хоз. товары', icon: '<img src="images/categories/hoz-tovary.png" alt="Хоз. товары" class="cat-ico">' }
];

const medCategories = [
  { id: 'med-tablets', name: 'Таблетки', icon: '<img src="images/med-categories/tabletki.png" alt="Таблетки" class="cat-ico">' },
  { id: 'med-devices', name: 'Медицинские изделия', icon: '<img src="images/med-categories/medizdeliya.png" alt="Медицинские изделия" class="cat-ico">' },
  { id: 'med-ointments', name: 'Мази', icon: '<img src="images/med-categories/mazi.png" alt="Мази" class="cat-ico">' },
  { id: 'med-liquids', name: 'Жидкости', icon: '<img src="images/med-categories/zhidkosti.png" alt="Жидкости" class="cat-ico">' },
  { id: 'med-other', name: 'Другое', icon: '<img src="images/med-categories/drugoe.png" alt="Другое" class="cat-ico">' }
];

let db = {
  products: [],
  stores: [
    { name: 'Евроопт', color: '#00875a', image: '', address: '', type: 'store' },
    { name: 'Соседи', color: '#3b82f6', image: '', address: '', type: 'store' },
    { name: 'Корона', color: '#d93838', image: '', address: '', type: 'store' },
    { name: 'мир', color: '#f59e0b', image: '', address: '', type: 'store' }
  ],
  pharmacies: [
    { name: 'Аптека 36.6', color: '#00875a', image: '', address: '', type: 'pharmacy' },
    { name: 'Планета Здоровья', color: '#3b82f6', image: '', address: '', type: 'pharmacy' }
  ],
  cart: [],
  collapsedCategories: {},
  settings: {
    darkMode: false, autoTheme: false, fontSize: '14px', bgColor: '', volumetric: false,
    categoryViewMode: 'list', categoryModalViewMode: 'list', categorySortMode: 'default',
    cartGroupByCategory: true, multiStoreColor: '#d93838', addProductBtnColor: '#27AA5A'
  }
};

let currentStoresType = 'stores';
const presetColors = ['#00875a', '#d93838', '#c2185b', '#7b1fa2', '#512da8', '#303f9f', '#1976d2', '#0097a7', '#00796b', '#689f38', '#fbc02d', '#f57c00'];
let currentModalProductId = null;
let editingProductId = null;
let tempImage = '', tempStoreImage = '', tempEditProductImage = '';
let selectedNewStoreColor = presetColors[0];
let editingStoreIndex = null;
let selectedEditStoreColor = presetColors[0];
let comparisonMode = 'store';
let isTransitioningComparison = false;
let currentCategoryModalCatId = null;
let autoThemeTimer = null;
let skipComparisonAnimation = false;
let gpsToastTimer = null;
const STORAGE_KEY = 'Save_SmartPrice.json';
const pages = ['products', 'cart', 'prices', 'stores', 'settings'];
const swipeablePages = ['products', 'cart', 'prices', 'stores'];
const PAGE_GAP = 8;
const ICON_GRID = '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect>';
const ICON_LIST = '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><circle cx="4" cy="6" r="1.5" fill="currentColor"></circle><circle cx="4" cy="12" r="1.5" fill="currentColor"></circle><circle cx="4" cy="18" r="1.5" fill="currentColor"></circle>';
const ICON_SORT_ALPHA = '<text x="12" y="16" font-size="12" font-weight="bold" fill="currentColor" stroke="none" text-anchor="middle" font-family="Arial">А→Я</text>';
const ICON_SORT_FREQ = '<rect x="3" y="15" width="4" height="6"></rect><rect x="10" y="10" width="4" height="11"></rect><rect x="17" y="5" width="4" height="16"></rect>';
const ICON_SORT_DEFAULT = '<line x1="4" y1="6" x2="16" y2="6"></line><line x1="4" y1="12" x2="13" y2="12"></line><line x1="4" y1="18" x2="10" y2="18"></line><polyline points="18 9 21 12 18 15"></polyline>';
let currentProductsType = 'products';
const productUnits = ['шт', 'кг', 'л', 'упаковка', 'пачка', 'доз', 'порция'];
const medUnits = ['пачка', 'упаковка', 'мл', 'шт'];

function getActiveCategories() { return currentProductsType === 'meds' ? medCategories : categories; }
function getActiveUnits() { return currentProductsType === 'meds' ? medUnits : productUnits; }
function getActiveStoresList() { return currentProductsType === 'meds' ? db.pharmacies : db.stores; }
function isMedProduct(prod) { return medCategories.some(c => c.id === prod.category); }
function getCategoriesForProduct(prod) { return isMedProduct(prod) ? medCategories : categories; }
function getUnitsForProduct(prod) { return isMedProduct(prod) ? medUnits : productUnits; }
function getStoresForProduct(prod) { return isMedProduct(prod) ? db.pharmacies : db.stores; }
function findCategoryById(catId) { return categories.find(c => c.id === catId) || medCategories.find(c => c.id === catId); }