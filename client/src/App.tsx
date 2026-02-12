import { BrowserRouter } from "react-router-dom";
import Routes from "./components/Routes";
import { useEffect, useContext } from "react";
import { UidContext } from "./components/AppContext";
import { useAppDispatch } from "./hooks/redux";

import { getUser } from "./actions/user.actions";
import { getAllUsers } from "./actions/users.actions";
import { getAllItems } from "./actions/items.actions";
import { getAllContacts } from "./actions/contacts.action";

export default function App() {
  const { uid } = useContext(UidContext);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (uid) {
      dispatch(getUser(uid));
      dispatch(getAllUsers());
      dispatch(getAllItems());
      dispatch(getAllContacts());
    }
  }, [uid, dispatch]);

  return (
    <BrowserRouter>
      <Routes />
    </BrowserRouter>
  );
}
