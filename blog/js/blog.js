class BlogManager {
    constructor() {
        this.posts = [];
        this.categories = [];
        this.currentPage = 1;
        this.postsPerPage = 4; // Alterado para 4 posts por página
        this.initializeComponents();
        this.loadData();
        this.footerCategories = document.getElementById('footer-categories');
    }

    initializeComponents() {
        this.postsContainer = document.getElementById('posts-container');
        this.categoriesList = document.getElementById('categories-list');
        this.popularPosts = document.getElementById('popular-posts');
        this.pagination = document.getElementById('pagination');
    }

    async loadData() {
        try {
            // Carregar posts e categorias em paralelo
            const [postsResponse, categoriesResponse] = await Promise.all([
                fetch('http://localhost:3001/api/posts'),
                fetch('http://localhost:3001/api/categories')
            ]);

            const [posts, categories] = await Promise.all([
                postsResponse.json(),
                categoriesResponse.json()
            ]);

            this.posts = posts;
            this.categories = categories;
            this.renderAll();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError('Erro ao carregar conteúdo do blog');
        }
    }

    renderAll() {
        this.renderPosts();
        this.renderCategories();
        this.renderPopularPosts();
        this.renderPagination();
    }

    renderPosts() {
        if (!this.posts.length) {
            this.postsContainer.innerHTML = '<p>Nenhum post encontrado.</p>';
            return;
        }

        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        const paginatedPosts = this.posts.slice(startIndex, endIndex);

        this.postsContainer.innerHTML = paginatedPosts.map(post => `
            <article class="post-card">
                ${post.image ? `
                    <div class="post-image">
                        <img src="${post.image}" alt="${post.title}">
                    </div>
                ` : ''}
                <div class="post-content">
                    <div class="post-category">${post.category}</div>
                    <h2 class="post-title">
                        <a href="post.html?id=${post.id}">${post.title}</a>
                    </h2>
                    <p class="post-excerpt">${post.excerpt}</p>
                    <div class="post-meta">
                        <span>${new Date(post.date).toLocaleDateString()}</span>
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

        if (this.footerCategories) {
            this.footerCategories.innerHTML = this.categories.map(category => `
                <li>
                    <a href="#" data-category="${category.name}">
                        ${category.name}
                    </a>
                </li>
            `).join('');
        }
    }

    renderPopularPosts() {
        const popularPosts = [...this.posts]
            .sort((a, b) => b.views - a.views)
            .slice(0, 3);

        this.popularPosts.innerHTML = popularPosts.map(post => `
            <div class="popular-post">
                ${post.image ? `
                    <div class="popular-post-image">
                        <img src="${post.image}" alt="${post.title}">
                    </div>
                ` : ''}
                <div class="popular-post-content">
                    <h4><a href="post.html?id=${post.id}">${post.title}</a></h4>
                    <span>${new Date(post.date).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        const totalPages = Math.ceil(this.posts.length / this.postsPerPage);
        
        if (totalPages <= 1) {
            this.pagination.innerHTML = '';
            return;
        }

        let paginationHtml = '';

        // Botão Anterior
        paginationHtml += `
            <button 
                onclick="blog.changePage(${this.currentPage - 1})"
                ${this.currentPage === 1 ? 'disabled' : ''}
                class="pagination-btn"
            >
                Anterior
            </button>
        `;

        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `
                <button 
                    onclick="blog.changePage(${i})"
                    class="pagination-btn ${i === this.currentPage ? 'active' : ''}"
                >
                    ${i}
                </button>
            `;
        }

        // Botão Próximo
        paginationHtml += `
            <button 
                onclick="blog.changePage(${this.currentPage + 1})"
                ${this.currentPage === totalPages ? 'disabled' : ''}
                class="pagination-btn"
            >
                Próximo
            </button>
        `;

        this.pagination.innerHTML = paginationHtml;
    }

    changePage(newPage) {
        const totalPages = Math.ceil(this.posts.length / this.postsPerPage);
        
        if (newPage < 1 || newPage > totalPages) {
            return;
        }

        this.currentPage = newPage;
        this.renderPosts();
        this.renderPagination();

        // Scroll suave para o topo
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    showError(message) {
        if (this.postsContainer) {
            this.postsContainer.innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                    <button onclick="blog.loadData()">Tentar novamente</button>
                </div>
            `;
        }
    }
}

// Inicialização única
window.addEventListener('load', () => {
    window.blog = new BlogManager();
}); 