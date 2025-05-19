import PhotoModel from '../models/photo.mjs';
import AlbumModel from '../models/album.mjs';

const Photos = class Photos {
  constructor(app, connect) {
    this.app = app;
    this.PhotoModel = connect.model('Photo', PhotoModel);
    this.AlbumModel = connect.model('Album', AlbumModel);

    this.run();
  }

  getAllFromAlbum() {
    this.app.get('/album/:idalbum/photos', (req, res) => {
      try {
        this.PhotoModel.find({ album: req.params.idalbum }).then((photos) => {
          res.status(200).json(photos || []);
        }).catch(() => {
          res.status(500).json({ code: 500, message: 'Internal Server error' });
        });
      } catch (err) {
        console.error(`[ERROR] photos/list -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  getOne() {
    this.app.get('/album/:idalbum/photo/:idphotos', (req, res) => {
      try {
        this.PhotoModel.findOne({
          _id: req.params.idphotos,
          album: req.params.idalbum
        }).then((photo) => {
          res.status(200).json(photo || {});
        }).catch(() => {
          res.status(500).json({ code: 500, message: 'Internal Server error' });
        });
      } catch (err) {
        console.error(`[ERROR] photos/getOne -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  create() {
    this.app.post('/album/:idalbum/photo', (req, res) => {
      try {
        const data = {
          ...req.body,
          album: req.params.idalbum
        };

        const photo = new this.PhotoModel(data);

        photo.save().then((savedPhoto) => {
          // Ajouter la photo dans l'album associé
          this.AlbumModel.findByIdAndUpdate(
            req.params.idalbum,
            { $push: { photos: savedPhoto._id } },
            { new: true }
          ).then(() => {
            res.status(200).json(savedPhoto || {});
          }).catch(() => {
            res.status(500).json({ code: 500, message: 'Internal Server error' });
          });
        }).catch(() => {
          res.status(500).json({ code: 500, message: 'Internal Server error' });
        });
      } catch (err) {
        console.error(`[ERROR] photos/create -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  update() {
    this.app.put('/album/:idalbum/photo/:idphotos', (req, res) => {
      try {
        this.PhotoModel.findOneAndUpdate(
          {
            _id: req.params.idphotos,
            album: req.params.idalbum
          },
          req.body,
          { new: true }
        ).then((photo) => {
          res.status(200).json(photo || {});
        }).catch(() => {
          res.status(500).json({ code: 500, message: 'Internal Server error' });
        });
      } catch (err) {
        console.error(`[ERROR] photos/update -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  delete() {
    this.app.delete('/album/:idalbum/photo/:idphotos', (req, res) => {
      try {
        this.PhotoModel.findOneAndDelete({
          _id: req.params.idphotos,
          album: req.params.idalbum
        }).then((photo) => {
          if (photo) {
            this.AlbumModel.findByIdAndUpdate(
              req.params.idalbum,
              { $pull: { photos: req.params.idphotos } }
            ).then(() => {
              res.status(200).json(photo);
            }).catch(() => {
              res.status(500).json({ code: 500, message: 'Internal Server error' });
            });
          } else {
            res.status(404).json({ code: 404, message: 'Photo not found' });
          }
        }).catch(() => {
          res.status(500).json({ code: 500, message: 'Internal Server error' });
        });
      } catch (err) {
        console.error(`[ERROR] photos/delete -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  run() {
    this.getAllFromAlbum();
    this.getOne();
    this.create();
    this.update();
    this.delete();
  }
};

export default Photos;
