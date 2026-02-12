import dotenv from "dotenv";
// En production, les variables d'environnement sont déjà définies par o2switch
// Charge le fichier .env local uniquement si CLIENT_URL n'est pas déjà défini
if (!process.env.CLIENT_URL) {
  dotenv.config({ path: "./config/.env" });
}
import "./config/db";
import app from "./app";

// Server
app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
