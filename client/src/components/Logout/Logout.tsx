import axios from "axios";
import cookie from "js-cookie";

export default function Logout() {
  const removeCookie = (key: string) => {
    if (typeof window !== "undefined") {
      cookie.remove(key, { expires: 1 });
    }
  };

  const logout = async () => {
    await axios({
      method: "get",
      url: `${import.meta.env.VITE_API_URL}api/user/logout`,
      withCredentials: true,
    })
      .then(() => removeCookie("jwt"))
      .catch((err) => console.log(err));

    window.location.href = "/";
  };

  return (
    <div onClick={logout}>
      <i className="fa-solid fa-arrow-right-from-bracket fa-xl"></i>
    </div>
  );
}
