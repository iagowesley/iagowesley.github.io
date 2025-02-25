document.addEventListener('DOMContentLoaded', () => {
    // Pegar o ID do post da URL
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        const post = blogData.posts.find(p => p.id === parseInt(postId));
        if (post) {
            renderPost(post);
            renderRelatedPosts(post);
        }
    }
});

function renderPost(post) {
    // Atualizar título da página
    document.title = `${post.title} - Blog`;

    // Atualizar meta dados
    document.querySelector('.post-category').textContent = post.category;
    document.querySelector('.post-date').textContent = formatDate(post.date);
    document.querySelector('.post-title').textContent = post.title;
    document.querySelector('.author-name').textContent = post.author;
    
    // Atualizar imagem destacada
    document.querySelector('.post-featured-image img').src = post.image;
    document.querySelector('.post-featured-image img').alt = post.title;

    // Renderizar conteúdo
    document.querySelector('.post-content').innerHTML = post.content;

    // Configurar botões de compartilhamento
    setupShareButtons(post);
}

function renderRelatedPosts(currentPost) {
    const relatedPosts = blogData.posts
        .filter(post => 
            post.id !== currentPost.id && 
            post.category === currentPost.category
        )
        .slice(0, 3);

    const container = document.querySelector('.related-posts-grid');
    container.innerHTML = '';

    relatedPosts.forEach(post => {
        container.innerHTML += `
            <article class="post-card">
                <div class="post-image">
                    <img src="${post.image}" alt="${post.title}">
                </div>
                <div class="post-content">
                    <div class="post-category">${post.category}</div>
                    <h2 class="post-title">
                        <a href="post.html?id=${post.id}">${post.title}</a>
                    </h2>
                    <div class="post-meta">
                        <span>${formatDate(post.date)}</span>
                    </div>
                </div>
            </article>
        `;
    });
}

function setupShareButtons(post) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);

    const shareButtons = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`
    };

    Object.entries(shareButtons).forEach(([network, shareUrl]) => {
        document.querySelector(`.share-button.${network}`).href = shareUrl;
    });
} 