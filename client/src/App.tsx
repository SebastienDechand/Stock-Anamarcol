import { BrowserRouter } from "react-router-dom";
import Routes from "./components/Routes";
import { useEffect, useContext } from "react";
import { UidContext } from "./components/AppContext";
import { useAppDispatch } from "./hooks/redux";

import { getUser } from "./actions/user.actions";
import { getAllUsers } from "./actions/users.actions";
import { getAllItems } from "./actions/items.actions";
import { getAllContacts } from "./actions/contacts.action";
import { getAllClientFiles } from "./actions/clientFile.actions";
import { getAllInterventionReports } from "./actions/interventionReport.actions";
import { getAllVehicles } from "./actions/vehicles.actions";

export default function App() {
  const { uid } = useContext(UidContext);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (uid) {
      dispatch(getUser(uid));
      dispatch(getAllUsers());
      dispatch(getAllItems());
      dispatch(getAllContacts());
      dispatch(
        getAllClientFiles() as unknown as Parameters<typeof dispatch>[0],
      );
      dispatch(
        getAllInterventionReports() as unknown as Parameters<
          typeof dispatch
        >[0],
      );
      dispatch(getAllVehicles() as unknown as Parameters<typeof dispatch>[0]);
    }
  }, [uid, dispatch]);

  return (
    <BrowserRouter>
      <Routes />
    </BrowserRouter>
  );
}
