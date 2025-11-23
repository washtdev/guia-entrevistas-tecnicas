(function(){
  const btn = document.getElementById('back-to-top');
  if(!btn) return;
  const showAfter = 240; // px
  const onScroll = () => {
    if (window.scrollY > showAfter) btn.classList.add('visible');
    else btn.classList.remove('visible');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    btn.blur();
  });
  // initial check
  onScroll();
})();

// Inicializa a lista ao carregar a página (script é carregado com `defer`)
window.onload = () => iniciarBusca();

// Theme toggle: move to dark/light and persist preference
(function(){
  const toggle = document.getElementById('theme-toggle');
  if(!toggle) return;

  const storageKey = 'theme-preference';
  const applyTheme = (theme) => {
    if(theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggle.classList.add('active');
      toggle.setAttribute('aria-pressed', 'true');
      localStorage.setItem(storageKey, 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-pressed', 'false');
      localStorage.setItem(storageKey, 'light');
    }
  };

  // initialize: saved preference > prefers-color-scheme > default light
  const saved = localStorage.getItem(storageKey);
  if(saved) applyTheme(saved);
  else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) applyTheme('dark');

  toggle.addEventListener('click', () => {
    const currentDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(currentDark ? 'light' : 'dark');
    toggle.blur();
  });
})();

let cardContainer = document.querySelector(".card-container");
let dados = [];

async function iniciarBusca() {
  // Load data once
  if (!dados || !dados.length) {
    try {
      const resposta = await fetch("data.json");
      dados = await resposta.json();
    } catch (err) {
      console.error('Erro ao carregar data.json', err);
      dados = [];
    }
  }

  // Apply filters and search
  const filtrados = aplicarFiltros(dados);
  renderizarCards(filtrados);
}

function aplicarFiltros(lista) {
  const q = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
  const diff = (document.getElementById('filter-dificuldade')?.value || '').toLowerCase();
  const cat = (document.getElementById('filter-categoria')?.value || '').toLowerCase();

  const mapDificuldade = {
    'facil': 'Fácil',
    'medio': 'Médio',
    'dificil': 'Difícil'
  };

  const mapCategoria = {
    'algoritmos': 'Algoritmo',
    'estruturas': 'Estrutura de Dados',
    'conceito': 'Conceito'
  };

  return (lista || []).filter(item => {
    // filtro dificuldade
    if (diff) {
      const wanted = mapDificuldade[diff];
      if (!wanted || String(item.dificuldade) !== wanted) return false;
    }

    // filtro categoria
    if (cat) {
      const wantedCat = mapCategoria[cat];
      if (!wantedCat || String(item.categoria) !== wantedCat) return false;
    }

    // busca por texto em nome, descricao, tags e prerequisitos
    if (q) {
      const inNome = String(item.nome || '').toLowerCase().includes(q);
      const inDesc = String(item.descricao || '').toLowerCase().includes(q);
      const inPre = String(item.prerequisitos || '').toLowerCase().includes(q);
      const inTags = Array.isArray(item.tags) && item.tags.join(' ').toLowerCase().includes(q);
      const inAulas = Array.isArray(item.aulas) && item.aulas.join(' ').toLowerCase().includes(q);
      if (!(inNome || inDesc || inPre || inTags || inAulas)) return false;
    }

    return true;
  });
}

async function renderizarCards(dados) {
  let classes = {
    "Fácil": "easy-dificulty",
    "Médio": "medium-dificulty",
    "Difícil": "hard-dificulty"
  };
  // clear container before rendering
  if (!cardContainer) cardContainer = document.querySelector('.card-container');
  cardContainer.innerHTML = '';

  for(let dado of dados) {
    let article = document.createElement("article");
    article.classList.add("card");
    const aulasHtml = Array.isArray(dado.aulas) && dado.aulas.length
      ? dado.aulas.map(aula => `<a href="${aula}" target="_blank" rel="noopener noreferrer">Aula</a>`).join(' • ')
      : '';
    
    const exerciciosHtml = Array.isArray(dado.exercicios) && dado.exercicios.length
      ? dado.exercicios.map(exercicio => `<a href="${exercicio}" target="_blank" rel="noopener noreferrer">Exercício</a>`).join(' • ')
      : 'Nenhum';

    article.innerHTML = `
      <h2>${dado.nome}</h2>
      <p>
        Dificuldade: <span class="${classes[dado.dificuldade]}">${dado.dificuldade}</span>
      </p>
      <p>Categoria: ${dado.categoria}.</p>
      <p>Pré-requisitos: ${dado.prerequisitos}.</p>
      <p>
        Material de Estudo:
        <a href="${dado.definicao}" target="_blank" rel="noopener noreferrer">Definição</a> • 
        ${aulasHtml}
      </p>
      <p>Exercícios: ${exerciciosHtml}.</p>
      <p>${dado.descricao}</p>
    `;
    cardContainer.appendChild(article);
  }
}

// add listeners for filter controls so changes re-run the search
(function attachFilterListeners(){
  const searchInput = document.getElementById('search-input');
  const fDiff = document.getElementById('filter-dificuldade');
  const fCat = document.getElementById('filter-categoria');
  const searchBtn = document.querySelector('.search-btn');

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') iniciarBusca(); });
  }
  if (fDiff) fDiff.addEventListener('change', iniciarBusca);
  if (fCat) fCat.addEventListener('change', iniciarBusca);
  if (searchBtn) searchBtn.addEventListener('click', iniciarBusca);
})();
