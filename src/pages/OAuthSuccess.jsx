import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (token) {
      localStorage.setItem("auth_token", token);
      navigate("/chat");
    } else {
      navigate("/login");
    }
  }, []);

  return <div>Logging you in...</div>;
}
