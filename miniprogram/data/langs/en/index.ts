import home from './modules/home';
import common from './modules/common';
import profile from './modules/profile';
import notification from './modules/notification';
import reservation from './modules/reservation';
import searchResult from './modules/searchResult';
import myReservation from './modules/myReservation';
import myRequests from './modules/myRequests';
import activity from './modules/activity';
import feedback from './modules/feedback';
import credit from './modules/credit';

export default {
  ...common,
  ...home,
  ...profile,
  ...notification,
  ...reservation,
  ...searchResult,
  ...myReservation,
  ...myRequests,
  ...activity,
  ...feedback,
  ...credit,
};
