import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUser(email, password);

      console.log("LOGIN RESPONSE", response.data);

      const token = response.data.data.token;
      const user = response.data.data.user;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message || "Login failed"
      );
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "350px",
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          ERJA Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
          }}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "20px",
          }}
          required
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#1565c0",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}