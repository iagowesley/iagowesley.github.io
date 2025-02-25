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
        ]
    })
    .then(editor => {
        window.editor = editor; // Expor o editor globalmente
    })
    .catch(error => {
        console.error(error);
    }); 