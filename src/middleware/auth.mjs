import jwt from 'jsonwebtoken';

const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou mal formé' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'efrei', (err, decoded) => {
      if (err) {
        res.status(403).json({ error: 'Token invalide' });
      } else {
        req.user = decoded;
        next();
      }

      return null; // ✅ 🔥 correction ESLint ici
    });

    return null;
  } catch (err) {
    console.error('[ERROR] auth middleware ->', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
};

export default verifyJWT;
