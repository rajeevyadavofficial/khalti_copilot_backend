const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://rajeevy396_db_user:raj12345@cluster0.z0pgv9c.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'khalti_db';
const COLLECTION_NAME = 'questions';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let client = null;
let collection = null;

async function getCollection() {
    if (!collection) {
        if (!client) {
            client = new MongoClient(MONGO_URI, {
                maxPoolSize: 20,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 20000
            });
            await client.connect();
            console.log('Connected to MongoDB Atlas successfully.');
        }
        const db = client.db(DB_NAME);
        collection = db.collection(COLLECTION_NAME);
    }
    return collection;
}

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'khalti-copilot-backend',
        timestamp: new Date().toISOString()
    });
});

// Upsert Question
app.post('/api/questions', async (req, res) => {
    try {
        const {
            key,
            question_text,
            correct_answer,
            gemini_suggested,
            gemini_was_correct,
            times_seen,
            confidence,
            screenshot_url
        } = req.body;

        if (!key || !question_text) {
            return res.status(400).json({ error: 'key and question_text are required.' });
        }

        const col = await getCollection();
        const doc = {
            _id: key,
            question_text: question_text.trim(),
            correct_answer: correct_answer || '',
            gemini_suggested: gemini_suggested || '',
            gemini_was_correct: !!gemini_was_correct,
            times_seen: typeof times_seen === 'number' ? times_seen : 1,
            confidence: confidence || 'LOW',
            screenshot_url: screenshot_url || '',
            last_updated: new Date()
        };

        const result = await col.replaceOne({ _id: key }, doc, { upsert: true });
        console.log(`Saved question: ${key} (matched: ${result.matchedCount}, upserted: ${result.upsertedCount})`);

        res.json({ success: true, key, doc });
    } catch (err) {
        console.error('Error saving question:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get All Questions
app.get('/api/questions', async (req, res) => {
    try {
        const col = await getCollection();
        const questions = await col.find().sort({ last_updated: -1 }).toArray();
        res.json({ success: true, count: questions.length, questions });
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get Single Question by Key
app.get('/api/questions/:id', async (req, res) => {
    try {
        const col = await getCollection();
        const doc = await col.findOne({ _id: req.params.id });
        if (!doc) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json({ success: true, question: doc });
    } catch (err) {
        console.error('Error fetching question:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete Question by Key
app.delete('/api/questions/:id', async (req, res) => {
    try {
        const col = await getCollection();
        const result = await col.deleteOne({ _id: req.params.id });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
        console.error('Error deleting question:', err);
        res.status(500).json({ error: err.message });
    }
});

// Clear All Questions
app.delete('/api/questions', async (req, res) => {
    try {
        const col = await getCollection();
        const result = await col.deleteMany({});
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
        console.error('Error clearing questions:', err);
        res.status(500).json({ error: err.message });
    }
});

// Keep-awake self-ping every 10 minutes (600,000 ms)
const PING_INTERVAL_MS = 10 * 60 * 1000;
const SERVER_URL = process.env.RENDER_EXTERNAL_URL || 'https://khalti-copilot-backend.onrender.com';

function startKeepAwake() {
    const https = require('https');
    setInterval(() => {
        try {
            https.get(SERVER_URL, (res) => {
                console.log(`[Keep-Awake Ping] Self-ping status: ${res.statusCode} at ${new Date().toISOString()}`);
            }).on('error', (err) => {
                console.warn(`[Keep-Awake Ping Warning]: ${err.message}`);
            });
        } catch (e) {
            console.error('[Keep-Awake Error]:', e);
        }
    }, PING_INTERVAL_MS);
}

app.listen(PORT, () => {
    console.log(`Khalti Copilot backend running on port ${PORT}`);
    getCollection().catch(err => console.error('Initial MongoDB connection error:', err));
    startKeepAwake();
});
