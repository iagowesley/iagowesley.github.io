class AdminPanel {
    constructor() {
        this.posts = [];
        this.categories = [];
        this.currentPost = null;
        
        this.initializeComponents();
        this.setupEventListeners();
        this.loadData();
    }

    async loadData() {
        try {
            // Carregar posts
            const postsResponse = await fetch('http://localhost:3001/api/posts');
            if (!postsResponse.ok) throw new Error('Erro ao carregar posts');
            const posts = await postsResponse.json();
            this.posts = posts;
            this.renderPosts();

            // Carregar categorias
            const categoriesResponse = await fetch('http://localhost:3001/api/categories');
            if (!categoriesResponse.ok) throw new Error('Erro ao carregar categorias');
            const categories = await categoriesResponse.json();
            this.categories = categories;
            this.renderCategories(categories);
        } catch (error) {
            alert(error.message);
        }
    }

    initializeComponents() {
        this.postsTable = document.getElementById('posts-table');
        this.postForm = document.getElementById('post-form');
        this.postsList = document.querySelector('.posts-list');
        this.postFormContainer = document.querySelector('.post-form');
    }

    setupEventListeners() {
        document.getElementById('new-post').addEventListener('click', () => this.showPostForm());
        document.getElementById('cancel-post').addEventListener('click', () => this.hidePostForm());
        document.getElementById('logout').addEventListener('click', () => this.logout());
        this.postForm.addEventListener('submit', (e) => this.handlePostSubmit(e));
        
        // Eventos de navegação
        document.querySelectorAll('.admin-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Evento do formulário de categoria
        document.getElementById('category-form').addEventListener('submit', (e) => this.handleCategorySubmit(e));

        // Preview da imagem
        document.getElementById('post-image').addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('image-preview');
            const previewImg = preview.querySelector('img');
            const fileLabel = document.querySelector('.file-label span');

            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    preview.style.display = 'block';
                    fileLabel.textContent = file.name;
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
                fileLabel.textContent = 'Escolher arquivo';
            }
        });
    }

    showPostForm(post = null) {
        this.currentPost = post;
        this.postsList.style.display = 'none';
        this.postFormContainer.style.display = 'block';

        // Remover o editor existente se houver
        if (window.editor) {
            window.editor.destroy().catch(error => {});
        }

        // Inicializar o CKEditor
        ClassicEditor
            .create(document.querySelector('#post-content'), {
                toolbar: [
                    'heading',
                    '|',
                    'bold',
                    'italic',
                    'link',
                    'bulletedList',
                    'numberedList',
                    '|',
                    'indent',
                    'outdent',
                    '|',
                    'imageUpload',
                    'blockQuote',
                    'insertTable',
                    'mediaEmbed',
                    'undo',
                    'redo'
                ],
                placeholder: 'Digite o conteúdo do post aqui...'
            })
            .then(editor => {
                window.editor = editor;
                // Se estiver editando um post existente, define o conteúdo
                if (post) {
                    editor.setData(post.content || '');
                }
            })
            .catch(error => {
                console.error('Erro ao inicializar o editor:', error);
            });

        if (post) {
            // Preencher formulário para edição
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-excerpt').value = post.excerpt;
            document.getElementById('post-category').value = post.category;
            document.getElementById('post-tags').value = post.tags.join(', ');
        } else {
            this.postForm.reset();
        }
    }

    hidePostForm() {
        if (window.editor) {
            window.editor.destroy()
                .then(() => {
                    window.editor = null;
                })
                .catch(error => {
                    console.error('Erro ao destruir editor:', error);
                });
        }
        this.postsList.style.display = 'block';
        this.postFormContainer.style.display = 'none';
        this.currentPost = null;
    }

    renderPosts() {
        this.postsTable.innerHTML = this.posts.map(post => `
            <tr>
                <td>${post.title}</td>
                <td>${post.category}</td>
                <td>${new Date(post.date).toLocaleDateString()}</td>
                <td>${post.views}</td>
                <td class="action-buttons">
                    <button class="edit-btn" onclick="admin.showPostForm(${JSON.stringify(post)})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="admin.deletePost(${post.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    populateCategories() {
        const select = document.getElementById('post-category');
        select.innerHTML = this.categories.map(category => `
            <option value="${category.name}">${category.name}</option>
        `).join('');
    }

    async handlePostSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData();
            const imageFile = document.getElementById('post-image').files[0];
            const title = document.getElementById('post-title').value;
            const excerpt = document.getElementById('post-excerpt').value;
            const category = document.getElementById('post-category').value;
            const tags = document.getElementById('post-tags').value;
            const content = await window.editor.getData();

            formData.append('title', title);
            formData.append('excerpt', excerpt);
            formData.append('content', content);
            formData.append('category', category);
            formData.append('tags', tags);
            
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const url = this.currentPost 
                ? `http://localhost:3001/api/posts/${this.currentPost.id}`
                : 'http://localhost:3001/api/posts';
            
            const method = this.currentPost ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao salvar post');
            }

            await this.loadData();
            this.hidePostForm();
            alert('Post salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar post:', error);
            alert(error.message);
        }
    }

    async deletePost(id) {
        if (!confirm('Tem certeza que deseja excluir este post?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/posts/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao deletar post');
            }

            await this.loadData();
        } catch (error) {
            alert(error.message);
        }
    }

    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    }

    showSection(section) {
        // Atualizar menu ativo
        document.querySelectorAll('.admin-menu a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });

        // Esconder todas as seções
        document.querySelector('.posts-list').style.display = 'none';
        document.querySelector('.post-form').style.display = 'none';
        document.querySelector('.categories-section').style.display = 'none';

        // Mostrar seção selecionada
        if (section === 'posts') {
            document.querySelector('.posts-list').style.display = 'block';
        } else if (section === 'categories') {
            document.querySelector('.categories-section').style.display = 'block';
            this.loadCategories(); // Recarregar categorias quando a seção for aberta
        }
    }

    async loadCategories() {
        try {
            console.log('Carregando categorias...');
            const response = await fetch('http://localhost:3001/api/categories');
            console.log('Resposta:', response);
            if (!response.ok) throw new Error('Erro ao carregar categorias');
            
            const categories = await response.json();
            console.log('Categorias carregadas:', categories);
            this.renderCategories(categories);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            alert(error.message);
        }
    }

    renderCategories(categories) {
        const table = document.getElementById('categories-table');
        table.innerHTML = categories.map(category => `
            <tr>
                <td>${category.name}</td>
                <td>${category.count}</td>
                <td class="action-buttons">
                    <button class="delete-btn" onclick="admin.deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Atualizar select de categorias no formulário de posts
        const select = document.getElementById('post-category');
        select.innerHTML = categories.map(category => `
            <option value="${category.name}">${category.name}</option>
        `).join('');
    }

    async handleCategorySubmit(e) {
        e.preventDefault();
        const name = document.getElementById('category-name').value;

        try {
            const response = await fetch('http://localhost:3001/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });

            if (!response.ok) throw new Error('Erro ao criar categoria');

            await this.loadCategories();
            document.getElementById('category-form').reset();
        } catch (error) {
            alert(error.message);
        }
    }

    async deleteCategory(id) {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

        try {
            const response = await fetch(`http://localhost:3001/api/categories/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao deletar categoria');

            await this.loadCategories();
        } catch (error) {
            alert(error.message);
        }
    }
}

// Inicialização
const admin = new AdminPanel(); 