// Dependencies
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config'; // pour charger les .env

// Core
import config from './config.mjs';
import Albums from './controllers/albums.mjs';
import Photos from './controllers/photos.mjs';
import Users from './controllers/users.mjs'; // Ajouté pour être sûr d'inclure tous les contrôleurs

const Server = class Server {
  constructor() {
    this.app = express();
    this.config = config[process.argv[2]] || config.development;
  }

  async dbConnect() {
    try {
      const host = this.config.mongodb;

      this.connect = await mongoose.createConnection(host, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      const close = () => {
        this.connect.close((error) => {
          if (error) {
            console.error('[ERROR] api dbConnect() close() -> mongodb error', error);
          } else {
            console.log('[CLOSE] api dbConnect() -> mongodb closed');
          }
        });
      };

      this.connect.on('error', (err) => {
        setTimeout(() => {
          console.log('[ERROR] api dbConnect() -> mongodb error');
          this.connect = this.dbConnect(host);
        }, 5000);

        console.error(`[ERROR] api dbConnect() -> ${err}`);
      });

      this.connect.on('disconnected', () => {
        setTimeout(() => {
          console.log('[DISCONNECTED] api dbConnect() -> mongodb disconnected');
          this.connect = this.dbConnect(host);
        }, 5000);
      });

      process.on('SIGINT', () => {
        close();
        console.log('[API END PROCESS] api dbConnect() -> close mongodb connection');
        process.exit(0);
      });
      
      console.log('[INFO] Connexion à MongoDB établie avec succès');
    } catch (err) {
      console.error(`[ERROR] api dbConnect() -> ${err}`);
    }
  }

  security() {
    // Utiliser Helmet pour les en-têtes de sécurité HTTP
    this.app.use(helmet());
    this.app.disable('x-powered-by');

    // Rate limiter: 100 requêtes max par heure
    const limiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 heure
      max: 100,
      standardHeaders: true, // Renvoie les headers 'RateLimit-*'
      legacyHeaders: false, // Désactive les headers 'X-RateLimit-*'
      message: { error: 'Trop de requêtes, réessayez plus tard.' }
    });

    // Appliquer le rate limiter à toutes les routes
    this.app.use(limiter);
  }

  middleware() {
    // Compression pour réduire la taille des réponses
    this.app.use(compression());
    
    // Configuration CORS pour contrôler l'accès aux ressources
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS || '*', // Idéalement, spécifiez les origines exactes en production
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Parser pour le corps des requêtes
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());

    // Logger simple pour les requêtes (en dev)
    if (this.config.type === 'development') {
      this.app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
      });
    }
  }

  routes() {
    // Initialiser tous les contrôleurs
    new Users(this.app, this.connect);
    new Albums(this.app, this.connect);
    new Photos(this.app, this.connect);

    // Route pour vérifier que l'API est en ligne
    this.app.get('/status', (req, res) => {
      res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString()
      });
    });

    // Middleware 404 pour les routes non trouvées
    this.app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: 'Not Found'
      });
    });
  }

  async run() {
    try {
      // Connexion à la base de données
      await this.dbConnect();
      
      // Configuration de la sécurité
      this.security();
      
      // Configuration des middlewares
      this.middleware();
      
      // Configuration des routes
      this.routes();

      // Middleware global de gestion des erreurs
      this.app.use((err, req, res, next) => {
        console.error(`[ERROR] ${err.stack}`);
        // Ne pas exposer les détails techniques en production
        const message = this.config.type === 'production' 
          ? 'Erreur interne serveur' 
          : err.message;
        res.status(500).json({ error: message });
      });

      // NE PAS démarrer le serveur HTTP ici - retirer cette ligne
      // this.app.listen(this.config.port);
      
      // Retourner l'app pour qu'elle puisse être utilisée par le serveur HTTPS dans index.mjs
      return this.app;
    } catch (err) {
      console.error(`[ERROR] Server -> ${err}`);
      throw err; // Propagez l'erreur pour une gestion appropriée
    }
  }
};

export default Server;