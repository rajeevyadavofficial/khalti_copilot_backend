# Khalti Copilot Backend

REST API backend for **Khalti Quiz Copilot Android App**, persisting verified questions and Cloudinary screenshot URLs to **MongoDB Atlas**.

## Deployment on Render

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your repository: `https://github.com/rajeevyadavofficial/khalti_copilot_backend`.
4. Configure service settings:
   - **Name**: `khalti-copilot-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. Under **Environment Variables**, add:
   - `MONGODB_URI` = `mongodb+srv://rajeevy396_db_user:raj12345@cluster0.z0pgv9c.mongodb.net/?retryWrites=true&w=majority`
6. Click **Create Web Service**.

## API Endpoints

- `GET /` — Health check
- `POST /api/questions` — Upsert question document to MongoDB
- `GET /api/questions` — Retrieve all questions sorted by last updated
- `GET /api/questions/:id` — Retrieve question by key
- `DELETE /api/questions/:id` — Delete question by key
