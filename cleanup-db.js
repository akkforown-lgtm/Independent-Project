const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ Не найдена переменная MONGODB_URI');
      process.exit(1);
    }

    console.log('🔄 Подключение к MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    const db = mongoose.connection.db;

    // Получить все коллекции
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log('\n📋 Найдено коллекций:', collectionNames);

    // Коллекции которые нужно удалить
    const toDelete = ['users', 'bookings', 'checkouts'];
    
    // Коллекции которые нужно сохранить
    const toKeep = ['rooms'];

    for (const collName of toDelete) {
      if (collectionNames.includes(collName)) {
        await db.collection(collName).deleteMany({});
        console.log(`✅ Очищена коллекция: ${collName}`);
      }
    }

    console.log('\n📦 Коллекции которые сохранены:', toKeep);
    
    // Проверить что rooms осталась
    if (collectionNames.includes('rooms')) {
      const roomCount = await db.collection('rooms').countDocuments();
      console.log(`✅ Rooms сохранена (${roomCount} номеров)`);
    }

    // Проверить что удалили
    const usersCount = await db.collection('users').countDocuments();
    const bookingsCount = await db.collection('bookings').countDocuments();
    
    console.log('\n📊 Финальное состояние базы:');
    console.log(`  Users: ${usersCount}`);
    console.log(`  Bookings: ${bookingsCount}`);
    console.log(`  Rooms: ${await db.collection('rooms').countDocuments()}`);

    await mongoose.disconnect();
    console.log('\n✅ База очищена успешно!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при очистке базы:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
