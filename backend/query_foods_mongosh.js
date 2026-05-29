use webdinhduong;
var foods = db.foods.find({ name: { $regex: 'sữa tăng cơ|trứng|dầu|protein|vừng|mè|hạt', $options: 'i' } }).toArray();
foods.forEach(function(f) { print(f.name + ' -> ' + f.imageURL); });
