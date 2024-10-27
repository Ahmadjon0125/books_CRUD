const http = require('http')
const fs = require('fs')
const path = require('path')
const booksPath = path.join(__dirname, "/data", "books.json")

let books; 

fs.readFile(booksPath, "utf8", (err, data) => {
    if (err) {
        console.error("Fayl o'qishda xato:", err);
        return;
    }
    books = JSON.parse(data);
});

const server = http.createServer((req, res)=>{
    const urlParts = req.url.split("/")
    const id = Number(urlParts[2])
    
    // book : id get
    if(req.method === 'GET' && urlParts[1] === 'books' && id){
        const book  = books.find((e) => e.id === id)
        if(book){
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(book))
        }
        else{
            res.statusCode = 404
            res.end("Book not found")
        }
        return
    }
    
    // Yangi kitob qo'shish - POST /books
    if (req.method === 'POST' && urlParts[1] === 'books') {
        let body = [];
        
        req.on('data', (chunk) => {
        body.push(chunk);
    });
    
    req.on('end', () => {
        body = Buffer.concat(body).toString();
        const { title, author } = JSON.parse(body);
        
        if (!title || !author) {
            res.statusCode = 400;
            res.end("title va author bo'sh bo'lmasligi kerak");
            return;
        }

        const existingBook = books.find((book) => book.title === title);
        if (existingBook) {
            res.statusCode = 409;
            res.end("Bu kitob bazada mavjud");
            return;
        }
        
        const newBook = {
            id: books.length ? books[books.length - 1].id + 1 : 1,
            title,
            author
        };
        
        books.push(newBook);
        
        fs.writeFile(booksPath, JSON.stringify(books, null, 2), (err) => {
            if (err) {
                res.statusCode = 500;
                res.end("Serverda xato: kitobni qo'shishda muammo yuz berdi");
                return;
            }
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(newBook));
        });
    });
    return;
}

// book :id put
if(req.method === 'PUT' && urlParts[1] === 'books' && id){
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    });

    req.on('end', () => {
        body = Buffer.concat(body).toString();
        const { title, author } = JSON.parse(body);
        const bookIndex = books.findIndex((book) => book.id === id);

        if (bookIndex === -1) {
          res.statusCode = 404;
          res.end("Kitob topilmadi");
          return;
        }

        if (title) {
          books[bookIndex].title = title;
        }
        if (author) {
          books[bookIndex].author = author;
        }

        fs.writeFile(booksPath, JSON.stringify(books, null, 2), (err) => {
            if (err) {
                res.statusCode = 500;
                res.end("Serverda xato: kitobni yangilashda muammo yuz berdi");
                return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(books[bookIndex]));
        });
    })
    return;
}

// book :id delete
if(req.method === 'DELETE' && urlParts[1] === 'books' && id){
    const bookIndex = books.findIndex((book) => book.id === id);

    if (bookIndex === -1) {
      res.statusCode = 404;
      res.end("Kitob topilmadi");
      return;
    }

    books.splice(bookIndex, 1);

    fs.writeFile(booksPath, JSON.stringify(books, null, 2), (err) => {
        if (err) {
            res.statusCode = 500;
            res.end("Serverda xato: kitobni o'chirishda muammo yuz berdi");
            return;
        }
        res.statusCode = 204;
        res.end();
    });
    return res.end("Kitob muvaffaqiyatli o'chirildi");
}


// books get
if(req.method === 'GET' && urlParts[1] === 'books'){
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(books))
    }else{
    res.statusCode = 404
    res.end("Page not found")
}


// end
})

const PORT = process.env.PORT || 9000

server.listen(PORT, ()=>{
    console.log('Server running on port: ' + PORT)
})