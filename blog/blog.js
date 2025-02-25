class BlogManager {
    constructor() {
        this.posts = [];
        this.categories = [];
        this.currentPage = 1;
        this.postsPerPage = 6;
        this.currentCategory = null;
        this.searchQuery = '';
    }

    async init() {
        try {
            // Carregar posts do JSON
            const response = await fetch('/blog/data/posts.json');
            const data = await response.json();
            this.posts = data.posts;
            this.categories = data.categories;

            // Inicializar componentes
            this.initializeComponents();
            this.setupEventListeners();
            this.renderInitialContent();
        } catch (error) {
            console.error('Erro ao carregar posts:', error);
        }
    }

    initializeComponents() {
        this.postsContainer = document.getElementById('posts-container');
        this.paginationContainer = document.getElementById('pagination');
        this.categoriesList = document.getElementById('categories-list');
        this.popularPosts = document.getElementById('popular-posts');
        this.searchInput = document.getElementById('search-input');
        this.searchButton = document.getElementById('search-button');
    }

    setupEventListeners() {
        // Pesquisa
        this.searchButton.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });

        // Categorias
        this.categoriesList.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                this.handleCategoryClick(e.target.dataset.category);
            }
        });
    }

    handleSearch() {
        this.searchQuery = this.searchInput.value;
        this.currentPage = 1;
        this.filterAndRenderPosts();
    }

    handleCategoryClick(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.filterAndRenderPosts();
    }

    renderInitialContent() {
        this.filterAndRenderPosts();
        this.renderCategories();
        this.renderPopularPosts();
    }

    filterAndRenderPosts() {
        let filteredPosts = [...this.posts];

        // Aplicar filtros
        if (this.currentCategory) {
            filteredPosts = filteredPosts.filter(post => 
                post.category === this.currentCategory
            );
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filteredPosts = filteredPosts.filter(post => 
                post.title.toLowerCase().includes(query) ||
                post.excerpt.toLowerCase().includes(query)
            );
        }

        // Paginação
        const start = (this.currentPage - 1) * this.postsPerPage;
        const paginatedPosts = filteredPosts.slice(start, start + this.postsPerPage);

        this.renderPosts(paginatedPosts);
        this.renderPagination(Math.ceil(filteredPosts.length / this.postsPerPage));
    }

    renderPosts(posts) {
        this.postsContainer.innerHTML = posts.map(post => `
            <article class="post-card">
                <div class="post-image">
                    <img src="${post.image}" alt="${post.title}">
                </div>
                <div class="post-content">
                    <div class="post-category">${post.category}</div>
                    <h2 class="post-title">
                        <a href="post.html?id=${post.id}">${post.title}</a>
                    </h2>
                    <p class="post-excerpt">${post.excerpt}</p>
                    <div class="post-meta">
                        <span>${this.formatDate(post.date)}</span>
                        <span>${post.views} visualizações</span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    renderCategories() {
        this.categoriesList.innerHTML = this.categories.map(category => `
            <li>
                <a href="#" data-category="${category.name}">
                    ${category.name}
                    <span>(${category.count})</span>
                </a>
            </li>
        `).join('');
    }

    renderPopularPosts() {
        const popularPosts = [...this.posts]
            .sort((a, b) => b.views - a.views)
            .slice(0, 3);

        this.popularPosts.innerHTML = popularPosts.map(post => `
            <div class="popular-post">
                <div class="popular-post-image">
                    <img src="${post.image}" alt="${post.title}">
                </div>
                <div class="popular-post-content">
                    <h4><a href="post.html?id=${post.id}">${post.title}</a></h4>
                    <span>${this.formatDate(post.date)}</span>
                </div>
            </div>
        `).join('');
    }

    renderPagination(totalPages) {
        this.paginationContainer.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.classList.toggle('active', i === this.currentPage);
            button.addEventListener('click', () => {
                this.currentPage = i;
                this.filterAndRenderPosts();
            });
            this.paginationContainer.appendChild(button);
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pt-BR');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const blog = new BlogManager();
    blog.init();
}); 