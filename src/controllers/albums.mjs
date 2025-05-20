import AlbumModel from '../models/album.mjs';
import verifyJWT from '../middleware/auth.mjs'; // ⬅️ ajout du middleware

const Albums = class Albums {
  constructor(app, connect) {
    this.app = app;
    this.AlbumModel = connect.model('Album', AlbumModel);

    this.run();
  }

  showById() {
    this.app.get('/album/:id', (req, res) => {
      try {
        this.AlbumModel.findById(req.params.id).populate('photos').then((album) => {
          res.status(200).json(album || {});
        }).catch(() => {
          res.status(500).json({ code: 500, message: 'Internal Server error' });
        });
      } catch (err) {
        console.error(`[ERROR] albums/:id -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  create() {
    this.app.post('/album/', verifyJWT, (req, res) => { // ⬅️ protégé
      try {
        const albumModel = new this.AlbumModel(req.body);

        albumModel.save().then((album) => {
          res.status(200).json(album || {});
        }).catch(() => {
          res.status(200).json({});
        });
      } catch (err) {
        console.error(`[ERROR] albums/create -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  update() {
    this.app.put('/album/:id', verifyJWT, (req, res) => { // ⬅️ protégé
      try {
        this.AlbumModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
          .then((album) => {
            res.status(200).json(album || {});
          }).catch(() => {
            res.status(500).json({ code: 500, message: 'Internal Server error' });
          });
      } catch (err) {
        console.error(`[ERROR] albums/:id -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  deleteById() {
    this.app.delete('/album/:id', verifyJWT, (req, res) => { // ⬅️ protégé
      try {
        this.AlbumModel.findByIdAndDelete(req.params.id).then((album) => {
          res.status(200).json(album || {});
        }).catch(() => {
          res.status(500).json({ code: 500, message: 'Internal Server error' });
        });
      } catch (err) {
        console.error(`[ERROR] albums/:id -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  filterAll() {
    this.app.get('/albums', (req, res) => {
      const filter = {};

      if (req.query.title) {
        filter.title = { $regex: req.query.title, $options: 'i' };
      }

      try {
        this.AlbumModel.find(filter).then((albums) => {
          res.status(200).json(albums || []);
        }).catch(() => {
          res.status(500).json({ code: 500, message: 'Internal Server error' });
        });
      } catch (err) {
        console.error(`[ERROR] albums -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  run() {
    this.create();
    this.showById();
    this.update();
    this.deleteById();
    this.filterAll();
  }
};

export default Albums;
