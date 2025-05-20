import https from 'https';
import fs from 'fs';
import Server from './src/server.mjs';

// Fonction principale asynchrone pour initialiser le serveur
async function startServer() {
  try {
    // Charger certificat + clé SSL
    const options = {
      key: fs.readFileSync('./server.key'),
      cert: fs.readFileSync('./server.cert')
    };

    // Créer instance du serveur
    const server = new Server();
    
    // Initialiser le serveur sans démarrer HTTP
    const app = await server.run();

    // Démarrer uniquement le serveur HTTPS
    const port = server.config.port || 3000;
    https.createServer(options, app).listen(port, () => {
      console.log(`🔐 HTTPS API en écoute sur https://localhost:${port}`);
      console.log(`📊 Environnement: ${server.config.type}`);
    });
  } catch (err) {
    console.error('🚨 Erreur au démarrage du serveur:', err);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();