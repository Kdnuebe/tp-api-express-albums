import Users from './users.mjs';
import Albums from './albums.mjs';
import Photos from './photos.mjs';

const Routes = class Routes {
  constructor(app, connect) {
    this.app = app;
    this.connect = connect;

    new Users(app, connect);
    new Albums(app, connect);
    new Photos(app, connect);
  }
};

export default Routes;
