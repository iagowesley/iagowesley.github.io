const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const fsSync = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

// No início do arquivo, após os requires:
const dataPath = path.join(__dirname, 'data');
const categoriesPath = path.join(dataPath, 'categories.json');
const postsPath = path.join(dataPath, 'posts.json');

// Ajuste os caminhos para uploads
const uploadsPath = path.join(__dirname, 'public', 'uploads');

// Criar pastas se não existirem - usando fsSync para funções síncronas
if (!fsSync.existsSync(dataPath)) {
    fsSync.mkdirSync(dataPath, { recursive: true });
}
if (!fsSync.existsSync(uploadsPath)) {
    fsSync.mkdirSync(uploadsPath, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos - ajuste a ordem
app.use('/uploads', express.static(uploadsPath));
app.use(express.static(path.join(__dirname, 'public')));

// Permitir CORS para todas as origens
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsPath); // Use o caminho absoluto
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Rotas de autenticação
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const users = JSON.parse(await fs.readFile('data/users.json', 'utf8'));
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// Rotas dos posts
app.get('/api/posts', async (req, res) => {
    try {
        console.log('Tentando ler posts de:', postsPath);
        let data = { posts: [] };
        try {
            const fileContent = await fs.readFile(postsPath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Se o arquivo não existir, cria com array vazio
                await fs.writeFile(postsPath, JSON.stringify({ posts: [] }, null, 2));
            } else {
                throw error;
            }
        }
        res.json(data.posts);
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        res.status(500).json({ error: 'Erro ao carregar posts: ' + error.message });
    }
});

app.post('/api/posts', upload.single('image'), async (req, res) => {
    try {
        console.log('Recebendo requisição POST /api/posts');
        console.log('Corpo da requisição:', req.body);
        console.log('Arquivo:', req.file);

        let posts = { posts: [] };
        try {
            console.log('Lendo arquivo de posts:', postsPath);
            const data = await fs.readFile(postsPath, 'utf8');
            posts = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            console.log('Arquivo de posts não existe, iniciando com array vazio');
        }

        const newPost = {
            id: Date.now(),
            title: req.body.title,
            excerpt: req.body.excerpt,
            content: req.body.content,
            category: req.body.category,
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            image: req.file ? `/uploads/${req.file.filename}` : '',
            date: new Date().toISOString(),
            views: 0,
            author: {
                name: "Admin",
                avatar: "https://randomuser.me/api/portraits/men/1.jpg"
            }
        };

        console.log('Novo post criado:', newPost);
        posts.posts.push(newPost);

        console.log('Salvando arquivo...');
        await fs.writeFile(postsPath, JSON.stringify(posts, null, 2));
        console.log('Arquivo salvo com sucesso');

        res.json(newPost);
    } catch (error) {
        console.error('Erro ao criar post:', error);
        res.status(500).json({ error: 'Erro ao criar post: ' + error.message });
    }
});

app.put('/api/posts/:id', upload.single('image'), async (req, res) => {
    try {
        const posts = JSON.parse(await fs.readFile('data/posts.json', 'utf8'));
        const index = posts.findIndex(p => p.id === parseInt(req.params.id));

        if (index === -1) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }

        const updatedPost = {
            ...posts[index],
            ...req.body,
            image: req.file ? `/uploads/${req.file.filename}` : posts[index].image
        };

        posts[index] = updatedPost;
        await fs.writeFile('data/posts.json', JSON.stringify(posts, null, 2));
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar post' });
    }
});

app.delete('/api/posts/:id', async (req, res) => {
    try {
        const posts = JSON.parse(await fs.readFile('data/posts.json', 'utf8'));
        const filteredPosts = posts.filter(p => p.id !== parseInt(req.params.id));
        await fs.writeFile('data/posts.json', JSON.stringify(filteredPosts, null, 2));
        res.json({ message: 'Post deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao deletar post' });
    }
});

// Rotas de categorias
app.get('/api/categories', async (req, res) => {
    try {
        console.log('Tentando ler categorias de:', categoriesPath);
        let categories = [];
        let posts = [];

        try {
            categories = JSON.parse(await fs.readFile(categoriesPath, 'utf8'));
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Se o arquivo não existir, cria com categorias padrão
                categories = [
                    { id: 1, name: "Tecnologia", count: 0 },
                    { id: 2, name: "Design", count: 0 },
                    { id: 3, name: "Marketing", count: 0 },
                    { id: 4, name: "Desenvolvimento", count: 0 }
                ];
                await fs.writeFile(categoriesPath, JSON.stringify(categories, null, 2));
            } else {
                throw error;
            }
        }

        try {
            const postsData = JSON.parse(await fs.readFile(postsPath, 'utf8'));
            posts = postsData.posts || [];
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
        
        // Atualizar contagem de posts por categoria
        categories.forEach(category => {
            category.count = posts.filter(post => post.category === category.name).length;
        });
        
        console.log('Categorias carregadas:', categories);
        res.json(categories);
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        res.status(500).json({ error: 'Erro ao carregar categorias: ' + error.message });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        let categories = [];
        try {
            categories = JSON.parse(await fs.readFile(categoriesPath, 'utf8'));
        } catch (error) {
            if (error.code === 'ENOENT') {
                categories = [];
            } else {
                throw error;
            }
        }

        const newCategory = {
            id: Date.now(),
            name: req.body.name,
            count: 0
        };

        categories.push(newCategory);
        await fs.writeFile(categoriesPath, JSON.stringify(categories, null, 2));
        res.json(newCategory);
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ error: 'Erro ao criar categoria: ' + error.message });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const categories = JSON.parse(await fs.readFile(categoriesPath, 'utf8'));
        const filteredCategories = categories.filter(c => c.id !== parseInt(req.params.id));
        await fs.writeFile(categoriesPath, JSON.stringify(filteredCategories, null, 2));
        res.json({ message: 'Categoria deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        res.status(500).json({ error: 'Erro ao deletar categoria: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 