require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, dialect: 'mysql', logging: false
});

async function main() {
    await seq.authenticate();

    const ids = [4636,4582,4643,4593,4668,4543,4575,4568,4634,4542,4600,4522,
                 4535,4615,4536,4511,4616,4540,4569,4596,4544,4630,4588,4539,4606,4612,4667];

    const placeholders = ids.map(()=>'?').join(',');
    const [rows] = await seq.query(
        `SELECT id, name, calories, protein, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron, category, foodType
         FROM foods WHERE id IN (${placeholders}) AND deletedAt IS NULL ORDER BY calories`,
        { replacements: ids }
    );
    rows.forEach(r => console.log(JSON.stringify(r)));
    await seq.close(); process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
