import { combineReducers } from "redux";
import userReducer from "./user.reducer";
import usersReducer from "./users.reducer";
import contactsReducer from "./contacts.reducer";
import itemReducer from "./item.reducer";
import itemsReducer from "./items.reducer";
import statisticsReducer from "./statistics.reducer";
import menuReducer from "./menu.reducer";
import clientFilesReducer from "./clientFiles.reducer";
import interventionReportsReducer from "./interventionReports.reducer";

const rootReducer = combineReducers({
  userReducer,
  usersReducer,
  contactsReducer,
  itemReducer,
  itemsReducer,
  statisticsReducer,
  menuReducer,
  clientFilesReducer,
  interventionReportsReducer,
});

export default rootReducer;
