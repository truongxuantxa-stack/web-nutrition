require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../models');

async function inspect() {
  try {
    await sequelize.authenticate();
    const qi = sequelize.getQueryInterface();

    const tables = await qi.showAllTables();
    console.log('=== TABLES IN DB ===');
    console.log(JSON.stringify(tables));

    for (const table of tables) {
      const cols = await qi.describeTable(table);
      console.log('\n=== TABLE: ' + table + ' ===');
      Object.entries(cols).forEach(([col, def]) => {
        console.log('  ' + col + ' | ' + def.type + ' | null:' + def.allowNull + ' | default:' + def.defaultValue);
      });
    }

    const [rows] = await sequelize.query('SELECT COUNT(*) as cnt FROM foods');
    console.log('\n=== FOOD COUNT === ' + rows[0].cnt);

    const [cats] = await sequelize.query('SELECT category, COUNT(*) as cnt FROM foods GROUP BY category ORDER BY category');
    console.log('=== FOOD CATEGORIES ===');
    cats.forEach(r => console.log('  ' + r.category + ' : ' + r.cnt));

    const [idx] = await sequelize.query('SHOW INDEX FROM diary_entries');
    console.log('\n=== DIARY_ENTRIES INDEXES ===');
    idx.forEach(r => console.log('  ' + r.Key_name + ' | col:' + r.Column_name + ' | unique:' + (r.Non_unique === 0)));

    const [idx2] = await sequelize.query('SHOW INDEX FROM weight_logs');
    console.log('\n=== WEIGHT_LOGS INDEXES ===');
    idx2.forEach(r => console.log('  ' + r.Key_name + ' | col:' + r.Column_name + ' | unique:' + (r.Non_unique === 0)));

  } catch(e) {
    console.error('ERROR: ' + e.message);
  } finally {
    await sequelize.close();
  }
}
inspect();
