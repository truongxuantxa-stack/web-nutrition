const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/webdinhduong').then(async () => {
    try {
        const db = mongoose.connection;
        const foods = await db.collection('foods').find({ 
            name: { $regex: 'sữa tăng cơ|trứng|dầu|protein|vừng|mè|hạt', $options: 'i' } 
        }).toArray();
        console.log(foods.map(f => f.name + ' -> ' + f.imageURL));
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
});
