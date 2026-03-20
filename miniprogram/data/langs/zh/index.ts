import home from './modules/home';
import common from './modules/common';
import profile from './modules/profile';
import notification from './modules/notification';
import reservation from './modules/reservation';

export default {
  ...common,
  ...home,
  ...profile,
  ...notification,
  ...reservation,
};
