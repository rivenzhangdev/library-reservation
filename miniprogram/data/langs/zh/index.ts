import home from './modules/home';
import common from './modules/common';
import profile from './modules/profile';
import notification from './modules/notification';

export default {
  ...common,
  ...home,
  ...profile,
  ...notification,
};
